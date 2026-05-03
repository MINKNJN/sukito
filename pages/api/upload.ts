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

// EC2 서버로 MP4 썸네일만 추출
async function extractThumbFromMp4OnEC2(filepath: string, originalFilename: string): Promise<string | null> {
  const axios = require('axios');
  const FormData = require('form-data');

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filepath);
  formData.append('mp4', fileBuffer, { filename: originalFilename, contentType: 'video/mp4' });

  const response = await axios.post(`${EC2_SERVER_URL}/thumbnail`, formData, {
    headers: { ...formData.getHeaders() },
    timeout: 30000,
    maxContentLength: 15 * 1024 * 1024,
    maxBodyLength: 15 * 1024 * 1024,
  });

  const result = response.data;
  if (!result.success) return null;

  const thumbResponse = await axios.get(`${EC2_SERVER_URL}${result.data.thumbnailDownloadUrl}`, { responseType: 'arraybuffer', timeout: 30000 });
  const thumbPath = filepath.replace(/\.mp4$/i, '_thumb.jpg');
  fs.writeFileSync(thumbPath, Buffer.from(thumbResponse.data));
  return thumbPath;
}

// EC2 서버로 GIF 변환 + 썸네일 추출 요청
async function convertGifOnEC2WithThumb(filepath: string, originalFilename: string): Promise<{ mp4Path: string; thumbPath: string | null }> {
  const axios = require('axios');
  const FormData = require('form-data');

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filepath);
  formData.append('gif', fileBuffer, { filename: originalFilename, contentType: 'image/gif' });

  const response = await axios.post(`${EC2_SERVER_URL}/convert`, formData, {
    headers: { ...formData.getHeaders(), 'Accept': 'application/json' },
    timeout: 60000,
    maxContentLength: 25 * 1024 * 1024,
    maxBodyLength: 25 * 1024 * 1024,
  });

  const result = response.data;
  if (!result.success) throw new Error(result.message || '変換失敗');

  // MP4 다운로드
  const mp4Response = await axios.get(`${EC2_SERVER_URL}${result.data.downloadUrl}`, { responseType: 'arraybuffer', timeout: 60000 });
  const mp4Path = filepath.replace(/\.(gif|webp)$/i, '.mp4');
  fs.writeFileSync(mp4Path, Buffer.from(mp4Response.data));

  // 썸네일 다운로드 (있을 경우)
  let thumbPath: string | null = null;
  if (result.data.thumbnailDownloadUrl) {
    try {
      const thumbResponse = await axios.get(`${EC2_SERVER_URL}${result.data.thumbnailDownloadUrl}`, { responseType: 'arraybuffer', timeout: 30000 });
      thumbPath = filepath.replace(/\.(gif|webp)$/i, '_thumb.jpg');
      fs.writeFileSync(thumbPath, Buffer.from(thumbResponse.data));
    } catch {
      // 썸네일 실패해도 MP4는 계속 진행
    }
  }

  return { mp4Path, thumbPath };
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
        
        const fileSize = fs.statSync(filepath).size;
        const isMp4 = /\.mp4$/i.test(originalFilename);
        const isGifWebp = /\.(gif|webp)$/i.test(originalFilename);

        // 용량 제한: MP4는 10MB, 그 외는 20MB
        const MAX_FILE_SIZE = isMp4 ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
        if (fileSize > MAX_FILE_SIZE) {
          fs.unlinkSync(filepath);
          return res.status(400).json({ message: isMp4 ? 'MP4ファイルは10MB以下のみアップロード可能です。' : 'ファイルサイズが20MBを超えています。' });
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

        // MP4 분기: 변환 없이 S3 직접 업로드 + EC2에서 썸네일만 추출
        if (isMp4) {
          let thumbPath: string | null = null;
          try {
            const baseName = originalFilename.replace(/\.mp4$/i, '');
            const mp4Url = await uploadToS3(filepath, originalFilename, 'video/mp4', folder);

            try {
              thumbPath = await extractThumbFromMp4OnEC2(filepath, originalFilename);
            } catch {
              // 썸네일 추출 실패해도 mp4 업로드는 유지
            }

            let thumbnailUrl: string | undefined;
            if (thumbPath && fs.existsSync(thumbPath)) {
              thumbnailUrl = await uploadToS3(thumbPath, baseName + '_thumb.jpg', 'image/jpeg', folder);
            }

            uploadedResults.push({ mp4Url, thumbnailUrl });
          } finally {
            try {
              if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
              if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
            } catch {}
          }
        // GIF/WEBP 분기: EC2에서 MP4로 변환 + 썸네일 추출
        } else if (isGifWebp) {
          let mp4Path: string | null = null;
          let thumbPath: string | null = null;
          try {
            const result = await convertGifOnEC2WithThumb(filepath, originalFilename);
            mp4Path = result.mp4Path;
            thumbPath = result.thumbPath;

            const baseName = originalFilename.replace(/\.(gif|webp)$/i, '');
            const mp4Url = await uploadToS3(mp4Path, baseName + '.mp4', 'video/mp4', folder);

            let thumbnailUrl: string | undefined;
            if (thumbPath && fs.existsSync(thumbPath)) {
              thumbnailUrl = await uploadToS3(thumbPath, baseName + '_thumb.jpg', 'image/jpeg', folder);
            }

            uploadedResults.push({ mp4Url, thumbnailUrl });
          } catch (error: any) {
            throw error;
          } finally {
            try {
              if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
              if (mp4Path && fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
              if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
            } catch {}
          }
        } else {
          try {
            const url = await uploadToS3(filepath, originalFilename, mimetype, folder);
            uploadedResults.push({ url });
          } finally {
            try {
              if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            } catch {}
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
