# Sukito - 게임 플랫폼

Next.js 기반의 게임 플랫폼입니다.

## 개발 환경 설정

```bash
npm install
npm run dev
```

## 배포

### EC2 배포
```bash
# PM2로 서비스 시작
npm run pm2:start

# 서비스 재시작
npm run pm2:restart

# 서비스 중지
npm run pm2:stop
```

### 배포 스크립트
```bash
./deploy.sh
```

## 주요 기능

- GIF/WEBP → MP4 변환
- AWS S3 파일 저장
- MongoDB 데이터베이스
- CloudFront CDN
