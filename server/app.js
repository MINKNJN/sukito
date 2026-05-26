const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');

const app = express();
const execAsync = util.promisify(exec);

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'outputs');

// 디렉토리가 없으면 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isGif = file.mimetype === 'image/gif' || file.originalname.toLowerCase().endsWith('.gif');
    if (isGif) {
      cb(null, true);
    } else {
      cb(new Error('GIF 파일만 업로드 가능합니다.'), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024,
    fieldSize: 20 * 1024 * 1024,
  }
});

const uploadMp4 = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isMp4 = file.mimetype === 'video/mp4' || file.originalname.toLowerCase().endsWith('.mp4');
    if (isMp4) cb(null, true);
    else cb(new Error('MP4 파일만 업로드 가능합니다.'), false);
  },
  limits: { fileSize: 15 * 1024 * 1024 },
});

// GIF를 MP4로 변환하는 함수
async function convertGifToMp4(inputPath, outputPath) {
  try {
    const command = `ffmpeg -i "${inputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputPath}"`;
    await execAsync(command);
    return true;
  } catch (error) {
    return false;
  }
}

// MP4 6번째 프레임을 JPG로 추출하는 함수
async function extractThumbnail(mp4Path, thumbnailPath) {
  try {
    const command = `ffmpeg -i "${mp4Path}" -vf "select=eq(n\\,5)" -vframes 1 -f image2 "${thumbnailPath}"`;
    await execAsync(command);
    return true;
  } catch (error) {
    return false;
  }
}

// 파일 정리 함수
function cleanupFiles(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// MP4 썸네일만 추출하는 API
app.post('/thumbnail', uploadMp4.single('mp4'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'MP4 파일을 업로드해주세요.' });
    }
    const inputPath = req.file.path;
    const thumbnailFileName = path.parse(req.file.filename).name + '_thumb.jpg';
    const thumbnailPath = path.join(outputDir, thumbnailFileName);

    const success = await extractThumbnail(inputPath, thumbnailPath);
    cleanupFiles(inputPath);

    if (!success) {
      return res.status(500).json({ success: false, message: '썸네일 추출에 실패했습니다.' });
    }

    res.json({
      success: true,
      data: { thumbnailDownloadUrl: `/download/${thumbnailFileName}` }
    });
  } catch (error) {
    console.error('thumbnail API 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// GIF to MP4 변환 API
app.post('/convert', upload.single('gif'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'GIF/WEBP 파일을 업로드해주세요.' 
      });
    }

    const inputPath = req.file.path;
    const outputFileName = path.parse(req.file.filename).name + '.mp4';
    const outputPath = path.join(outputDir, outputFileName);

    console.log(`변환 시작: ${req.file.originalname}`);

    // GIF를 MP4로 변환
    const success = await convertGifToMp4(inputPath, outputPath);

    if (success) {
      // 썸네일 추출
      const thumbnailFileName = path.parse(outputFileName).name + '_thumb.jpg';
      const thumbnailPath = path.join(outputDir, thumbnailFileName);
      const thumbSuccess = await extractThumbnail(outputPath, thumbnailPath);

      const stats = fs.statSync(outputPath);
      const fileSize = (stats.size / (1024 * 1024)).toFixed(2); // MB

      res.json({
        success: true,
        message: '변환 완료',
        data: {
          originalName: req.file.originalname,
          outputFileName: outputFileName,
          fileSize: fileSize + ' MB',
          downloadUrl: `/download/${outputFileName}`,
          thumbnailDownloadUrl: thumbSuccess ? `/download/${thumbnailFileName}` : null,
        }
      });

      // 원본 파일 정리
      cleanupFiles(inputPath);
    } else {
      res.status(500).json({ 
        success: false, 
        message: '변환 중 오류가 발생했습니다.' 
      });
      
      // 실패 시 파일들 정리
      cleanupFiles(inputPath);
      cleanupFiles(outputPath);
    }

  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 변환된 파일 다운로드 API
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputDir, filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('다운로드 오류:', err);
        res.status(500).json({ 
          success: false, 
          message: '다운로드 중 오류가 발생했습니다.' 
        });
      } else {
        // 다운로드 완료 후 파일 정리
        setTimeout(() => {
          cleanupFiles(filePath);
        }, 5000); // 5초 후 정리
      }
    });
  } else {
    res.status(404).json({ 
      success: false, 
      message: '파일을 찾을 수 없습니다.' 
    });
  }
});

