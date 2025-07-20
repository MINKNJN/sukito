import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import path from 'path';

// ffmpeg path explicitly specified
ffmpeg.setFfmpegPath(ffmpegPath.path);

// GIF/WEBP → MP4 conversion
export function convertGifToMp4(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .outputOptions([
        '-movflags faststart',
        '-pix_fmt yuv420p',
        '-profile:v baseline',
        '-level 3.0',
        '-an', // 오디오 제거
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2' // width/height 짝수
      ])
      .toFormat('mp4')
      .save(outputPath)
      .on('end', () => resolve())
      .on('error', reject);
  });
}

// GIF/WEBP → Extract first frame JPG (including resize)
export function extractFirstFrame(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .on('end', () => resolve())
      .on('error', reject)
      .screenshots({
        timestamps: [0],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '300x400'
      });
  });
} 