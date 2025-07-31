import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { uploadToS3 } from '@/lib/aws-s3';
import { convertGifToMp4, extractFirstFrame } from '@/lib/ffmpeg';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// EC2 서버 URL (환경변수로 설정 가능)
const EC2_SERVER_URL = process.env.EC2_SERVER_URL || 'http://43.206.135.190:3001';

// Helper to check if webp is animated
function isAnimatedWebp(filepath: string): boolean {
  const buffer = fs.readFileSync(filepath);
  return buffer.includes(Buffer.from('ANIM'));
}

// EC2 서버로 GIF 변환 요청 (개선된 버전 - axios 사용)
async function convertGifOnEC2(filepath: string, originalFilename: string): Promise<string> {
  const axios = require('axios');
  const FormData = require('form-data');
  
  try {
    console.log('EC2変換開始:', { filepath, originalFilename });
    
    // 파일 존재 여부와 크기 확인
    const fileStats = fs.statSync(filepath);
    console.log('ファイル情報:', {
      exists: fs.existsSync(filepath),
      size: fileStats.size,
      sizeInMB: (fileStats.size / (1024 * 1024)).toFixed(2)
    });

    // FormData 생성 - 파일 버퍼 사용 (더 안정적)
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filepath);
    formData.append('gif', fileBuffer, {
      filename: originalFilename,
      contentType: 'image/gif'
    });

    console.log('EC2サーバーにリクエスト送信:', `${EC2_SERVER_URL}/convert`);
    
    // axios로 요청 전송 (fetch보다 안정적)
    const response = await axios.post(`${EC2_SERVER_URL}/convert`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Accept': 'application/json'
      },
      timeout: 60000, // 60초 타임아웃
      maxContentLength: 50 * 1024 * 1024, // 50MB
      maxBodyLength: 50 * 1024 * 1024
    });

    console.log('EC2サーバー応答状態:', response.status);
    console.log('EC2変換結果:', response.data);
    
    const result = response.data;
    if (!result.success) {
      throw new Error(result.message || '変換 失敗');
    }

    // 변환된 파일 다운로드
    const downloadUrl = `${EC2_SERVER_URL}${result.data.downloadUrl}`;
    console.log('ダウンロードURL:', downloadUrl);
    
    const downloadResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 60000
    });
    
    if (downloadResponse.status !== 200) {
      throw new Error('変換されたファイルのダウンロードに失敗しました');
    }

    // 임시 파일로 저장
    const tempMp4Path = filepath.replace(/\.(gif|webp)$/i, '.mp4');
    fs.writeFileSync(tempMp4Path, Buffer.from(downloadResponse.data));
    console.log('一時MP4ファイル保存完了:', tempMp4Path);

    return tempMp4Path;
  } catch (error: any) {
    console.error('EC2変換エラー:', error);
    if (error.response) {
      console.error('EC2サーバー応答データ:', error.response.data);
      console.error('EC2サーバー応答状態:', error.response.status);
    }
    throw error;
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'メソッドが許可されていません。' });
  }

  const form = new IncomingForm({
    uploadDir: '/tmp', // Vercel 환경에서는 /tmp 사용
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('フォーム解析エラー:', err);
      return res.status(500).json({ message: 'アップロード中にエラーが発生しました。' });
    }

    try {
      const fileArray = Array.isArray(files.file) ? files.file : [files.file];
      const uploadedResults: any[] = [];

      for (const file of fileArray) {
        if (!file) continue;
        const filepath = (file as any).filepath || (file as any).path;
        const originalFilename = (file as any).originalFilename || 'upload.jpg';
        const mimetype = (file as any).mimetype || 'image/jpeg';
        let folder = '';
        if (fields && fields.folder) {
          folder = String(fields.folder);
        }
        if (!filepath || !fs.existsSync(filepath)) {
          console.error('無効なファイルパス:', filepath);
          return res.status(400).json({ message: 'ファイルが見つかりません。' });
        }
        // 용량 제한 (15MB)
        const MAX_FILE_SIZE = 15 * 1024 * 1024;
        if (fs.statSync(filepath).size > MAX_FILE_SIZE) {
          fs.unlinkSync(filepath);
          return res.status(400).json({ message: 'ファイルサイズが15MBを超えています。' });
        }
        // 이미지/움짤 파일 실제 디코딩 검사 (sharp)
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(originalFilename)) {
          try {
            await sharp(filepath).metadata(); // 이미지 파일이 아니면 에러 발생
          } catch (e) {
            fs.unlinkSync(filepath);
            return res.status(400).json({ message: '画像ファイルが正しくありません。' });
          }
        }
        // GIF/WEBP 분기 (EC2 서버를 사용해서 MP4로 변환)
        if (/\.(gif|webp)$/i.test(originalFilename)) {
          let mp4Path: string | null = null;
          try {
            // EC2 서버로 변환 요청
            mp4Path = await convertGifOnEC2(filepath, originalFilename);
            const mp4Url = await uploadToS3(mp4Path, originalFilename.replace(/\.(gif|webp)$/i, '.mp4'), 'video/mp4', folder);
            uploadedResults.push({ mp4Url });
          } finally {
            // 에러가 발생해도 임시 파일 정리
            try {
              if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
              if (mp4Path && fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
            } catch (cleanupError) {
              console.error('임시 파일 정리 실패:', cleanupError);
            }
          }
        } else {
          try {
            const url = await uploadToS3(filepath, originalFilename, mimetype, folder);
            uploadedResults.push({ url });
          } finally {
            // 에러가 발생해도 임시 파일 정리
            try {
              if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            } catch (cleanupError) {
              console.error('임시 파일 정리 실패:', cleanupError);
            }
          }
        }
      }
      return res.status(200).json({ results: uploadedResults });
    } catch (error) {
      console.error('[アップロードエラー]', error);
      return res.status(500).json({ message: 'アップロード中にエラーが発生しました。' });
    }
  });
}
