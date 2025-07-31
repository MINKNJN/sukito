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
      console.error('EC2サーバー応答ヘッダー:', error.response.headers);
    }
    if (error.code) {
      console.error('EC2エラーコード:', error.code);
    }
    if (error.message) {
      console.error('EC2エラーメッセージ:', error.message);
    }
    
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
  console.log('업로드 API 호출됨:', {
    method: req.method,
    url: req.url,
    EC2_SERVER_URL: process.env.EC2_SERVER_URL
  });
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'メソッドが許可されていません。' });
  }

  const form = new IncomingForm({
    uploadDir: '/tmp', // Vercel 환경에서는 /tmp 사용
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB 제한 (Vercel 제한 고려)
    maxFields: 10,
    allowEmptyFiles: false,
    // 추가 설정
    multiples: true,
    maxFieldsSize: 10 * 1024 * 1024, // 필드 크기도 10MB
  });

  form.parse(req, async (err, fields, files) => {
    console.log('업로드 요청 시작:', { 
      method: req.method, 
      url: req.url, 
      userAgent: req.headers['user-agent'],
      origin: req.headers['origin'],
      host: req.headers['host']
    });
    console.log('필드 정보:', fields);
    console.log('파일 정보:', files);
    
    if (err) {
      console.error('フォーム解析エラー:', err);
      return res.status(500).json({ message: 'アップロード中にエラーが発生しました。' });
    }

    try {
      const fileArray = Array.isArray(files.file) ? files.file : [files.file];
      const uploadedResults: any[] = [];

      console.log('파일 배열:', fileArray);

      for (const file of fileArray) {
        console.log('파일 처리 시작:', file);
        if (!file) { 
          console.log('파일이 없습니다, 건너뜁니다'); 
          continue; 
        }
        
        const filepath = (file as any).filepath || (file as any).path;
        const originalFilename = (file as any).originalFilename || 'upload.jpg';
        const mimetype = (file as any).mimetype || 'image/jpeg';
        
        console.log('파일 정보:', { filepath, originalFilename, mimetype });
        
        if (!filepath || !fs.existsSync(filepath)) {
          console.error('無効なファイルパス:', filepath);
          return res.status(400).json({ message: 'ファイルが見つかりません。' });
        }
        
        // 용량 제한 (10MB)
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        const fileSize = fs.statSync(filepath).size;
        console.log('파일 크기:', { size: fileSize, sizeInMB: (fileSize / (1024 * 1024)).toFixed(2) });
        
        if (fileSize > MAX_FILE_SIZE) {
          fs.unlinkSync(filepath);
          return res.status(400).json({ message: 'ファイルサイズが10MBを超えています。' });
        }
        
        // 이미지/움짤 파일 실제 디코딩 검사 (sharp) - 에러 처리 개선
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(originalFilename)) {
          try {
            await sharp(filepath).metadata(); // 이미지 파일이 아니면 에러 발생
            console.log('이미지 파일 검증 성공:', originalFilename);
          } catch (e: any) {
            console.error('이미지 파일 검증 실패:', e);
            console.error('Sharp 에러 상세:', e.message);
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
          console.log('GIF/WEBP 파일 변환 시작:', originalFilename);
          let mp4Path: string | null = null;
          try {
            // EC2 서버로 변환 요청
            mp4Path = await convertGifOnEC2(filepath, originalFilename);
            console.log('EC2 변환 완료, S3 업로드 시작');
            const mp4Url = await uploadToS3(mp4Path, originalFilename.replace(/\.(gif|webp)$/i, '.mp4'), 'video/mp4', folder);
            console.log('S3 업로드 완료:', mp4Url);
            uploadedResults.push({ mp4Url });
          } catch (error: any) {
            console.error('GIF/WEBP 변환 실패:', error);
            console.error('EC2 변환 에러 상세:', error.message);
            if (error.response) {
              console.error('EC2 응답 데이터:', error.response.data);
              console.error('EC2 응답 상태:', error.response.status);
            }
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
          console.log('일반 이미지 파일 S3 업로드 시작:', originalFilename);
          try {
            const url = await uploadToS3(filepath, originalFilename, mimetype, folder);
            console.log('S3 업로드 완료:', url);
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
      
      console.log('모든 파일 처리 완료:', uploadedResults);
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
