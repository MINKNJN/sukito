# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev            # Start development server on port 3000

# Build & Production
npm run build          # Build for production
npm start             # Start production server
npm run lint          # Run Next.js linter

# PM2 Process Management (EC2 deployment)
npm run pm2:start     # Start both Next.js app and API server
npm run pm2:restart   # Restart services
npm run pm2:stop      # Stop services
npm run pm2:delete    # Delete PM2 processes
```

## Project Architecture

This is a **Next.js game platform** called "Sukito" that converts GIF/WEBP files to MP4 format and hosts user-generated games.

### Core Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Bootstrap 5
- **Backend**: Next.js API routes + separate Node.js server (server/app.js)
- **Database**: MongoDB with Mongoose
- **Storage**: AWS S3 + CloudFront CDN
- **Video Processing**: FFmpeg for GIF/WEBP → MP4 conversion
- **Deployment**: PM2 on EC2 with nginx

### Architecture Overview
- **Dual-server setup**: Next.js app (port 3000) + Node.js API server (port 3001)
- **File processing pipeline**: Upload → FFmpeg conversion → S3 storage → CloudFront delivery
- **User system**: Authentication with JWT, user profiles, game management

### Key Directories
- `pages/` - Next.js pages and API routes
- `pages/api/` - API endpoints for auth, games, uploads, comments
- `components/` - React components (GameCard, Header, UploadModal, etc.)
- `lib/` - Utility functions (AWS S3, FFmpeg, MongoDB connection)
- `models/` - MongoDB/Mongoose schemas
- `server/` - Separate Node.js server for additional API functionality
- `utils/` - Database connection and auth utilities

### Important Configuration
- **Path aliases**: `@/*` maps to project root (tsconfig.json:18)
- **Image optimization**: CloudFront domain configured in next.config.ts
- **Memory limits**: PM2 configured with 1-2GB memory limits
- **Security headers**: Configured in next.config.ts for XSS protection

### File Upload & Processing
- Large file uploads (up to 20MB) supported
- FFmpeg processes GIF/WEBP → MP4 conversion
- Files stored in AWS S3, served via CloudFront CDN
- Bulk upload functionality available

### Deployment
- Uses PM2 ecosystem with two processes: Next.js app + API server
- Nginx reverse proxy configuration in nginx.conf
- Deployment scripts: deploy.sh, quick-deploy.sh
- EC2 setup and control scripts available

### Authentication Flow
- JWT-based authentication
- User registration/login with bcrypt password hashing
- Admin authentication system in utils/adminAuth.ts
- Protected routes and API endpoints

## 프로젝트 현황 및 보완점

### 현재 상태
**전체적으로 잘 구성된 프로덕션 레벨의 Next.js 게임 플랫폼**
- ✅ 안정적인 아키텍처 (Next.js + 별도 API 서버)
- ✅ 완성도 높은 기능 (게임 생성, 플레이, 관리자 패널)
- ✅ AWS 인프라 활용 (S3, CloudFront)
- ✅ 적절한 보안 설정 (JWT, 헤더 보안)
- ✅ PM2 기반 프로덕션 배포

### 즉시 수정 권장 사항

#### 1. 코드 품질
- **ESLint 설정 필요**: `npm run lint` 시 ESLint 설정이 안되어 있음
- **사용하지 않는 변수 정리**: pages/index.tsx에 10개의 미사용 스타일 변수
- **Console.log 정리**: 프로덕션 코드에 70개 이상의 console 출력 존재

#### 2. 의존성 업데이트
- **보안 패치**: @types/node (20.17.45 → 24.3.1), next (15.3.0 → 15.5.2) 등
- **마이너 업데이트**: mongodb, mongoose, bootstrap 등 12개 패키지

#### 3. 보안 강화
- **환경변수 파일**: .env 파일이 누락되어 있음 (README에서 언급된 설정들)
- **Private key 노출**: sukito-ec2-key.pem이 repository에 커밋됨 (.gitignore 추가 필요)

### 중장기 개선 제안

#### 1. 타입 안전성
- TypeScript strict 모드 활용 개선
- API 응답 타입 정의 통일
- Props 타입 정의 강화

#### 2. 성능 최적화
- React.memo, useMemo 적용으로 불필요한 렌더링 방지
- 이미지 lazy loading 구현
- 게임 목록 pagination/infinite scroll

#### 3. 테스트 환경
- Jest + Testing Library 설정
- 핵심 API 엔드포인트 테스트 코드
- E2E 테스트 (Playwright/Cypress)

#### 4. 모니터링
- 에러 추적 (Sentry 등)
- 성능 모니터링
- 사용자 분석

#### 5. 개발자 경험
- Prettier 설정으로 코드 포맷팅 통일
- Husky + lint-staged로 pre-commit hook
- Storybook으로 컴포넌트 문서화

### 우선순위별 작업 순서

**High Priority (즉시)**
1. sukito-ec2-key.pem .gitignore 추가
2. ESLint 설정 및 코드 정리
3. 의존성 보안 업데이트

**Medium Priority (1-2주)**
1. 사용하지 않는 코드 정리
2. Console.log 제거/적절한 로깅으로 교체
3. 환경변수 설정 문서화

**Low Priority (월간)**
1. 테스트 환경 구축
2. 성능 최적화
3. 모니터링 도구 도입

### 환경변수 설정
```bash
# .env.local 파일 생성 필요
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-northeast-1
S3_BUCKET=your-bucket-name
CLOUDFRONT_URL=https://your-cloudfront-domain
EC2_SERVER_URL=http://your-server:3001
```

### 주의사항
- 환경변수는 절대 커밋하지 말 것
- Private key 파일들은 .gitignore에 추가
- 프로덕션 환경에서는 console.log 제거
- PM2 로그 파일 정기적 정리 필요