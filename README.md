# Sukito (スキト - 好きトーナメント)

이미지 · GIF · YouTube를 사용해 토너먼트 형식의 투표 게임을 만들고 공유할 수 있는 일본어 웹 플랫폼.

- **URL**: https://sukito.net
- **언어**: 일본어 서비스 (코드는 한국어 주석)
- **스택**: Next.js 15 · React 19 · TypeScript · MongoDB · AWS S3 · CloudFront · Express · FFmpeg

---

## 목차

1. [프로젝트 구조](#1-프로젝트-구조)
2. [로컬 개발 환경 설정](#2-로컬-개발-환경-설정)
3. [개발 명령어](#3-개발-명령어)
4. [EC2 배포 흐름](#4-ec2-배포-흐름)
5. [배포 스크립트](#5-배포-스크립트)
6. [서버 모니터링](#6-서버-모니터링)
7. [환경변수 관리](#7-환경변수-관리)
8. [주요 아키텍처](#8-주요-아키텍처)

---

## 1. 프로젝트 구조

```
sukito/
├── pages/                  # Next.js 페이지 + API 라우트
│   ├── index.tsx           # 홈 (게임 목록) — SSR
│   ├── make.tsx            # 게임 생성/편집
│   ├── play/[id].tsx       # 게임 플레이 — SSR + OG태그
│   ├── result.tsx          # 결과/순위
│   ├── sitemap.xml.tsx     # 동적 sitemap (게임 URL 자동 포함)
│   ├── admin/index.tsx     # 관리자 대시보드
│   └── api/                # API 엔드포인트
│       ├── games.ts        # 게임 CRUD
│       ├── upload.ts       # 파일 업로드 → S3
│       ├── comments.ts     # 댓글
│       ├── records.ts      # 플레이 기록
│       └── admin/          # 관리자 API
├── components/             # 공통 컴포넌트
│   ├── Header.tsx
│   ├── GameCard.tsx        # 게임 카드 (클릭 → 게임 시작)
│   ├── GoogleAd.tsx
│   └── AlertModal.tsx
├── lib/                    # 유틸리티
│   ├── mongodb.ts          # MongoDB 연결 (Connection Pool)
│   └── aws-s3.ts           # S3 업로드/삭제
├── server/
│   └── app.js              # Express 서버 (포트 3001) — FFmpeg 변환 전담
├── public/
│   └── robots.txt          # 검색엔진 크롤링 규칙
├── ecosystem.config.js     # PM2 프로세스 설정
├── nginx.conf              # Nginx 리버스 프록시 설정
├── deploy.sh               # 전체 배포 스크립트 (EC2에서 실행)
├── quick-deploy.sh         # 빠른 재시작 스크립트 (빌드 없이)
├── monitor.sh              # 서버 상태 모니터링
└── diagnose.sh             # 502 오류 진단
```

---

## 2. 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 18+
- npm

### 설치

```bash
git clone https://github.com/MINKJ/sukito.git
cd sukito
npm install
```

### 환경변수 설정

프로젝트 루트에 `.env.local` 파일 생성 (Git에 업로드되지 않음):

```bash
# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-northeast-1
S3_BUCKET=sukito-media-jp
CLOUDFRONT_URL=https://d2ojyvx5ines08.cloudfront.net

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster-sukito.qtnfnkn.mongodb.net/sukito?retryWrites=true&w=majority

# JWT
JWT_SECRET=

# Express 변환 서버 (로컬)
EC2_SERVER_URL=http://localhost:3001
```

> EC2의 실제 값은 `/home/ubuntu/sukito/.env.local` 파일에 있음.  
> EC2 접속 후 `cat /home/ubuntu/sukito/.env.local` 로 확인 가능.

---

## 3. 개발 명령어

```bash
# 개발 서버 시작 (포트 3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# Lint
npm run lint
```

### SSR 동작 확인 방법

`npm run dev` 실행 후 브라우저에서 `Ctrl+U` (소스 보기):
- 게임 제목이 HTML 안에 포함되어 있으면 ✅ SSR 정상
- `読み込み中...` 만 보이면 ❌ CSR 상태

### sitemap 확인

```
http://localhost:3000/sitemap.xml
```

---

## 4. EC2 배포 흐름

### 전체 흐름

```
[로컬]                          [GitHub]              [EC2]
코드 수정
  ↓
git add .
git commit -m "메시지"
git push origin main    →→→    저장소 업데이트
                                                        ↓
                                                   git pull origin main
                                                        ↓
                                                   npm run build
                                                        ↓
                                                   pm2 restart ecosystem.config.js
                                                        ↓
                                                   sukito.net 반영 완료
```

### EC2 접속

```bash
ssh -i "sukito-ec2-key.pem" ubuntu@<EC2_IP>
cd /home/ubuntu/sukito
```

### 수동 배포 (단계별)

```bash
# 1. 최신 코드 가져오기
git pull origin main

# 2. 빌드 (코드 변경이 있을 때)
npm run build

# 3. 서버 재시작
pm2 restart ecosystem.config.js

# 4. 상태 확인
pm2 status
```

### 스크립트로 배포 (권장)

```bash
# 전체 배포 (pull + 빌드 + PM2 + Nginx 재시작)
./deploy.sh

# 빠른 재시작 (빌드 없이 — 설정 파일 변경 시)
./quick-deploy.sh
```

---

## 5. 배포 스크립트

| 스크립트 | 용도 | 실행 위치 |
|---------|------|---------|
| `deploy.sh` | 전체 배포 (pull → 빌드 → PM2 → Nginx) | EC2 |
| `quick-deploy.sh` | 빌드 없이 PM2/Nginx 재시작만 | EC2 |
| `monitor.sh` | 메모리·디스크·PM2·포트 상태 확인 | EC2 |
| `diagnose.sh` | 502 오류 진단 (포트·로그·빌드 파일 점검) | EC2 |

---

## 6. 서버 모니터링

```bash
# PM2 프로세스 상태
pm2 status

# 실시간 모니터링
pm2 monit

# 로그 확인
pm2 logs sukito-nextjs
pm2 logs sukito-api

# 한 번에 상태 점검
./monitor.sh

# 502 오류 발생 시
./diagnose.sh
```

### 포트 구성

| 포트 | 서비스 |
|------|--------|
| 80 / 443 | Nginx (외부 접근) |
| 3000 | Next.js (PM2: sukito-nextjs) |
| 3001 | Express (PM2: sukito-api) — GIF→MP4 변환 전담 |

---

## 7. 환경변수 관리

| 파일 | 위치 | 용도 |
|------|------|------|
| `.env.local` | 로컬 루트, EC2 `/home/ubuntu/sukito/` | 실제 환경변수 (Git 제외) |
| `ecosystem.config.js` | 루트 | PM2 설정 (NODE_ENV, PORT 등 기본값만) |

> `.gitignore`에 `.env*` 패턴이 등록되어 있어 환경변수 파일은 GitHub에 절대 업로드되지 않습니다.

---

## 8. 주요 아키텍처

### 서버 구성

```
사용자
  ↓ HTTPS
Nginx (80/443)
  ├── /api/, /, /_next/ → Next.js (3000)
  └── /convert, /download → Express (3001)
        ↓
   MongoDB Atlas          AWS S3 + CloudFront CDN
   (데이터 저장)           (미디어 파일 저장/전송)
```

### Next.js API vs Express 역할 분담

| 역할 | 서버 |
|------|------|
| 게임·댓글·유저 CRUD | Next.js API Routes |
| JWT 인증 | Next.js API Routes |
| GIF/WEBP → MP4 변환 | Express (FFmpeg) |

### 파일 업로드 흐름

```
클라이언트 → POST /api/upload (Next.js)
  ├── 이미지: Sharp 검증 → S3 업로드 → CloudFront URL 반환
  └── GIF/WEBP: axios → POST /convert (Express/FFmpeg) → MP4 → S3 → CloudFront URL 반환
```

### SSR 구성 (2026-04-12 전환)

| 페이지 | 방식 | 비고 |
|--------|------|------|
| `index.tsx` (홈) | SSR (`getServerSideProps`) | MongoDB 직접 조회, Google 크롤링 가능 |
| `play/[id].tsx` | SSR (`getServerSideProps`) | OG태그 포함, SNS 공유 시 미리보기 정상 |
| `sitemap.xml` | SSR (동적 생성) | 게임 URL 자동 포함, 24시간 캐싱 |

---

> 상세 아키텍처, API 레퍼런스, 데이터베이스 스키마는 [CLAUDE.md](CLAUDE.md) 참조
