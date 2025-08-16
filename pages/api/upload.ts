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

// EC2 환경에서 tmp 디렉토리 설정
const getUploadDir = () => {
  if (process.env.NODE_ENV === 'production') {
    // EC2 환경에서는 프로젝트 내 tmp 디렉토리 사용
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  }
  return '/tmp'; // 개발 환경에서는 /tmp 사용
};

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
      maxContentLength: 25 * 1024 * 1024, // 25MB (20MB + 여유분)
      maxBodyLength: 25 * 1024 * 1024
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
    // EC2 변환 에러
    
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

  console.log('=== 업로드 API 시작 ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('EC2_SERVER_URL:', EC2_SERVER_URL);
  console.log('uploadDir:', getUploadDir());

  const form = new IncomingForm({
    uploadDir: getUploadDir(), // EC2 환경에 맞는 디렉토리 사용
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024, // 20MB 제한으로 증가
    maxFields: 10,
    allowEmptyFiles: false,
    // 추가 설정
    multiples: true,
    maxFieldsSize: 20 * 1024 * 1024, // 필드 크기도 20MB로 증가
  });

  form.parse(req, async (err, fields, files) => {
    // 폼 파싱 결과 처리
    
    if (err) {
      // 폼 파싱 오류
      return res.status(500).json({ message: 'アップロード中にエラーが発生しました。' });
    }

    try {
      const fileArray = Array.isArray(files.file) ? files.file : [files.file];
      // 파일 배열 처리
      const uploadedResults: any[] = [];

      for (const file of fileArray) {
        if (!file) continue;
        
        const filepath = (file as any).filepath || (file as any).path;
        const originalFilename = (file as any).originalFilename || 'upload.jpg';
        const mimetype = (file as any).mimetype || 'image/jpeg';
        
        // 파일 처리
        
        if (!filepath || !fs.existsSync(filepath)) {
          return res.status(400).json({ message: 'ファイルが見つかりません。' });
        }
        
        // 용량 제한 (20MB)
        const MAX_FILE_SIZE = 20 * 1024 * 1024;
        const fileSize = fs.statSync(filepath).size;
        // 파일 크기 확인
        
        if (fileSize > MAX_FILE_SIZE) {
          fs.unlinkSync(filepath);
          return res.status(400).json({ message: 'ファイルサイズが20MBを超えています。' });
        }
        
        // 이미지/움짤 파일 실제 디코딩 검사 (sharp)
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(originalFilename)) {
          try {
            await sharp(filepath).metadata();
          } catch (e: any) {
            fs.unlinkSync(filepath);
            return res.status(400).json({ message: '画像ファイルが正しくありません。' });
          }
        }
        
        let folder = '';
        if (fields && fields.folder) {
          folder = String(fields.folder);
        }
        // 폴더 설정
        
        // GIF/WEBP 분기 (EC2 서버를 사용해서 MP4로 변환)
        if (/\.(gif|webp)$/i.test(originalFilename)) {
          let mp4Path: string | null = null;
          try {
            // EC2 서버로 변환 요청
            mp4Path = await convertGifOnEC2(filepath, originalFilename);
            const mp4Url = await uploadToS3(mp4Path, originalFilename.replace(/\.(gif|webp)$/i, '.mp4'), 'video/mp4', folder);
            uploadedResults.push({ mp4Url });
          } catch (error: any) {
            throw error;
          } finally {
            // 에러가 발생해도 임시 파일 정리
            try {
              if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
              if (mp4Path && fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
            } catch (cleanupError) {
              // 임시 파일 정리 실패 무시
            }
          }
        } else {
          try {
            const url = await uploadToS3(filepath, originalFilename, mimetype, folder);
            uploadedResults.push({ url });
          } catch (error) {
            throw error;
          } finally {
            // 에러가 발생해도 임시 파일 정리
            try {
              if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            } catch (cleanupError) {
              // 임시 파일 정리 실패 무시
            }
          }
        }
      }
      
      // 업로드 완료
      return res.status(200).json({ results: uploadedResults });
    } catch (error: any) {
      // 업로드 에러 처리
      
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
