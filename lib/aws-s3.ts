import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// S3 client settings
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

// Function to upload file to S3 (folder name parameter added)
export async function uploadToS3(filepath: string, originalFilename: string, mimeType: string, folder?: string): Promise<string> {
  try {
    // 1. Extract file extension (.jpg, .gif, etc.)
    const ext = path.extname(originalFilename) || '.jpg';
    const filename = `${uuidv4()}${ext}`;
    const key = folder ? `${folder}/${filename}` : filename;

    // 2. Read file (add check log to fix path issue)
    if (!fs.existsSync(filepath)) {
      throw new Error(`ファイルが見つかりません: ${filepath}`);
    }

    const fileContent = fs.readFileSync(filepath);

    // 3. Set S3 upload parameters (ACL removed)
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: fileContent,
      ContentType: mimeType,
    };

    // 4. Perform upload
    await s3.upload(uploadParams).promise();

    // 5. Generate CloudFront URL
    const url = `${process.env.CLOUDFRONT_URL}/${key}`;
    return url;
  } catch (error) {
    console.error('🚨 S3 upload error:', error);
    throw error;
  }
}

// S3에서 파일 삭제
export async function deleteFromS3(urlOrKey: string): Promise<void> {
  try {
    // url이 들어오면 key만 추출
    let key = urlOrKey;
    if (key.startsWith('http')) {
      const url = new URL(key);
      key = url.pathname.replace(/^\//, '');
    }
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    }).promise();
  } catch (error) {
    console.error('🚨 S3 delete error:', error);
    // 失敗してもthrowしない (既に削除された場合など)
  }
}
