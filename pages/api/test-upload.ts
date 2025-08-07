import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== 테스트 업로드 API 시작 ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('process.cwd():', process.cwd());
    
    // tmp 디렉토리 확인
    const tmpDir = path.join(process.cwd(), 'tmp');
    console.log('tmpDir:', tmpDir);
    console.log('tmpDir exists:', fs.existsSync(tmpDir));
    
    // 디렉토리 생성 시도
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
        console.log('tmp 디렉토리 생성 성공');
      } catch (error) {
        console.error('tmp 디렉토리 생성 실패:', error);
        return res.status(500).json({ 
          message: 'tmp 디렉토리 생성 실패',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // 테스트 파일 생성
    const testFile = path.join(tmpDir, 'test.txt');
    try {
      fs.writeFileSync(testFile, 'test content');
      console.log('테스트 파일 생성 성공:', testFile);
      
      // 파일 읽기 테스트
      const content = fs.readFileSync(testFile, 'utf8');
      console.log('파일 읽기 성공:', content);
      
      // 파일 삭제
      fs.unlinkSync(testFile);
      console.log('테스트 파일 삭제 성공');
      
      return res.status(200).json({ 
        message: '테스트 성공',
        tmpDir,
        tmpDirExists: fs.existsSync(tmpDir),
        tmpDirWritable: true
      });
    } catch (error) {
      console.error('파일 작업 실패:', error);
      return res.status(500).json({ 
        message: '파일 작업 실패',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } catch (error) {
    console.error('테스트 API 에러:', error);
    return res.status(500).json({ 
      message: '테스트 API 에러',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
