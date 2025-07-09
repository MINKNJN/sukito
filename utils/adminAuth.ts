import jwt from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';

export function requireAdmin(req: NextApiRequest, res: NextApiResponse): boolean {
  const auth = req.headers.authorization;
  if (!auth) {
    res.status(401).json({ message: '認証が必要です。' });
    return true;
  }
  const token = auth.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded !== 'object' || decoded.role !== 'admin') {
      res.status(403).json({ message: '管理者権限が必要です。' });
      return true;
    }
    (req as any).user = decoded;
    return false; // 통과
  } catch {
    res.status(401).json({ message: 'トークンが無効です。' });
    return true;
  }
} 