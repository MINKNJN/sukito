// api/upload-gif.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { v2 as cloudinary } from 'cloudinary';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const config = {
  api: {
    bodyParser: false,
  },
};

cloudinary.config({
  cloud_name: 'dpow8xm10',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadGif = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(405).end('許可されていないメソッドです');

  const form = new IncomingForm({ uploadDir: './public/temp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ フォーム解析に失敗:', err);
      return res.status(500).json({ error: 'アップロード処理に失敗しました。' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const inputPath = file?.filepath;

    if (!inputPath || !fs.existsSync(inputPath)) {
      console.error('❌ ファイルパスが存在しません');
      return res.status(400).json({ error: 'ファイルが見つかりません。' });
    }

    const ext = path.extname(inputPath || '').toLowerCase();
    if (ext !== '.gif') {
      return res.status(400).json({ error: 'GIF のみアップロード可能です。' });
    }

    const outputPath = inputPath.replace(/\.gif$/i, '.mp4');

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .inputFormat('gif')
          .outputOptions('-movflags', '+faststart')
          .outputOptions('-pix_fmt', 'yuv420p')
          .outputOptions('-vf', 'scale=640:-2,fps=15')
          .outputOptions('-c:v', 'libx264')
          .toFormat('mp4')
          .on('end', () => resolve())
          .on('error', (err) => {
            console.error('❌ FFmpeg 変換エラー:', err);
            reject(err);
          })
          .save(outputPath);
      });

      const result = await cloudinary.uploader.upload(outputPath, {
        resource_type: 'video',
        public_id: path.basename(outputPath, '.mp4'),
      });

      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

      return res.status(200).json({ secure_url: result.secure_url });
    } catch (error) {
      console.error('❌ 全体処理失敗:', error);
      return res.status(500).json({ error: '変換またはアップロードに失敗しました。' });
    }
  });
};

export default uploadGif;
