// pages/api/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '許可されていないメソッドです。' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'メールアドレスとパスワードの両方を入力してください。' });
    }

    const client = await clientPromise;
    const db = client.db('sukito');
    const users = db.collection('users');

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: '登録されたメールアドレスではありません。' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'パスワードが一致しません。' });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        nickname: user.nickname,
        email: user.email,
        role: user.role || 'user',
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' } 
    );

    return res.status(200).json({
      message: 'ログイン成功',
      userId: user._id.toString(),
      nickname: user.nickname,
      email: user.email,
      role: user.role || 'user',
      token,
    });
  } catch (err) {
    console.error('ログイン API エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}
