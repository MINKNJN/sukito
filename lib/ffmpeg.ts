import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import path from 'path';

// ffmpeg path explicitly specified
ffmpeg.setFfmpegPath(ffmpegPath.path);

// GIF/WEBP → MP4 conversion
export function convertGifToMp4(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions('-movflags faststart')
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