// MP4 첫 1KB로 faststart(moov atom 위치) 판별
function checkFaststart(mp4Url) {
  return new Promise((resolve) => {
    const https = require('https');
    const http = require('http');
    const protocol = mp4Url.startsWith('https') ? https : http;
    const req = protocol.get(mp4Url, { headers: { Range: 'bytes=0-1023' } }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        try {
          const buf = Buffer.concat(chunks);
          let offset = 0;
          while (offset + 8 <= buf.length) {
            const size = buf.readUInt32BE(offset);
            const type = buf.slice(offset + 4, offset + 8).toString('ascii');
            if (type === 'moov') { resolve(true); return; }
            if (type === 'mdat') { resolve(false); return; }
            if (size < 8) break;
            offset += (size === 1 ? 16 : size); // size=1 은 64bit extended box
          }
          resolve(true); // 판별 불가 시 문제없음으로 간주
        } catch { resolve(true); }
      });
    });
    req.on('error', () => resolve(true));
    req.setTimeout(5000, () => { req.destroy(); resolve(true); });
  });
}

// MP4 URL을 ffprobe + faststart 체크 → 재인코딩 필요 여부 반환
app.post('/check-mp4', async (req, res) => {
  const { mp4Url } = req.body;
  if (!mp4Url || typeof mp4Url !== 'string') {
    return res.status(400).json({ success: false, message: 'mp4Url이 필요합니다.' });
  }

  try {
    const safeUrl = mp4Url.replace(/"/g, '');

    // 코덱 + 픽셀 포맷 확인
    const command = `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,pix_fmt -of json "${safeUrl}"`;
    const { stdout } = await execAsync(command, { timeout: 15000 });
    const info = JSON.parse(stdout);
    const stream = info.streams?.[0];
    const codec = stream?.codec_name;
    const pixFmt = stream?.pix_fmt;

    // faststart 확인 (moov가 mdat보다 앞에 있는지)
    const hasFaststart = await checkFaststart(mp4Url);

    const needsReencode = codec !== 'h264' || pixFmt !== 'yuv420p' || !hasFaststart;
    res.json({ success: true, data: { codec, pixFmt, hasFaststart, needsReencode } });
  } catch (error) {
    console.error('/check-mp4 오류:', error);
    res.status(500).json({ success: false, message: 'FFprobeチェック失敗' });
  }
});

// MP4 파일 직접 업로드 후 재인코딩 (upload.ts에서 호출)
app.post('/reencode-upload', uploadMp4.single('mp4'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'MP4 파일을 업로드해주세요.' });
  }

  const inputPath = req.file.path;
  const baseName = path.parse(req.file.filename).name;
  const outputFileName = baseName + '_reencoded.mp4';
  const outputPath = path.join(outputDir, outputFileName);
  const thumbnailFileName = baseName + '_thumb.jpg';
  const thumbnailPath = path.join(outputDir, thumbnailFileName);

  try {
    const reencodeCommand = `ffmpeg -i "${inputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset fast -crf 23 -an "${outputPath}"`;
    await execAsync(reencodeCommand);
    cleanupFiles(inputPath);

    const thumbSuccess = await extractThumbnail(outputPath, thumbnailPath);

    res.json({
      success: true,
      data: {
        downloadUrl: `/download/${outputFileName}`,
        thumbnailDownloadUrl: thumbSuccess ? `/download/${thumbnailFileName}` : null,
      }
    });
  } catch (error) {
    console.error('/reencode-upload 오류:', error);
    cleanupFiles(inputPath);
    cleanupFiles(outputPath);
    res.status(500).json({ success: false, message: '재인코딩 중 오류가 발생했습니다.' });
  }
});

