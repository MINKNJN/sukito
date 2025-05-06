// /pages/api/check-email.ts

import dbConnect from '@/utils/dbConnect';
import User from '@/models/User';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'このメールアドレスは既に使用されています。' });
  }

  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'メールアドレスを入力してください。' });
  }

  try {
    await dbConnect();
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error('エラー:', error);
    return res.status(500).json({ message: 'エラー' });
  }
}
