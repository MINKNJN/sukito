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
    // GIF/WEBP 파일 허용 (mimetype 체크 완화)
    const isGif = file.mimetype === 'image/gif' || file.originalname.toLowerCase().endsWith('.gif');
    const isWebp = file.mimetype === 'image/webp' || file.originalname.toLowerCase().endsWith('.webp');
    if (isGif || isWebp) {
      cb(null, true);
    } else {
      cb(new Error('GIF/WEBP 파일만 업로드 가능합니다.'), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB 제한으로 증가
    fieldSize: 20 * 1024 * 1024, // 필드 크기도 20MB로 증가
  }
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

// MP4 첫 프레임을 JPG로 추출하는 함수
async function extractThumbnail(mp4Path, thumbnailPath) {
  try {
    const command = `ffmpeg -i "${mp4Path}" -vframes 1 -f image2 "${thumbnailPath}"`;
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