import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET 요청도 허용 (테스트용)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 테스트 업로드 API 시작
    
    // tmp 디렉토리 확인
    const tmpDir = path.join(process.cwd(), 'tmp');
    
    // 디렉토리 생성 시도
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch (error) {
        // tmp 디렉토리 생성 실패
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
      
      // 파일 읽기 테스트
      const content = fs.readFileSync(testFile, 'utf8');
      
      // 파일 삭제
      fs.unlinkSync(testFile);
      
      return res.status(200).json({ 
        message: '테스트 성공',
        tmpDir,
        tmpDirExists: fs.existsSync(tmpDir),
        tmpDirWritable: true,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // 파일 작업 실패
      return res.status(500).json({ 
        message: '파일 작업 실패',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } catch (error) {
    // 테스트 API 에러
    return res.status(500).json({ 
      message: '테스트 API 에러',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
