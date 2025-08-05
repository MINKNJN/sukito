import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { uploadToS3 } from '@/lib/aws-s3';
import { convertGifToMp4, extractFirstFrame } from '@/lib/ffmpeg';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// EC2 배포 시 로컬 Express 서버 사용
const EC2_SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:3001' 
  : (process.env.EC2_SERVER_URL || 'http://localhost:3001');

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
    // FormData 생성 - 파일 버퍼 사용 (더 안정적)
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filepath);
    formData.append('gif', fileBuffer, {
      filename: originalFilename,
      contentType: 'image/gif'
    });

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
    
    const result = response.data;
    if (!result.success) {
      throw new Error(result.message || '変換 失敗');
    }

    // 변환된 파일 다운로드
    const downloadUrl = `${EC2_SERVER_URL}${result.data.downloadUrl}`;
    
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

    return tempMp4Path;
  } catch (error: any) {
    console.error('EC2変換エラー:', error);
    
    // 구체적인 에러 메시지 제공
    if (error.code === 'ECONNREFUSED') {
      throw new Error('EC2サーバーに接続できません。サーバーが停止している可能性があります。');
    }
    if (error.code === 'ENOTFOUND') {
      throw new Error('EC2サーバーのアドレスが見つかりません。');
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error('EC2サーバーへの接続がタイムアウトしました。');
    }
    
    throw error;
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    // Vercel 함수 크기 제한 늘리기
    maxDuration: 60,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'メソッドが許可されていません。' });
  }

  const form = new IncomingForm({
    uploadDir: '/tmp', // Vercel 환경에서는 /tmp 사용
    keepExtensions: true,
    maxFileSize: 15 * 1024 * 1024, // 15MB 제한 (Vercel 제한은 개별 파일)
    maxFields: 10,
    allowEmptyFiles: false,
    // 추가 설정
    multiples: true,
    maxFieldsSize: 15 * 1024 * 1024, // 필드 크기도 15MB
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
        
        if (!filepath || !fs.existsSync(filepath)) {
          console.error('無効なファイルパス:', filepath);
          return res.status(400).json({ message: 'ファイルが見つかりません。' });
        }
        
        // 용량 제한 (15MB)
        const MAX_FILE_SIZE = 15 * 1024 * 1024;
        const fileSize = fs.statSync(filepath).size;
        
        if (fileSize > MAX_FILE_SIZE) {
          fs.unlinkSync(filepath);
          return res.status(400).json({ message: 'ファイルサイズが15MBを超えています。' });
        }
        
        // 이미지/움짤 파일 실제 디코딩 검사 (sharp)
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(originalFilename)) {
          try {
            await sharp(filepath).metadata();
          } catch (e: any) {
            console.error('이미지 파일 검증 실패:', e);
            fs.unlinkSync(filepath);
            return res.status(400).json({ message: '画像ファイルが正しくありません。' });
          }
        }
        
        let folder = '';
        if (fields && fields.folder) {
          folder = String(fields.folder);
        }
        
        // GIF/WEBP 분기 (EC2 서버를 사용해서 MP4로 변환)
        if (/\.(gif|webp)$/i.test(originalFilename)) {
          let mp4Path: string | null = null;
          try {
            // EC2 서버로 변환 요청
            mp4Path = await convertGifOnEC2(filepath, originalFilename);
            const mp4Url = await uploadToS3(mp4Path, originalFilename.replace(/\.(gif|webp)$/i, '.mp4'), 'video/mp4', folder);
            uploadedResults.push({ mp4Url });
          } catch (error: any) {
            console.error('GIF/WEBP 변환 실패:', error);
            throw error;
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
          } catch (error) {
            console.error('S3 업로드 실패:', error);
            throw error;
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
    } catch (error: any) {
      console.error('[アップロードエラー]', error);
      console.error('업로드 에러 상세:', error.message);
      
      // 구체적인 에러 메시지 제공
      let errorMessage = 'アップロード中にエラーが発生しました。';
      if (error.message.includes('Sharp')) {
        errorMessage = '画像ファイルの処理中にエラーが発生しました。';
      } else if (error.message.includes('S3')) {
        errorMessage = 'ファイルの保存中にエラーが発生しました。';
      } else if (error.message.includes('EC2')) {
        errorMessage = 'ファイル変換中にエラーが発生しました。';
      }
      
      return res.status(500).json({ message: errorMessage });
    }
  });
}
