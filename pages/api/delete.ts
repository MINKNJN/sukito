// pages/api/delete.ts
import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb'; // 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '許可されていないリクエスト方式です。' });
  }

  try {
    const { userId, currentPassword } = req.body;

    if (!userId || !currentPassword) {
      return res.status(400).json({ message: '必須項目が抜けています。' });
    }

    const client = await clientPromise;
    const db = client.db('sukito');
    const users = db.collection('users');

    const user = await users.findOne({ _id: new ObjectId(userId) }); 
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '現在のパスワードが一致しません。' });
    }

    await users.deleteOne({ _id: new ObjectId(userId) });

    return res.status(200).json({ message: '会員退会が完了しました。' });
  } catch (err) {
    console.error('delete API エラー:', err);
    return res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
}
