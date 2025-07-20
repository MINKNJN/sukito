// /pages/api/jwt.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET!;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'ログインが必要です。' });
  }

  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY) as {
      userId: string;
      email: string;
      nickname: string;
    };

    return res.status(200).json({
      user: {
        userId: decoded.userId,
        userName: decoded.nickname,
        email: decoded.email,
      },
      userId: decoded.userId, // 하위 호환
      email: decoded.email,
      nickname: decoded.nickname,
    });
  } catch (err) {
    return res.status(401).json({ message: 'トークンが無効です。' });
  }
}