// MP4 재인코딩 API (모바일 호환: yuv420p + faststart)
app.post('/reencode', async (req, res) => {
  const { mp4Url, filename } = req.body;
  if (!mp4Url || !filename) {
    return res.status(400).json({ success: false, message: 'mp4Url과 filename이 필요합니다.' });
  }

  const tempInputPath = path.join(uploadDir, filename + '_input.mp4');
  const outputFileName = filename + '_reencoded.mp4';
  const outputPath = path.join(outputDir, outputFileName);
  const thumbnailFileName = filename + '_thumb.jpg';
  const thumbnailPath = path.join(outputDir, thumbnailFileName);

  try {
    // MP4 다운로드
    const https = require('https');
    const http = require('http');
    const protocol = mp4Url.startsWith('https') ? https : http;

    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempInputPath);
      protocol.get(mp4Url, (response) => {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (err) => {
        fs.unlink(tempInputPath, () => {});
        reject(err);
      });
    });

    // FFmpeg 재인코딩 (모바일 호환 설정)
    const reencodeCommand = `ffmpeg -i "${tempInputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset fast -crf 23 -an "${outputPath}"`;
    await execAsync(reencodeCommand);
    cleanupFiles(tempInputPath);

    // 썸네일 추출
    const thumbSuccess = await extractThumbnail(outputPath, thumbnailPath);

    const stats = fs.statSync(outputPath);
    const fileSize = (stats.size / (1024 * 1024)).toFixed(2);

    res.json({
      success: true,
      data: {
        downloadUrl: `/download/${outputFileName}`,
        thumbnailDownloadUrl: thumbSuccess ? `/download/${thumbnailFileName}` : null,
        fileSize: fileSize + ' MB',
      }
    });
  } catch (error) {
    console.error('/reencode 오류:', error);
    cleanupFiles(tempInputPath);
    cleanupFiles(outputPath);
    res.status(500).json({ success: false, message: '재인코딩 중 오류가 발생했습니다.' });
  }
});

// MP4 URL에서 첫 프레임 추출 API (기존 게임 썸네일 재생성용)
app.post('/extract-thumbnail-from-url', async (req, res) => {
  const { mp4Url, filename } = req.body;
  if (!mp4Url || !filename) {
    return res.status(400).json({ success: false, message: 'mp4Url과 filename이 필요합니다.' });
  }

  const tempMp4Path = path.join(uploadDir, filename + '_temp.mp4');
  const thumbnailFileName = filename + '_thumb.jpg';
  const thumbnailPath = path.join(outputDir, thumbnailFileName);

  try {
    // MP4 다운로드
    const https = require('https');
    const http = require('http');
    const protocol = mp4Url.startsWith('https') ? https : http;

    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempMp4Path);
      protocol.get(mp4Url, (response) => {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (err) => {
        fs.unlink(tempMp4Path, () => {});
        reject(err);
      });
    });

    // 첫 프레임 추출
    const success = await extractThumbnail(tempMp4Path, thumbnailPath);
    cleanupFiles(tempMp4Path);

    if (!success) {
      return res.status(500).json({ success: false, message: '썸네일 추출에 실패했습니다.' });
    }

    res.json({
      success: true,
      data: { thumbnailDownloadUrl: `/download/${thumbnailFileName}` }
    });
  } catch (error) {
    cleanupFiles(tempMp4Path);
    cleanupFiles(thumbnailPath);
    res.status(500).json({ success: false, message: '처리 중 오류가 발생했습니다.' });
  }
});

// 서버 상태 확인 API
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '서버가 정상적으로 실행 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// 오류 처리 미들웨어
app.use((error, req, res, next) => {
  res.status(500).json({ 
    success: false, 
    message: error.message || '서버 오류가 발생했습니다.' 
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`GIF 변환 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`업로드 디렉토리: ${uploadDir}`);
  console.log(`출력 디렉토리: ${outputDir}`);
}); 