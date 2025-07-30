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
    // GIF 파일만 허용
    if (file.mimetype === 'image/gif') {
      cb(null, true);
    } else {
      cb(new Error('GIF 파일만 업로드 가능합니다.'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB 제한
  }
});

// GIF를 MP4로 변환하는 함수
async function convertGifToMp4(inputPath, outputPath) {
  try {
    const command = `ffmpeg -i "${inputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputPath}"`;
    await execAsync(command);
    return true;
  } catch (error) {
    console.error('FFmpeg 변환 오류:', error);
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
        message: 'GIF 파일을 업로드해주세요.' 
      });
    }

    const inputPath = req.file.path;
    const outputFileName = path.parse(req.file.filename).name + '.mp4';
    const outputPath = path.join(outputDir, outputFileName);

    console.log(`변환 시작: ${req.file.originalname}`);

    // GIF를 MP4로 변환
    const success = await convertGifToMp4(inputPath, outputPath);

    if (success) {
      // 변환된 파일 정보 반환
      const stats = fs.statSync(outputPath);
      const fileSize = (stats.size / (1024 * 1024)).toFixed(2); // MB

      res.json({
        success: true,
        message: '변환 완료',
        data: {
          originalName: req.file.originalname,
          outputFileName: outputFileName,
          fileSize: fileSize + ' MB',
          downloadUrl: `/download/${outputFileName}`
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
  console.error('미들웨어 오류:', error);
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