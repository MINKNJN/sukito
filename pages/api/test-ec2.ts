import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'GET 메서드만 허용됩니다.' });
  }

  const EC2_SERVER_URL = process.env.EC2_SERVER_URL || 'http://43.206.135.190:3001';
  
  console.log('EC2 연결 테스트 시작:', EC2_SERVER_URL);

  try {
    const axios = require('axios');
    
    // 1. 헬스체크
    console.log('1. 헬스체크 시도...');
    const healthResponse = await axios.get(`${EC2_SERVER_URL}/health`, {
      timeout: 10000
    });
    console.log('헬스체크 성공:', healthResponse.data);

    // 2. 간단한 파일 업로드 테스트
    console.log('2. 파일 업로드 테스트 시도...');
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');
    
    // 테스트용 작은 GIF 파일 생성 (1x1 픽셀)
    const testGifPath = path.join(process.cwd(), 'tmp', 'test.gif');
    const testGifBuffer = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
    ]);
    
    // tmp 폴더가 없으면 생성
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    fs.writeFileSync(testGifPath, testGifBuffer);
    
    const formData = new FormData();
    formData.append('gif', testGifBuffer, {
      filename: 'test.gif',
      contentType: 'image/gif'
    });

    const uploadResponse = await axios.post(`${EC2_SERVER_URL}/convert`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Accept': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('파일 업로드 테스트 성공:', uploadResponse.data);
    
    // 테스트 파일 정리
    if (fs.existsSync(testGifPath)) {
      fs.unlinkSync(testGifPath);
    }

    return res.status(200).json({
      success: true,
      message: 'EC2 연결 테스트 성공',
      health: healthResponse.data,
      upload: uploadResponse.data
    });

  } catch (error: any) {
    console.error('EC2 연결 테스트 실패:', error);
    
    let errorMessage = '알 수 없는 오류';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'EC2 서버에 연결할 수 없습니다';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'EC2 서버 주소를 찾을 수 없습니다';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'EC2 서버 연결이 타임아웃되었습니다';
    } else if (error.response) {
      errorMessage = `EC2 서버 응답 오류: ${error.response.status}`;
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      code: error.code
    });
  }
} 