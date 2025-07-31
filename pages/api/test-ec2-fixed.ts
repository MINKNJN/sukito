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

    // 2. 더 큰 테스트 GIF 파일 생성 (10x10 픽셀)
    console.log('2. 파일 업로드 테스트 시도...');
    const FormData = require('form-data');
    
    // 더 큰 테스트 GIF 파일 (10x10 픽셀, 애니메이션)
    const testGifBuffer = Buffer.from([
      // GIF 헤더
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x0A, 0x00, 0x0A, 0x00, 0x91, 0x00, 0x00,
      // 글로벌 컬러 테이블
      0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00, 0xFF,
      // 첫 번째 프레임
      0x21, 0xF9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x0A, 0x00, 0x0A, 0x00, 0x00,
      0x02, 0x16, 0x84, 0x8F, 0xA9, 0xCB, 0xED, 0x0F, 0xA3, 0x9C, 0xB4, 0xDA, 0x8B, 0xB3, 0xDE, 0xBC, 0xFB, 0x0F, 0x86, 0xE2, 0x48, 0x96, 0xE6, 0x89, 0xA6, 0xEA, 0xCA, 0xB6, 0xEE, 0x0B, 0x00, 0x00, 0x3B
    ]);
    
    const formData = new FormData();
    formData.append('gif', testGifBuffer, {
      filename: 'test.gif',
      contentType: 'image/gif'
    });

    console.log('EC2 서버에 파일 업로드 요청...');
    const uploadResponse = await axios.post(`${EC2_SERVER_URL}/convert`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Accept': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('파일 업로드 테스트 성공:', uploadResponse.data);

    return res.status(200).json({
      success: true,
      message: 'EC2 연결 및 파일 변환 테스트 성공',
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
      console.error('EC2 서버 응답 데이터:', error.response.data);
      console.error('EC2 서버 응답 헤더:', error.response.headers);
      errorMessage = `EC2 서버 응답 오류: ${error.response.status}`;
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      code: error.code,
      responseData: error.response?.data
    });
  }
} 