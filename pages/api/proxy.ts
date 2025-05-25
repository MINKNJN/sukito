// /pages/api/proxy.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).send('잘못된 요청입니다.');
  }

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).send('이미지 다운로드 실패');
  }
}
