import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'GET 메서드만 허용됩니다.' });
  }

  const EC2_SERVER_URL = process.env.EC2_SERVER_URL || 'http://43.206.135.190:3001';
  
  console.log('EC2 연결 테스트 시작:', EC2_SERVER_URL);

  try {
    const axios = require('axios');
    
    // 헬스체크만 테스트
    console.log('헬스체크 시도...');
    const healthResponse = await axios.get(`${EC2_SERVER_URL}/health`, {
      timeout: 10000
    });
    console.log('헬스체크 성공:', healthResponse.data);

    return res.status(200).json({
      success: true,
      message: 'EC2 연결 테스트 성공',
      health: healthResponse.data
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