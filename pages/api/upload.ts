import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { uploadToS3 } from '@/lib/aws-s3';
import { convertGifToMp4, extractFirstFrame } from '@/lib/ffmpeg';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// EC2 서버 URL (환경변수로 설정 가능)
const EC2_SERVER_URL = process.env.EC2_SERVER_URL || 'http://your-ec2-public-ip:3001';

// Helper to check if webp is animated
function isAnimatedWebp(filepath: string): boolean {
  const buffer = fs.readFileSync(filepath);
  return buffer.includes(Buffer.from('ANIM'));
}

// EC2 서버로 GIF 변환 요청
async function convertGifOnEC2(filepath: string, originalFilename: string): Promise<string> {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('gif', fs.createReadStream(filepath), originalFilename);

    const response = await fetch(`${EC2_SERVER_URL}/convert`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      throw new Error(`EC2 서버 오류: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '변환 실패');
    }

    // 변환된 파일 다운로드
    const downloadResponse = await fetch(`${EC2_SERVER_URL}${result.data.downloadUrl}`);
    if (!downloadResponse.ok) {
      throw new Error('변환된 파일 다운로드 실패');
    }

    // 임시 파일로 저장
    const tempMp4Path = filepath.replace(/\.(gif|webp)$/i, '.mp4');
    const buffer = await downloadResponse.arrayBuffer();
    fs.writeFileSync(tempMp4Path, Buffer.from(buffer));

    return tempMp4Path;
  } catch (error) {
    console.error('EC2 변환 오류:', error);
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
    uploadDir: path.join(process.cwd(), 'tmp'),
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
        // GIF/WEBP 분기
        if (/\.(gif|webp)$/i.test(originalFilename)) {
          // webp면 동적 webp만 허용
          if (/\.(webp)$/i.test(originalFilename)) {
            if (!isAnimatedWebp(filepath)) {
              fs.unlinkSync(filepath);
              return res.status(400).json({ message: '静止画WEBPはアップロードできません。' });
            }
          }
          
          try {
            // EC2 서버로 변환 요청
            const mp4Path = await convertGifOnEC2(filepath, originalFilename);
            const mp4Url = await uploadToS3(mp4Path, originalFilename.replace(/\.(gif|webp)$/i, '.mp4'), 'video/mp4', folder);
            fs.unlinkSync(filepath);
            fs.unlinkSync(mp4Path);
            uploadedResults.push({ mp4Url });
          } catch (error) {
            console.error('EC2 변환 실패, 로컬 변환으로 폴백:', error);
            // EC2 실패 시 로컬 변환으로 폴백 (기존 코드)
            const mp4Path = filepath.replace(/\.(gif|webp)$/i, '.mp4');
            await convertGifToMp4(filepath, mp4Path);
            const mp4Url = await uploadToS3(mp4Path, originalFilename.replace(/\.(gif|webp)$/i, '.mp4'), 'video/mp4', folder);
            fs.unlinkSync(filepath);
            fs.unlinkSync(mp4Path);
            uploadedResults.push({ mp4Url });
          }
        } else {
          const url = await uploadToS3(filepath, originalFilename, mimetype, folder);
          uploadedResults.push({ url });
          fs.unlinkSync(filepath);
        }
      }
      return res.status(200).json({ results: uploadedResults });
    } catch (error) {
      console.error('[アップロードエラー]', error);
      return res.status(500).json({ message: 'アップロード中にエラーが発生しました。' });
    }
  });
}
