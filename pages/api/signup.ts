// pages/api/signup.ts
import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '許可されていないメソッドです。' });
  }

  try {
    const { nickname, email, password } = req.body;

    if (!nickname || !email || !password) {
      return res.status(400).json({ message: 'すべてのフィールドを入力してください。' });
    }

    const client = await clientPromise;
    const db = client.db('sukito');
    const users = db.collection('users');

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '登録済みのメールアドレスです。' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      nickname,
      email,
      password: hashedPassword,
      role: 'user', 
      createdAt: new Date(),
    };

    await users.insertOne(newUser);

    return res.status(200).json({ message: '会員登録成功' });
  } catch (error) {
    console.error('会員登録 API エラー:', error);
    return res.status(500).json({ message: 'エラー' });
  }
}
