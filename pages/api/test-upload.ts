import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('테스트 업로드 API 호출됨');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'POST 메서드만 허용됩니다.' });
  }

  const form = new IncomingForm({
    uploadDir: '/tmp',
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB 제한
    maxFields: 5,
    allowEmptyFiles: false,
  });

  form.parse(req, async (err, fields, files) => {
    console.log('테스트 업로드 요청 파싱:', { err, fields, files });
    
    if (err) {
      console.error('테스트 폼 파싱 에러:', err);
      return res.status(500).json({ message: '파싱 에러가 발생했습니다.' });
    }

    try {
      const fileArray = Array.isArray(files.file) ? files.file : [files.file];
      console.log('테스트 파일 배열:', fileArray);

      const results = [];
      for (const file of fileArray) {
        if (!file) continue;
        
        const filepath = (file as any).filepath || (file as any).path;
        const originalFilename = (file as any).originalFilename || 'test.jpg';
        
        console.log('테스트 파일 정보:', { filepath, originalFilename });
        
        if (filepath && fs.existsSync(filepath)) {
          const fileSize = fs.statSync(filepath).size;
          console.log('테스트 파일 크기:', fileSize);
          
          // 파일 정리
          fs.unlinkSync(filepath);
          
          results.push({
            filename: originalFilename,
            size: fileSize,
            status: 'success'
          });
        }
      }
      
      console.log('테스트 완료:', results);
      return res.status(200).json({ 
        success: true, 
        message: '테스트 업로드 성공',
        results 
      });
    } catch (error: any) {
      console.error('테스트 업로드 에러:', error);
      return res.status(500).json({ 
        success: false, 
        message: '테스트 업로드 실패',
        error: error.message 
      });
    }
  });
} 