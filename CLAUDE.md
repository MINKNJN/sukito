# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with the Sukito codebase.

---

## 목차 (Table of Contents)

1. [프로젝트 개요 (Project Overview)](#1-프로젝트-개요-project-overview)
2. [아키텍처 (Architecture)](#2-아키텍처-architecture)
3. [데이터베이스 스키마 (Database Schema)](#3-데이터베이스-스키마-database-schema)
4. [API 엔드포인트 레퍼런스 (API Reference)](#4-api-엔드포인트-레퍼런스-api-reference)
5. [핵심 데이터 흐름 (Data Flows)](#5-핵심-데이터-흐름-data-flows)
6. [개발 규칙 (Development Guidelines)](#6-개발-규칙-development-guidelines)
7. [환경 설정 (Configuration)](#7-환경-설정-configuration)
8. [배포 가이드 (Deployment)](#8-배포-가이드-deployment)
9. [파일 참조 가이드 (File Reference)](#9-파일-참조-가이드-file-reference)
10. [알려진 이슈 및 개선 사항 (Known Issues)](#10-알려진-이슈-및-개선-사항-known-issues)

---

## 1. 프로젝트 개요 (Project Overview)

### 1.1 프로젝트 설명

**Sukito (スキト - 好きトーナメント)**는 사용자가 이미지, GIF, YouTube 동영상을 사용하여 토너먼트 형식의 투표 게임을 생성하고 공유할 수 있는 일본어 웹 플랫폼입니다.

**핵심 기능:**
- 🎮 토너먼트 게임 생성 (4강, 8강, 16강, 32강 등)
- 🖼️ 이미지/GIF/YouTube 콘텐츠 지원
- 🎬 GIF/WEBP → MP4 자동 변환 (FFmpeg)
- 💬 게임별 댓글 시스템 (좋아요/싫어요)
- 🏆 우승자 기록 및 순위 시스템
- 👤 사용자 인증 (JWT) 및 프로필 관리
- 🔐 관리자 대시보드 (사용자/게임/댓글 관리)
- ☁️ AWS S3 + CloudFront CDN 파일 저장

### 1.2 기술 스택

| 카테고리 | 기술 |
|---------|------|
| **Frontend** | Next.js 15, React 19, TypeScript, Bootstrap 5 |
| **Backend** | Next.js API Routes (port 3000) + Express.js (port 3001) |
| **Database** | MongoDB (native driver + Mongoose) |
| **Storage** | AWS S3, CloudFront CDN |
| **Processing** | FFmpeg (GIF→MP4), Sharp (이미지 처리) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Deployment** | PM2, Nginx, EC2 (Ubuntu) |

### 1.3 개발 명령어

```bash
# 개발 서버
npm run dev              # 개발 서버 시작 (포트 3000)

# 빌드 및 프로덕션
npm run build            # 프로덕션 빌드
npm start               # 프로덕션 서버 실행
npm run lint            # Next.js ESLint 실행

# PM2 프로세스 관리 (EC2 배포)
npm run pm2:start       # Next.js 앱 + API 서버 시작
npm run pm2:restart     # 서비스 재시작
npm run pm2:stop        # 서비스 중지
npm run pm2:delete      # PM2 프로세스 삭제
npm run pm2:logs        # 로그 확인
```

---

## 2. 아키텍처 (Architecture)

### 2.1 시스템 구조도

```
┌─────────────────────────────────────────────────────────────┐
│                         사용자 (브라우저)                      │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS (443)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx 리버스 프록시                         │
│                  (포트 80 → 443 리다이렉트)                    │
└────────┬────────────────────────────────────────────┬───────┘
         │                                             │
         │ /api/*, /, /_next/                         │ /convert, /download
         ▼                                             ▼
┌─────────────────────────────────┐    ┌──────────────────────────────┐
│    Next.js App (포트 3000)       │    │  Express Server (포트 3001)  │
│  ┌──────────────────────────┐   │    │  ┌────────────────────────┐  │
│  │  Pages (SSR/SSG)         │   │    │  │  POST /convert         │  │
│  │  - index.tsx             │   │    │  │  GIF/WEBP → MP4 변환   │  │
│  │  - make.tsx              │   │    │  │  (FFmpeg)              │  │
│  │  - play/[id].tsx         │   │    │  └────────────────────────┘  │
│  │  - admin/index.tsx       │   │    │  ┌────────────────────────┐  │
│  └──────────────────────────┘   │    │  │  GET /download/:file   │  │
│  ┌──────────────────────────┐   │    │  │  변환된 파일 제공      │  │
│  │  API Routes              │   │    │  └────────────────────────┘  │
│  │  - /api/games            │   │    └──────────────────────────────┘
│  │  - /api/upload           │◄──┼──────── axios 통신
│  │  - /api/comments         │   │
│  │  - /api/admin/*          │   │
│  └──────────────────────────┘   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│     MongoDB (sukito DB)          │
│  - users (사용자)                │
│  - games (게임)                  │
│  - comments (댓글)               │
│  - records (플레이 기록)          │
│  - resume_games (저장된 진행)    │
└─────────────────────────────────┘
         │
         │ (파일 업로드/다운로드)
         ▼
┌─────────────────────────────────┐
│         AWS S3 Bucket            │
│  - games/ (게임 파일)            │
│  - thumbnails/ (썸네일)          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│      CloudFront CDN              │
│  d2ojyvx5ines08.cloudfront.net  │
└─────────────────────────────────┘
```

### 2.2 시스템 구성 요소별 분류

#### 🎨 프론트엔드 (Frontend)
**기술 스택:** Next.js 15, React 19, TypeScript, Bootstrap 5

**주요 구성:**
```
사용자 인터페이스
├── 페이지 컴포넌트 (pages/)
│   ├── index.tsx - 게임 목록 (홈)
│   ├── make.tsx - 게임 생성/편집
│   ├── play/[id].tsx - 게임 플레이
│   ├── result.tsx - 게임 결과
│   ├── login.tsx / signup.tsx - 인증
│   ├── profile.tsx - 프로필 관리
│   ├── mygames.tsx - 내 게임 목록
│   └── admin/index.tsx - 관리자 대시보드
│
├── 재사용 컴포넌트 (components/)
│   ├── Header.tsx - 네비게이션 바
│   ├── GameCard.tsx - 게임 카드
│   ├── UploadModal.tsx - 업로드 진행 상태
│   ├── AlertModal.tsx - 알림 모달
│   └── GoogleAd.tsx - 광고 배너
│
├── 스타일 (styles/)
│   ├── globals.css - 전역 스타일
│   └── Bootstrap 5 - 반응형 그리드
│
└── 상태 관리
    ├── Context API (AlertProvider)
    └── localStorage (게임 진행 상태 저장)
```

**렌더링 방식:**
- SSR (Server-Side Rendering): 게임 목록, 상세 페이지
- CSR (Client-Side Rendering): 게임 플레이, 인터랙션
- 정적 페이지: About, Terms, Privacy

**접근 경로:** `https://sukito.net` (Nginx → Next.js 포트 3000)

---

#### ⚙️ 백엔드 (Backend)
**듀얼 서버 구조:**

**1. Next.js API Routes (포트 3000)**
```
경량 API 서버
├── 인증 (/api/login, /api/signup, /api/jwt)
│   └── JWT 토큰 발급 및 검증
│
├── 게임 관리 (/api/games)
│   ├── GET - 목록/상세 조회
│   ├── POST - 게임 생성
│   ├── PATCH - 게임 수정
│   └── DELETE - 게임 삭제
│
├── 댓글 관리 (/api/comments)
│   ├── GET - 댓글 조회 (상위 3개 고정)
│   ├── POST - 댓글 작성
│   └── /like, /update, /delete
│
├── 플레이 기록 (/api/records, /api/ranking, /api/winner)
│   └── 우승자 기록 및 순위 집계
│
├── 사용자 관리 (/api/user, /api/update, /api/delete)
│   └── 프로필 조회/수정/삭제
│
├── 관리자 (/api/admin/*)
│   ├── users - 사용자 관리
│   ├── games - 게임 관리
│   ├── comments - 댓글 관리
│   └── updateRole, deleteGame, deleteComment
│
└── 파일 업로드 (/api/upload)
    ├── 이미지 업로드 → S3
    ├── GIF/WEBP 감지
    └── Express 서버로 변환 요청
```

**2. Express Server (포트 3001)**
```
무거운 작업 전담
├── POST /convert
│   ├── GIF/WEBP 파일 수신
│   ├── FFmpeg로 MP4 변환
│   │   └── scale=640:-1, libx264, yuv420p
│   └── 변환 완료 응답
│
└── GET /download/:filename
    └── 변환된 MP4 파일 제공
```

**역할 분담 원칙:**
- Next.js API: 가벼운 작업 (DB 쿼리, 비즈니스 로직)
- Express: 무거운 작업 (FFmpeg, 파일 변환)

**통신:** axios (Next.js ↔ Express)

---

#### 📦 코드 저장 (Source Code Repository)
**플랫폼:** GitHub

**저장소 구조:**
```
GitHub Repository
├── 소스 코드 (TypeScript, JavaScript)
├── 설정 파일 (next.config.ts, tsconfig.json)
├── 배포 스크립트 (deploy.sh, ecosystem.config.js)
├── 문서 (CLAUDE.md, README.md)
└── .gitignore (민감 정보 제외)
    ├── .env*
    ├── *.pem
    └── node_modules/
```

**버전 관리:**
- 브랜치: main (프로덕션)
- 커밋 로그: 최근 20개 히스토리 확인됨
- 태그: 없음 (버전 관리 미흡)

**CI/CD:** 수동 배포 (git pull → build → restart)

---

#### 💾 정보 저장 (Database)
**플랫폼:** MongoDB Atlas (클라우드)

**데이터베이스:** `sukito`

**컬렉션 구조:**
```
MongoDB
├── users (사용자)
│   ├── _id, nickname, email, password (bcrypt)
│   ├── role (user/admin)
│   └── createdAt
│
├── games (게임)
│   ├── _id, title, desc, type
│   ├── items (현재 아이템 배열)
│   ├── itemsHistory (전체 히스토리, 삭제 포함)
│   ├── thumbnails (대표 이미지 2개)
│   ├── visibility (public/private/password)
│   ├── createdBy (userId 참조)
│   └── playCount (aggregation, 저장 안 됨)
│
├── comments (댓글)
│   ├── _id, gameId, nickname, content
│   ├── authorId, authorType (user/guest)
│   ├── likes, dislikes
│   ├── likeUsers[], dislikeUsers[]
│   └── createdAt
│
├── records (플레이 기록)
│   ├── _id, gameId
│   ├── winnerName, winnerUrl
│   └── playedAt
│
└── resume_games (진행 중인 게임)
    ├── _id, userId, gameId
    ├── selectedRound, currentRound
    ├── remainingItems, winnerHistory
    └── lastSavedAt
```

**연결 방식:**
- MongoDB Native Driver (lib/mongodb.ts)
- Mongoose (models/User.ts, 선택적)
- Connection Pooling (전역 연결 재사용)

**인덱스:**
- users.email (unique)
- games.createdBy
- comments.gameId
- records.gameId

**백업:** 자동 백업 (MongoDB Atlas)

---

#### 🖼️ 미디어 저장 (Media Storage)
**플랫폼:** AWS S3 + CloudFront CDN

**S3 버킷:** `sukito-bucket`

**폴더 구조:**
```
S3 Bucket
├── games/
│   ├── xxx.jpg (게임 이미지)
│   ├── xxx.mp4 (변환된 GIF)
│   └── xxx.webp (원본 이미지)
│
└── thumbnails/
    └── xxx_thumb.jpg (썸네일)
```

**파일 처리 흐름:**
```
1. 클라이언트 파일 선택
   ↓
2. POST /api/upload (Next.js)
   ↓
3. Formidable로 파일 파싱
   ↓
4. Sharp로 이미지 검증
   ↓
5. GIF/WEBP 감지
   ├── Yes: axios POST /convert (Express)
   │   ├── FFmpeg 변환 (GIF → MP4)
   │   ├── GET /download/:file
   │   └── S3 업로드 (MP4)
   └── No: S3 업로드 (이미지)
   ↓
6. CloudFront URL 반환
   └── https://d2ojyvx5ines08.cloudfront.net/games/xxx.mp4
```

**파일 제한:**
- 최대 크기: 20MB
- 지원 형식: JPG, JPEG, PNG, GIF, WEBP, YouTube URL

**CDN 캐싱:**
- CloudFront 배포: d2ojyvx5ines08.cloudfront.net
- 캐시 정책: 기본 TTL (24시간)
- 원본: S3 버킷

**파일 삭제:**
- 게임 삭제 시: itemsHistory의 모든 S3 파일 삭제
- Cascade 삭제 구현

---

#### 🚀 배포 (Deployment)
**플랫폼:** AWS EC2 (Ubuntu)

**서버 구성:**
```
EC2 인스턴스
├── OS: Ubuntu 22.04 LTS
├── Node.js: 18.x
├── 프로젝트 경로: /home/ubuntu/sukito
│
├── 프로세스 관리: PM2
│   ├── sukito-nextjs (포트 3000)
│   │   ├── script: npm start
│   │   ├── 메모리: 2GB
│   │   └── 로그: ~/.pm2/logs/sukito-nextjs-*.log
│   │
│   └── sukito-api (포트 3001)
│       ├── script: node server/app.js
│       ├── 메모리: 1GB
│       └── 로그: ~/.pm2/logs/sukito-api-*.log
│
├── 리버스 프록시: Nginx
│   ├── 포트 80 → 443 리다이렉트
│   ├── SSL: Let's Encrypt
│   ├── /api/ → localhost:3000
│   ├── /convert, /download → localhost:3001
│   └── / → localhost:3000
│
└── 도메인: sukito.net
    └── DNS: A 레코드 → EC2 IP
```

**배포 프로세스:**
```bash
# 자동 배포 (deploy.sh)
1. git pull origin main
2. npm install
3. npm run build
4. pm2 restart ecosystem.config.js

# 빠른 재시작 (quick-deploy.sh)
1. pm2 restart ecosystem.config.js
```

**환경 변수:**
- 위치: /home/ubuntu/sukito/.env.production
- 로드: PM2 ecosystem.config.js
- 보안: .gitignore로 제외

**모니터링:**
```bash
# PM2 상태 확인
pm2 status
pm2 monit
pm2 logs sukito-nextjs

# 시스템 리소스
free -h     # 메모리
df -h       # 디스크
top         # CPU
```

**보안:**
- SSH 키 인증 (비밀번호 로그인 비활성화)
- UFW 방화벽 (포트 22, 80, 443만 오픈)
- Nginx 보안 헤더 (X-Frame-Options, CSP 등)
- SSL/TLS 인증서 (Let's Encrypt)

**백업:**
- 코드: GitHub (자동)
- DB: MongoDB Atlas (자동)
- 파일: S3 (자동 버전 관리)
- 설정: 수동 백업 필요 ⚠️

---

#### 🔧 추가 구성 요소

**1. 외부 서비스 (External Services)**
```
├── Google AdSense
│   └── 광고 배너 (components/GoogleAd.tsx)
│
├── YouTube API
│   └── 임베드 비디오 (iframe)
│
└── FFmpeg
    └── 미디어 변환 (server/app.js)
```

**2. 개발 도구 (Development Tools)**
```
├── TypeScript 5.8.3
│   └── 타입 안전성
│
├── ESLint (미설정) ⚠️
│   └── 코드 품질 검사 필요
│
├── PM2
│   └── 프로세스 관리 및 모니터링
│
└── Git
    └── 버전 관리
```

**3. 보안 레이어 (Security Layer)**
```
├── JWT (jsonwebtoken)
│   ├── 7일 유효기간
│   └── HS256 알고리즘
│
├── bcryptjs
│   └── 비밀번호 해싱 (10 rounds)
│
├── Nginx 보안 헤더
│   ├── X-Content-Type-Options: nosniff
│   ├── X-Frame-Options: DENY
│   ├── X-XSS-Protection: 1; mode=block
│   └── Referrer-Policy: strict-origin
│
└── 환경변수 암호화
    └── .env* (.gitignore로 보호)
```

**4. 성능 최적화 (Performance)**
```
├── CloudFront CDN
│   └── 이미지/비디오 글로벌 배포
│
├── MongoDB Connection Pooling
│   └── 전역 연결 재사용
│
├── Next.js 최적화
│   ├── 이미지 최적화 (next/image)
│   ├── 코드 스플리팅 (자동)
│   └── 프로덕션 빌드 압축
│
└── PM2 클러스터 모드 (미사용)
    └── 단일 인스턴스로 충분
```

---

### 2.3 디렉토리 구조

```
sukito/
├── pages/                      # Next.js 페이지 및 API 라우트
│   ├── index.tsx              # 홈 (게임 목록)
│   ├── make.tsx               # 게임 생성/편집
│   ├── play/[id].tsx          # 게임 플레이
│   ├── result.tsx             # 게임 결과
│   ├── login.tsx              # 로그인
│   ├── signup.tsx             # 회원가입
│   ├── profile.tsx            # 프로필 편집
│   ├── mygames.tsx            # 내 게임 목록
│   ├── bulk.tsx               # 일괄 업로드
│   ├── guide.tsx              # 사용 가이드
│   ├── about.tsx, terms.tsx, privacy.tsx
│   ├── admin/
│   │   └── index.tsx          # 관리자 대시보드
│   ├── _app.tsx               # App 래퍼 (AlertProvider)
│   ├── _document.tsx          # HTML 문서 설정
│   └── api/                   # API 엔드포인트
│       ├── games.ts           # 게임 CRUD
│       ├── upload.ts          # 파일 업로드
│       ├── login.ts, signup.ts, jwt.ts
│       ├── comments.ts        # 댓글 API
│       ├── records.ts, ranking.ts, winner.ts
│       ├── user.ts, update.ts, delete.ts
│       ├── resume.ts          # 게임 진행 저장
│       ├── comments/
│       │   ├── like.ts, update.ts, delete.ts
│       └── admin/
│           ├── users.ts, games.ts, comments.ts
│           ├── updateRole.ts, updateGame.ts, updateComment.ts
│           ├── deleteGame.ts, deleteComment.ts, delete.ts
│
├── components/                # React 컴포넌트
│   ├── Header.tsx             # 네비게이션 헤더
│   ├── Layout.tsx             # 페이지 레이아웃
│   ├── GameCard.tsx           # 게임 카드
│   ├── UploadModal.tsx        # 업로드 진행률 모달
│   ├── AlertModal.tsx         # 알림 모달
│   └── GoogleAd.tsx           # Google AdSense
│
├── lib/                       # 유틸리티 라이브러리
│   ├── mongodb.ts             # MongoDB 연결
│   ├── aws-s3.ts              # S3 업로드/삭제
│   ├── ffmpeg.ts              # FFmpeg 변환 (로컬용)
│   ├── utils.ts               # 썸네일, 캐시 유틸
│   ├── alert.tsx              # Alert Context
│   └── commentTemplates.ts    # 댓글 템플릿
│
├── models/
│   └── User.ts                # Mongoose User 스키마
│
├── server/
│   └── app.js                 # Express 변환 서버 (포트 3001)
│
├── utils/
│   ├── db.ts                  # MongoDB 연결 유틸
│   └── adminAuth.ts           # 관리자 인증
│
├── styles/
│   ├── globals.css
│   └── Home.module.css
│
├── public/                    # 정적 파일
│   ├── favicon.ico, robots.txt, sitemap.xml
│   └── ads.txt
│
├── next.config.ts             # Next.js 설정
├── tsconfig.json              # TypeScript 설정
├── ecosystem.config.js        # PM2 설정
├── nginx.conf                 # Nginx 설정
│
└── 배포 스크립트/
    ├── deploy.sh, quick-deploy.sh
    ├── ec2-setup-complete.sh, ec2-control-guide.sh
    └── debug.sh, diagnose.sh, monitor.sh
```

### 2.3 컴포넌트 계층

```
_app.tsx (Next.js App)
  └── AlertProvider (Context API)
       └── Component (페이지 컴포넌트)
            ├── Header (네비게이션)
            │    ├── 로고 + 링크 (홈, 게임 만들기)
            │    └── 사용자 메뉴 (로그인/프로필/로그아웃)
            │
            ├── 페이지 콘텐츠
            │    ├── GameCard (게임 카드 그리드)
            │    ├── UploadModal (업로드 진행 상태)
            │    └── GoogleAd (광고 배너)
            │
            └── Footer (푸터 링크)
```

### 2.4 Next.js API Routes vs Express 서버 역할 분담

| 기능 | 담당 서버 | 이유 |
|------|----------|------|
| 사용자 인증 (JWT) | Next.js API | 빠른 응답, Next.js 통합 |
| 게임/댓글 CRUD | Next.js API | MongoDB 직접 접근 |
| 파일 메타데이터 처리 | Next.js API | S3 업로드 조율 |
| **GIF/WEBP → MP4 변환** | **Express 서버** | **FFmpeg 실행 (무거운 작업)** |
| 변환 파일 다운로드 | Express 서버 | 변환 결과 제공 |

**통신 흐름:**
```
클라이언트 → Next.js /api/upload → Express /convert (FFmpeg) → S3 업로드 → CloudFront
```

---

## 3. 데이터베이스 스키마 (Database Schema)

### 3.1 데이터베이스 구성

- **데이터베이스명**: `sukito`
- **연결**: MongoDB native driver (`lib/mongodb.ts`)
- **ORM**: Mongoose (선택적, `models/User.ts`)

### 3.2 컬렉션 관계 다이어그램

```
┌──────────────┐
│    Users     │
│  (_id, email)│
└──────┬───────┘
       │ createdBy
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│    Games     │   │  Resume_games│
│  (_id, items)│   │  (gameId)    │
└──────┬───────┘   └──────────────┘
       │ gameId
       │
       ├─────────────┬──────────────┐
       │             │              │
       ▼             ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Comments   │ │   Records    │ │  (Others)    │
│  (gameId)    │ │  (gameId)    │ └──────────────┘
└──────────────┘ └──────────────┘
```

### 3.3 Users (사용자)

**파일**: `models/User.ts`

```typescript
{
  _id: ObjectId,
  nickname: string,           // 필수, 사용자 닉네임
  email: string,              // 필수, 고유값 (unique)
  password: string,           // 필수, bcryptjs 해시
  role: 'user' | 'admin',     // 기본값: 'user'
  createdAt: Date             // 기본값: Date.now
}
```

**제약조건:**
- `email`: unique 인덱스
- `password`: bcryptjs 해시 (salt rounds: 10)
- `role`: 'user' 또는 'admin'만 허용

**용도:**
- 로그인/회원가입
- JWT 토큰 생성
- 관리자 권한 관리

### 3.4 Games (게임)

**파일**: `pages/api/games.ts`

```typescript
{
  _id: ObjectId,
  title: string,              // 게임 제목
  desc: string,               // 게임 설명
  items: [                    // 현재 게임 아이템 목록
    {
      name: string,           // 아이템 이름
      url: string,            // S3 URL (이미지/비디오)
      type: 'image' | 'gif' | 'youtube'
    }
  ],
  itemsHistory: [             // 전체 아이템 히스토리 (삭제 포함)
    { name, url, type }
  ],
  thumbnails: [               // 대표 썸네일 (최대 2개)
    { name, url, type }
  ],
  visibility: 'public' | 'private' | 'password',
  password?: string,          // visibility='password'인 경우
  type: string,               // 게임 타입 (tournament 등)
  createdBy: string,          // 생성자 userId
  createdAt: Date,            // 생성 시각
  updatedAt?: Date,           // 수정 시각
  playCount?: number          // 플레이 횟수 (aggregation, 저장 안됨)
}
```

**특징:**
- `itemsHistory`: 삭제된 항목도 보관 (복구 및 감사 추적)
- `playCount`: records 컬렉션에서 aggregation으로 계산
- `visibility`: 공개/비공개/비밀번호 보호

### 3.5 Comments (댓글)

**파일**: `pages/api/comments.ts`

```typescript
{
  _id: ObjectId,
  gameId: string,             // 게임 ID (참조)
  nickname: string,           // 필수, 작성자 닉네임
  content: string,            // 필수, 댓글 내용
  authorId: string,           // userId (로그인) 또는 sessionId (비로그인)
  authorType: 'user' | 'guest', // 기본값: 'guest'
  createdAt: Date,            // 작성 시각
  likes: number,              // 좋아요 수 (기본값: 0)
  dislikes: number,           // 싫어요 수 (기본값: 0)
  likeUsers: [string],        // 좋아요한 사용자 ID 배열
  dislikeUsers: [string],     // 싫어요한 사용자 ID 배열
  gameTitle?: string,         // 관리자 페이지용
  reportCount?: number        // 신고 횟수
}
```

**특징:**
- **Pinned Comments**: `likes >= 1`인 상위 3개 댓글 고정
- **중복 투표 방지**: likeUsers/dislikeUsers 배열로 관리
- **상호 배타적**: 좋아요 → 싫어요 전환 시 이전 투표 제거

### 3.6 Records (플레이 기록)

**파일**: `pages/api/records.ts`, `pages/api/ranking.ts`

```typescript
{
  _id: ObjectId,
  gameId: string,             // 게임 ID (참조)
  winnerName: string,         // 필수, 우승자 이름
  winnerUrl: string,          // 필수, 우승자 이미지 URL
  playedAt: Date              // 플레이 시각 (기본값: Date.now)
}
```

**용도:**
- 게임 플레이 기록 저장
- playCount 계산 (aggregation)
- 우승자 순위 생성

**Aggregation 예시 (랭킹):**
```javascript
// 특정 게임의 우승자 순위
db.records.aggregate([
  { $match: { gameId: "xxx" } },
  { $group: { _id: "$winnerName", count: { $sum: 1 }, url: { $first: "$winnerUrl" } } },
  { $sort: { count: -1 } },
  { $limit: 20 }
])
```

### 3.7 Resume_games (진행 중인 게임)

**파일**: `pages/api/resume.ts`

```typescript
{
  _id: ObjectId,
  userId: string,             // 필수, 사용자 ID
  gameId: string,             // 필수, 게임 ID (참조)
  gameTitle?: string,         // 캐시된 게임 제목
  gameDesc?: string,          // 캐시된 게임 설명
  selectedRound?: number,     // 선택한 토너먼트 라운드 (4, 8, 16, etc.)
  currentRound?: number,      // 현재 진행 중인 라운드
  remainingItems?: [any],     // 남은 아이템 배열
  winnerHistory?: [any],      // 이전 우승자 히스토리
  lastSavedAt: Date,          // 마지막 저장 시각
  updatedAt?: Date            // 업데이트 시각
}
```

**특징:**
- **Upsert 패턴**: 동일 userId + gameId 조합이 있으면 업데이트, 없으면 생성
- **localStorage 연동**: 클라이언트에서 진행 상황 저장 후 서버 동기화
- **게임 유효성 검증**: 게임이 삭제되면 resume 데이터도 무효

---

## 4. API 엔드포인트 레퍼런스 (API Reference)

### 4.1 인증 (Authentication)

#### POST /api/login
**설명**: 이메일/비밀번호 로그인, JWT 토큰 발급

**요청:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**성공 응답 (200):**
```json
{
  "message": "ログイン成功",
  "userId": "507f1f77bcf86cd799439011",
  "nickname": "my_nickname",
  "email": "user@example.com",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**에러 응답:**
- `400`: "登録されたメールアドレスではありません。" (미가입 이메일)
- `400`: "パスワードが一致しません。" (잘못된 비밀번호)

---

#### POST /api/signup
**설명**: 회원가입 (닉네임, 이메일, 비밀번호)

**요청:**
```json
{
  "nickname": "my_nickname",
  "email": "user@example.com",
  "password": "password123"
}
```

**성공 응답 (200):**
```json
{
  "message": "会員登録成功"
}
```

**에러 응답:**
- `400`: "登録済みのメールアドレスです。" (이메일 중복)

---

#### GET /api/jwt
**설명**: JWT 토큰 검증

**요청 헤더:**
```
Authorization: Bearer <jwt_token>
```

**성공 응답 (200):**
```json
{
  "user": {
    "userId": "507f1f77bcf86cd799439011",
    "userName": "my_nickname",
    "email": "user@example.com"
  },
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "nickname": "my_nickname"
}
```

**에러 응답:**
- `401`: "トークンが無効です。"

---

### 4.2 게임 (Games)

#### GET /api/games
**설명**: 모든 게임 목록 조회 (playCount 포함)

**성공 응답 (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "My Game",
    "desc": "Game description",
    "thumbnails": [
      { "name": "Item 1", "url": "https://...", "type": "image" }
    ],
    "createdAt": "2024-01-15T10:00:00Z",
    "createdBy": "user_id",
    "playCount": 42
  }
]
```

---

#### GET /api/games?id=xxx
**설명**: 특정 게임 상세 조회

**성공 응답 (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "My Game",
  "desc": "Description",
  "items": [
    { "name": "Item 1", "url": "https://...", "type": "image" }
  ],
  "thumbnails": [...],
  "createdAt": "2024-01-15T10:00:00Z",
  "createdBy": "user_id"
}
```

**에러 응답:**
- `404`: "ゲームが見つかりません。"

---

#### POST /api/games
**설명**: 새 게임 생성 (임시 저장)

**요청:**
```json
{
  "title": "New Game",
  "desc": "Description",
  "items": [],
  "visibility": "public",
  "type": "tournament"
}
```

**성공 응답 (201):**
```json
{
  "message": "保存完了",
  "id": "507f1f77bcf86cd799439011"
}
```

---

#### PATCH /api/games?id=xxx
**설명**: 게임 수정 (items, thumbnails 업데이트)

**요청:**
```json
{
  "title": "Updated Title",
  "desc": "Updated Description",
  "items": [
    { "name": "New Item", "url": "https://...", "type": "image" }
  ],
  "thumbnails": [...]
}
```

**성공 응답 (200):**
```json
{
  "message": "修正完了"
}
```

**특징:**
- `itemsHistory`는 자동으로 병합됨
- 삭제된 S3 파일 감지 및 정리

---

#### DELETE /api/games?id=xxx
**설명**: 게임 삭제 (S3 파일 + 댓글 + 기록 모두 삭제)

**성공 응답 (200):**
```json
{
  "message": "削除完了"
}
```

**Cascade 삭제:**
- S3 파일 삭제
- comments 컬렉션에서 gameId 일치하는 모든 댓글 삭제
- records 컬렉션에서 gameId 일치하는 모든 기록 삭제

---

### 4.3 댓글 (Comments)

#### GET /api/comments?id=xxx&page=1&limit=20
**설명**: 게임별 댓글 조회 (상위 3개 고정)

**성공 응답 (200):**
```json
{
  "comments": [
    {
      "_id": "comment_id",
      "gameId": "game_id",
      "nickname": "user_name",
      "content": "Great game!",
      "authorId": "user_id",
      "authorType": "user",
      "createdAt": "2024-01-15T10:00:00Z",
      "likes": 5,
      "dislikes": 0,
      "likeUsers": ["user_id_1", "user_id_2"],
      "dislikeUsers": []
    }
  ],
  "pinnedCount": 3
}
```

**정렬 로직:**
- Page 1: 상위 3개 좋아요 댓글 (고정) + 나머지 20개 (최신순)
- Page 2+: 20개씩 최신순 (고정 댓글 제외)

---

#### POST /api/comments
**설명**: 댓글 작성

**요청:**
```json
{
  "gameId": "game_id",
  "nickname": "user_name",
  "content": "Comment text",
  "userId": "user_id",        // 로그인 사용자
  "sessionId": "session_id"   // 비로그인 사용자
}
```

**성공 응답 (201):**
```json
{
  "message": "コメント保存完了"
}
```

---

#### POST /api/comments/like
**설명**: 댓글 좋아요/싫어요

**요청:**
```json
{
  "commentId": "comment_id",
  "action": "like",           // "like", "dislike", "unlike", "undislike"
  "userId": "user_id",
  "sessionId": "session_id"
}
```

**성공 응답 (200):**
```json
{
  "message": "アクション完了"
}
```

**로직:**
- `like`: likes++, likeUsers에 추가, dislikeUsers에서 제거 (있으면 dislikes--)
- `unlike`: likes--, likeUsers에서 제거
- `dislike`/`undislike`: 위와 동일하게 반대로

---

#### POST /api/comments/update
**설명**: 댓글 수정 (본인만 가능)

**요청:**
```json
{
  "commentId": "comment_id",
  "content": "Updated content",
  "userId": "user_id",
  "sessionId": "session_id"
}
```

**성공 응답 (200):**
```json
{
  "message": "更新完了"
}
```

**에러 응답:**
- `403`: "自分のコメントのみ編集できます。"

---

#### POST /api/comments/delete
**설명**: 댓글 삭제 (본인만 가능)

**요청:**
```json
{
  "commentId": "comment_id",
  "userId": "user_id",
  "sessionId": "session_id"
}
```

**성공 응답 (200):**
```json
{
  "message": "削除完了"
}
```

**에러 응답:**
- `403`: "自分のコメントのみ削除できます。"

---

### 4.4 파일 업로드 (File Upload)

#### POST /api/upload
**설명**: 파일 업로드 (이미지/GIF/WEBP → S3)

**요청 (multipart/form-data):**
```
file: [binary file]
folder: "games" (optional)
```

**GIF/WEBP 변환 플로우:**
```
1. Formidable로 파일 수신
2. Sharp로 이미지 검증
3. GIF/WEBP 감지
4. axios POST http://localhost:3001/convert (FormData)
5. FFmpeg 변환 (Express 서버)
6. MP4 다운로드
7. S3 업로드
8. CloudFront URL 반환
```

**성공 응답 (200) - GIF/WEBP:**
```json
{
  "results": [
    {
      "mp4Url": "https://d2ojyvx5ines08.cloudfront.net/games/xxx.mp4"
    }
  ]
}
```

**성공 응답 (200) - 이미지:**
```json
{
  "results": [
    {
      "url": "https://d2ojyvx5ines08.cloudfront.net/games/xxx.jpg"
    }
  ]
}
```

**에러 응답:**
- `400`: "ファイルサイズが20MBを超えています。"
- `400`: "画像ファイルが正しくありません。"

---

### 4.5 플레이 기록 (Records)

#### POST /api/records
**설명**: 게임 플레이 기록 저장

**요청:**
```json
{
  "gameId": "game_id",
  "winnerName": "Winner Name",
  "winnerUrl": "https://..."
}
```

**성공 응답 (201):**
```json
{
  "message": "記録が保存されました。"
}
```

---

#### GET /api/ranking?id=xxx
**설명**: 게임 우승자 순위 조회

**성공 응답 (200):**
```json
[
  {
    "name": "Winner Name",
    "count": 42,
    "url": "https://..."
  }
]
```

**정렬:** 우승 횟수 내림차순, 최대 20개

---

#### GET /api/winner?id=xxx
**설명**: 최신 우승자 조회

**성공 응답 (200):**
```json
{
  "name": "Winner Name",
  "url": "https://..."
}
```

---

### 4.6 관리자 API (Admin)

**모든 관리자 API는 `requireAdmin()` 검증 필요 (Authorization 헤더의 JWT 토큰에서 role='admin' 확인)**

#### GET /api/admin/users?page=1&limit=20&search=xxx
**설명**: 사용자 목록 조회 (관리자 전용)

**성공 응답 (200):**
```json
{
  "users": [
    {
      "_id": "user_id",
      "nickname": "user_name",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 100
}
```

---

#### POST /api/admin/updateRole
**설명**: 사용자 역할 변경 (user ↔ admin)

**요청:**
```json
{
  "userId": "user_id",
  "role": "admin"
}
```

**성공 응답 (200):**
```json
{
  "message": "役割を更新しました。"
}
```

---

#### GET /api/admin/games?page=1&limit=20
**설명**: 게임 목록 조회 (관리자 전용)

**성공 응답 (200):**
```json
{
  "games": [...],
  "total": 500
}
```

---

#### POST /api/admin/deleteGame
**설명**: 게임 강제 삭제 (S3 파일 + 댓글 + 기록 삭제)

**요청:**
```json
{
  "gameId": "game_id"
}
```

**성공 응답 (200):**
```json
{
  "message": "削除しました。"
}
```

---

#### GET /api/admin/comments?page=1&limit=20&search=xxx
**설명**: 댓글 목록 조회 (관리자 전용)

**성공 응답 (200):**
```json
{
  "comments": [
    {
      "_id": "comment_id",
      "gameId": "game_id",
      "gameTitle": "Game Title",
      "nickname": "user_name",
      "content": "Comment text",
      "createdAt": "2024-01-15T10:00:00Z",
      "reportCount": 2
    }
  ],
  "total": 1000
}
```

---

#### POST /api/admin/updateComment
**설명**: 댓글 수정 (관리자 전용)

**요청:**
```json
{
  "commentId": "comment_id",
  "content": "Updated content",
  "reportCount": 0
}
```

**성공 응답 (200):**
```json
{
  "message": "更新しました。"
}
```

---

#### POST /api/admin/deleteComment
**설명**: 댓글 강제 삭제

**요청:**
```json
{
  "commentId": "comment_id"
}
```

**성공 응답 (200):**
```json
{
"message": "削除しました。"
}
```

---

### 4.7 Express 서버 API (포트 3001)

#### POST /convert
**설명**: GIF/WEBP → MP4 변환 (FFmpeg)

**요청 (multipart/form-data):**
```
gif: [GIF/WEBP binary file]
```

**성공 응답 (200):**
```json
{
  "success": true,
  "message": "変換 完了",
  "data": {
    "originalName": "animation.gif",
    "outputFileName": "output_xxx.mp4",
    "fileSize": "5.42 MB",
    "downloadUrl": "/download/output_xxx.mp4"
  }
}
```

**에러 응답 (500):**
```json
{
  "success": false,
  "message": "変換 中 エラーが発生しました。"
}
```

---

#### GET /download/:filename
**설명**: 변환된 MP4 파일 다운로드

**응답:** Binary (video/mp4)

---

### 4.8 HTTP 상태 코드 정리

| 코드 | 의미 | 사용 예 |
|------|------|---------|
| 200 | OK | 조회, 수정, 삭제 성공 |
| 201 | Created | 생성 성공 (게임, 댓글, 기록) |
| 400 | Bad Request | 필수 필드 누락, 잘못된 데이터 |
| 401 | Unauthorized | 토큰 검증 실패, 비밀번호 불일치 |
| 403 | Forbidden | 권한 부족 (본인 댓글 아님, 관리자 권한 없음) |
| 404 | Not Found | 게임/댓글/사용자 없음 |
| 405 | Method Not Allowed | 지원하지 않는 HTTP 메서드 |
| 500 | Internal Server Error | 서버 에러, 처리 실패 |

---

## 5. 핵심 데이터 흐름 (Data Flows)

### 5.1 게임 생성 흐름

```
사용자 (make.tsx)
  ↓
1️⃣ 게임 기본 정보 입력
   - 제목, 설명, 공개 설정 (public/private/password)
   ↓
2️⃣ POST /api/games
   - 게임 ID 생성 (MongoDB insertOne)
   - items: [] (임시)
   - thumbnails: [] (임시)
   - 응답: { id: "xxx" }
   ↓
3️⃣ 탭 선택 (이미지/GIF/YouTube)
   - 이미지/GIF: 파일 선택
   - YouTube: URL 입력
   ↓
4️⃣ 파일 업로드 (각 파일마다)
   POST /api/upload (multipart/form-data)
   ├── Formidable로 파일 파싱
   ├── Sharp로 이미지 검증 (유효성, 손상 확인)
   ├── 파일 크기 확인 (최대 20MB)
   └── GIF/WEBP 감지
       ├── Yes: axios POST http://localhost:3001/convert
       │   ├── Express 서버에서 FFmpeg 실행
       │   ├── GIF → MP4 변환 (H.264 코덱)
       │   ├── /download/:filename에서 MP4 다운로드
       │   └── S3 업로드 (games/ 폴더)
       └── No (이미지): 이미지 압축 → S3 업로드
   ↓
5️⃣ CloudFront URL 반환
   - https://d2ojyvx5ines08.cloudfront.net/games/xxx.mp4
   - 프론트엔드에서 items 배열에 추가
   ↓
6️⃣ 대표 이미지 2개 선택 (썸네일)
   - thumbnails: [item1, item2]
   ↓
7️⃣ PATCH /api/games?id=xxx
   - items: [전체 아이템 배열]
   - thumbnails: [선택한 2개]
   - itemsHistory: 기존 + 새 항목 병합
   ↓
8️⃣ 게임 생성 완료
   - index.tsx에서 게임 카드로 표시
```

---

### 5.2 GIF/WEBP → MP4 변환 흐름 (상세)

```
클라이언트 (make.tsx)
  ↓ FormData (file: GIF)
Next.js API (/api/upload)
  ├── Formidable: multipart 파싱
  ├── Sharp: 이미지 검증
  └── GIF 감지
      ↓
      axios POST http://localhost:3001/convert (FormData)
      ↓
Express 서버 (server/app.js, 포트 3001)
  ├── Multer: 파일 수신 (./uploads/xxx.gif)
  ├── FFmpeg 명령어 실행:
  │   ffmpeg -i input.gif -vf scale=640:-1 -c:v libx264 -pix_fmt yuv420p output.mp4
  ├── 변환 완료
  └── 응답: { downloadUrl: "/download/output.mp4" }
      ↓
Next.js API (/api/upload)
  ├── axios GET http://localhost:3001/download/output.mp4
  ├── Binary 다운로드
  ├── AWS S3 업로드 (s3.upload)
  │   - Bucket: sukito-bucket
  │   - Key: games/xxx.mp4
  │   - ContentType: video/mp4
  └── CloudFront URL 반환
      ↓
클라이언트 (make.tsx)
  └── items 배열에 { name, url: CloudFront URL, type: 'gif' } 추가
```

**FFmpeg 옵션 설명:**
- `-vf scale=640:-1`: 너비 640px, 높이는 비율 유지
- `-c:v libx264`: H.264 코덱
- `-pix_fmt yuv420p`: 브라우저 호환성

---

### 5.3 게임 플레이 흐름

```
사용자 (index.tsx)
  ↓ 게임 카드 클릭
play/[id].tsx
  ↓
1️⃣ 데이터 로드
   GET /api/games?id=xxx
   ├── 게임 정보 (title, desc, items)
   └── GET /api/comments?id=xxx (댓글 목록)
   ↓
2️⃣ 토너먼트 라운드 선택
   - 4강, 8강, 16강, 32강, 64강
   - items 배열에서 선택한 라운드만큼 랜덤 추출
   ↓
3️⃣ 토너먼트 진행
   - matchIndex = 0
   - 매 라운드마다:
       ├── 2개 아이템 표시 (items[matchIndex*2], items[matchIndex*2+1])
       ├── 사용자 선택 (클릭)
       ├── 선택된 아이템 → advancing 배열에 추가
       └── matchIndex++
   ↓
4️⃣ 라운드 완료 시
   - items = advancing (다음 라운드 진출자)
   - advancing = []
   - round = round / 2
   - matchIndex = 0
   ↓
5️⃣ localStorage 저장 (진행 상황)
   localStorage.setItem('sukito_game', JSON.stringify({
     gameId, gameTitle, gameDesc,
     round, items, advancing, matchIndex
   }))
   ↓
6️⃣ 최종 우승자 결정
   - items.length === 1
   - result.tsx로 이동 (쿼리 파라미터: winnerName, winnerUrl)
   ↓
result.tsx
  ↓
7️⃣ 우승자 기록 저장
   POST /api/records
   {
     gameId, winnerName, winnerUrl
   }
   ↓
8️⃣ 순위 조회
   GET /api/ranking?id=xxx
   - records 컬렉션 aggregation
   - 우승자별 횟수 집계
   ↓
9️⃣ 결과 화면 표시
   - 우승자 이미지/이름
   - 순위표 (1위~20위)
   - 게임 정보
```

---

### 5.4 사용자 인증 흐름

```
회원가입 (signup.tsx)
  ↓
POST /api/signup
  ├── 이메일 중복 확인 (GET /api/check-email)
  ├── 비밀번호 bcryptjs 해싱 (10 salt rounds)
  └── users 컬렉션에 저장
      { nickname, email, password: hashed, role: 'user' }
  ↓
로그인 (login.tsx)
  ↓
POST /api/login
  ├── 이메일로 사용자 검색
  ├── bcrypt.compare(password, user.password)
  └── JWT 토큰 생성
      jwt.sign({
        userId, nickname, email, role
      }, JWT_SECRET, { expiresIn: '7d' })
  ↓
클라이언트 (login.tsx)
  ├── localStorage 저장
  │   - token
  │   - userId
  │   - nickname
  │   - role
  └── location.href = '/' (리다이렉트)
  ↓
이후 API 요청
  ├── Authorization: Bearer <token> 헤더 추가
  ├── JWT 검증 (GET /api/jwt)
  │   └── jwt.verify(token, JWT_SECRET)
  └── 사용자 정보 반환
```

**JWT Payload 예시:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "nickname": "my_nickname",
  "email": "user@example.com",
  "role": "user",
  "iat": 1705315200,
  "exp": 1705920000
}
```

---

### 5.5 댓글 작성 및 좋아요 흐름

```
게임 플레이 페이지 (play/[id].tsx)
  ↓ 댓글 입력
POST /api/comments
  {
    gameId, nickname, content,
    userId: localStorage.getItem('userId'),      // 로그인 사용자
    sessionId: uuidv4()                          // 비로그인 사용자
  }
  ↓
MongoDB comments 컬렉션에 저장
  {
    gameId, nickname, content,
    authorId: userId || sessionId,
    authorType: userId ? 'user' : 'guest',
    createdAt: new Date(),
    likes: 0, dislikes: 0,
    likeUsers: [], dislikeUsers: []
  }
  ↓
댓글 목록 조회
GET /api/comments?id=xxx&page=1&limit=20
  ├── 상위 3개 고정 (likes >= 1, 좋아요 순)
  └── 나머지 최신순 (createdAt desc)
  ↓
사용자가 좋아요 클릭
  ↓
POST /api/comments/like
  {
    commentId, action: 'like',
    userId, sessionId
  }
  ↓
MongoDB 업데이트
  ├── likeUsers 배열에 userId 추가
  ├── likes++ (increment)
  ├── dislikeUsers에서 userId 제거 (있으면)
  └── dislikes-- (있으면)
  ↓
댓글 목록 재조회
  - 좋아요 수 업데이트 반영
  - 상위 3개 재정렬
```

**좋아요 로직 (MongoDB 업데이트):**
```javascript
// 좋아요 추가 + 싫어요 제거
{
  $addToSet: { likeUsers: userId },
  $pull: { dislikeUsers: userId },
  $inc: {
    likes: 1,
    dislikes: dislikeUsers.includes(userId) ? -1 : 0
  }
}
```

---

## 6. 개발 규칙 (Development Guidelines)

### 6.1 코딩 컨벤션

#### 파일명 규칙
- **페이지 컴포넌트**: `PascalCase.tsx` (예: `GameCard.tsx`)
- **API 파일**: `kebab-case.ts` (예: `check-email.ts`)
- **유틸리티**: `camelCase.ts` (예: `adminAuth.ts`)

#### TypeScript
- **Strict 모드 활용**: `tsconfig.json`에서 `strict: true` 설정
- **타입 정의**: API 응답, Props는 명시적 타입 정의
- **any 사용 최소화**: 불가피한 경우만 사용

**좋은 예:**
```typescript
type Game = {
  _id: string;
  title: string;
  desc: string;
  items: GameItem[];
};
```

**나쁜 예:**
```typescript
const game: any = await fetch('/api/games');
```

#### 컴포넌트 구조
```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import Header from '@/components/Header';

// 2. Types
type Props = {
  title: string;
  desc: string;
};

// 3. Component
export default function MyComponent({ title, desc }: Props) {
  // State
  const [data, setData] = useState([]);

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}

// 4. Styles (if any)
const styles = {
  container: { ... }
};
```

---

### 6.2 아키텍처 원칙

#### API Routes 설계
- **가벼운 작업만**: 데이터베이스 쿼리, 간단한 비즈니스 로직
- **무거운 작업 위임**: FFmpeg, 이미지 처리는 Express 서버로
- **타임아웃 고려**: Next.js API Routes는 10초 제한 (Vercel 기준)

**적절한 사용:**
```typescript
// pages/api/games.ts
export default async function handler(req, res) {
  const db = await connectToDatabase();
  const games = await db.collection('games').find().toArray();
  res.status(200).json(games);
}
```

**부적절한 사용 (FFmpeg):**
```typescript
// ❌ Next.js API에서 FFmpeg 실행 (지양)
// ✅ Express 서버로 위임
```

#### S3 파일 관리
- **항상 CloudFront URL 사용**: S3 직접 URL 사용 금지
- **파일 삭제 시 S3도 삭제**: 게임 삭제 시 itemsHistory의 모든 URL 삭제

**CloudFront URL 형식:**
```
https://d2ojyvx5ines08.cloudfront.net/games/xxx.mp4
```

#### 에러 처리
- **모든 API는 try-catch로 감싸기**
- **에러 메시지는 일본어로 통일**
- **HTTP 상태 코드 일관성 유지**

**표준 패턴:**
```typescript
export default async function handler(req, res) {
  // 1. 메서드 확인
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '許可されていないメソッドです。' });
  }

  try {
    // 2. 필수 데이터 확인
    const { gameId, nickname, content } = req.body;
    if (!gameId || !nickname || !content) {
      return res.status(400).json({ message: '必須データが欠落しています。' });
    }

    // 3. 비즈니스 로직
    // ...

    // 4. 성공 응답
    return res.status(200).json({ message: '成功' });
  } catch (error) {
    console.error('エラー:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
}
```

---

### 6.3 보안 규칙

#### 비밀번호 처리
```typescript
// ✅ 항상 bcryptjs로 해싱
import bcrypt from 'bcryptjs';

// 회원가입 시
const hashedPassword = await bcrypt.hash(password, 10);

// 로그인 시
const isValid = await bcrypt.compare(password, user.password);
```

#### JWT 토큰
- **유효기간**: 7일
- **시크릿 키**: 환경변수 `JWT_SECRET` 사용
- **검증**: 모든 보호된 API에서 `jwt.verify()` 호출

**토큰 생성:**
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId, nickname, email, role },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
);
```

**토큰 검증:**
```typescript
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
```

#### 관리자 권한
- **모든 /api/admin/* 엔드포인트는 `requireAdmin()` 필수**
- **구현**: `utils/adminAuth.ts`

**사용 예시:**
```typescript
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req, res) {
  // 관리자 권한 확인
  if (requireAdmin(req, res)) return;

  // 관리자 전용 로직
  // ...
}
```

#### 환경변수 보안
- **절대 커밋 금지**: `.env`, `.env.local` 파일
- **`.gitignore`에 추가**:
```
.env
.env.local
.env.production
sukito-ec2-key.pem
```

---

### 6.4 데이터베이스 규칙

#### MongoDB 연결
- **Connection Pooling**: `lib/mongodb.ts`에서 전역 연결 재사용
- **에러 처리**: 연결 실패 시 재시도 로직

```typescript
import { connectToDatabase } from '@/lib/mongodb';

const db = await connectToDatabase();
const collection = db.collection('games');
```

#### 쿼리 최적화
- **필요한 필드만 조회**: `projection` 사용
- **페이지네이션**: `skip()`, `limit()` 활용
- **인덱스 활용**: 자주 검색하는 필드 (email, gameId 등)

**좋은 예:**
```typescript
const users = await db.collection('users')
  .find({}, { projection: { password: 0 } })  // 비밀번호 제외
  .skip((page - 1) * limit)
  .limit(limit)
  .toArray();
```

---

### 6.5 파일 업로드 규칙

#### 파일 크기 제한
- **최대 크기**: 20MB
- **검증 위치**: `pages/api/upload.ts` (Formidable options)

```typescript
const form = formidable({
  maxFileSize: 20 * 1024 * 1024,  // 20MB
});
```

#### 지원 파일 형식
- **이미지**: JPG, JPEG, PNG
- **애니메이션**: GIF, WEBP (자동 MP4 변환)
- **동영상**: YouTube URL (embed 형식)

#### S3 업로드 규칙
- **Bucket**: `sukito-bucket`
- **폴더 구조**:
  - `games/`: 게임 파일
  - `thumbnails/`: 썸네일
- **ContentType 설정**: 올바른 MIME 타입 지정

---

## 7. 환경 설정 (Configuration)

### 7.1 필수 환경변수

**파일**: `.env.local` (프로덕션에서는 `.env.production`)

```bash
# MongoDB 연결
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sukito?retryWrites=true&w=majority

# JWT 시크릿 키 (랜덤 문자열 권장)
JWT_SECRET=your-super-secret-jwt-key-change-this

# AWS S3 자격증명
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=ap-northeast-1
S3_BUCKET=sukito-bucket

# CloudFront CDN
CLOUDFRONT_URL=https://d2ojyvx5ines08.cloudfront.net

# EC2 변환 서버 URL
EC2_SERVER_URL=http://localhost:3001           # 로컬 개발
# EC2_SERVER_URL=https://sukito.net             # 프로덕션
```

---

### 7.2 next.config.ts

```typescript
const nextConfig = {
  // CloudFront 도메인 허용
  images: {
    domains: ['d2ojyvx5ines08.cloudfront.net'],
    formats: ['image/webp', 'image/avif'],
  },

  // 프로덕션: console.log 제거
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

---

### 7.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]    // @ 별칭으로 루트 접근
    }
  }
}
```

**Path Alias 사용 예시:**
```typescript
import Header from '@/components/Header';
import { connectToDatabase } from '@/lib/mongodb';
```

---

### 7.4 ecosystem.config.js (PM2)

```javascript
module.exports = {
  apps: [
    {
      name: 'sukito-nextjs',
      script: 'npm',
      args: 'start',
      cwd: '/home/ubuntu/sukito',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=2048',  // 2GB 메모리
      },
      max_memory_restart: '1G',
      error_file: '~/.pm2/logs/sukito-nextjs-error.log',
      out_file: '~/.pm2/logs/sukito-nextjs-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'sukito-api',
      script: 'node',
      args: 'server/app.js',
      cwd: '/home/ubuntu/sukito',
      env: {
        PORT: 3001,
        NODE_OPTIONS: '--max-old-space-size=1024',  // 1GB 메모리
      },
      max_memory_restart: '1G',
      error_file: '~/.pm2/logs/sukito-api-error.log',
      out_file: '~/.pm2/logs/sukito-api-out.log',
    },
  ],
};
```

---

### 7.5 nginx.conf

```nginx
# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name sukito.net www.sukito.net;
    return 301 https://$server_name$request_uri;
}

# HTTPS 메인 설정
server {
    listen 443 ssl http2;
    server_name sukito.net www.sukito.net;

    # SSL 인증서 (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/sukito.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sukito.net/privkey.pem;

    # Next.js API Routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Express 변환 서버
    location /convert {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        client_max_body_size 20M;
    }

    location /download {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }

    # Next.js 정적 파일
    location /_next/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 메인 앱
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

---

## 8. 배포 가이드 (Deployment)

### 8.1 배포 아키텍처

```
GitHub Repository
    ↓ git pull
EC2 인스턴스 (Ubuntu)
    ├── /home/ubuntu/sukito/ (프로젝트 루트)
    ├── Node.js 18+
    ├── PM2 (프로세스 관리)
    │   ├── sukito-nextjs (포트 3000)
    │   └── sukito-api (포트 3001)
    ├── Nginx (포트 80/443)
    │   └── 리버스 프록시 → PM2 프로세스
    └── MongoDB (외부 또는 로컬)
```

---

### 8.2 배포 스크립트

#### deploy.sh (전체 배포)
```bash
#!/bin/bash
# 전체 배포: git pull + 빌드 + 재시작

cd /home/ubuntu/sukito
git pull origin main
npm install
npm run build
pm2 restart ecosystem.config.js
```

**실행:**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

#### quick-deploy.sh (빠른 재시작)
```bash
#!/bin/bash
# 빠른 재시작: 코드 변경 후 재시작만

cd /home/ubuntu/sukito
pm2 restart ecosystem.config.js
```

---

### 8.3 PM2 명령어

```bash
# 프로세스 시작
pm2 start ecosystem.config.js

# 프로세스 재시작
pm2 restart ecosystem.config.js

# 프로세스 중지
pm2 stop ecosystem.config.js

# 프로세스 삭제
pm2 delete ecosystem.config.js

# 로그 확인
pm2 logs sukito-nextjs
pm2 logs sukito-api

# 상태 확인
pm2 status

# 모니터링
pm2 monit
```

---

### 8.4 로그 확인

```bash
# PM2 로그
tail -f ~/.pm2/logs/sukito-nextjs-out.log
tail -f ~/.pm2/logs/sukito-nextjs-error.log
tail -f ~/.pm2/logs/sukito-api-out.log
tail -f ~/.pm2/logs/sukito-api-error.log

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

### 8.5 트러블슈팅

#### 문제: 포트 3000/3001이 이미 사용 중
**해결:**
```bash
# 프로세스 확인
lsof -i :3000
lsof -i :3001

# 프로세스 종료
kill -9 <PID>

# PM2 재시작
pm2 restart ecosystem.config.js
```

---

#### 문제: 메모리 부족 (out of memory)
**해결:**
```bash
# 메모리 확인
free -h

# PM2 메모리 제한 확인
pm2 status

# 메모리 초과 프로세스 재시작
pm2 restart sukito-nextjs
```

**예방:**
- `ecosystem.config.js`에서 `max_memory_restart: '1G'` 설정
- `NODE_OPTIONS: '--max-old-space-size=2048'` 설정

---

#### 문제: S3 업로드 실패
**원인:**
- AWS 자격증명 오류
- 버킷 권한 부족
- 네트워크 문제

**해결:**
```bash
# 환경변수 확인
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# .env.local 파일 확인
cat .env.local

# S3 권한 확인 (AWS Console)
# - PutObject, GetObject, DeleteObject 권한 필요
```

---

#### 문제: FFmpeg 변환 실패
**원인:**
- FFmpeg 미설치
- 파일 권한 문제
- 임시 디렉토리 부족

**해결:**
```bash
# FFmpeg 설치 확인
ffmpeg -version

# 임시 디렉토리 확인
ls -la server/uploads
ls -la server/outputs

# 디렉토리 생성 (없으면)
mkdir -p server/uploads server/outputs

# 권한 설정
chmod 755 server/uploads server/outputs
```

---

## 9. 파일 참조 가이드 (File Reference)

### 9.1 게임 생성 관련

| 기능 | 파일 |
|------|------|
| UI | [pages/make.tsx](pages/make.tsx) |
| API (게임 생성) | [pages/api/games.ts](pages/api/games.ts) |
| API (파일 업로드) | [pages/api/upload.ts](pages/api/upload.ts) |
| API (변환 서버) | [server/app.js](server/app.js) |
| S3 업로드 | [lib/aws-s3.ts](lib/aws-s3.ts) |
| FFmpeg 변환 | [lib/ffmpeg.ts](lib/ffmpeg.ts) |

---

### 9.2 게임 플레이 관련

| 기능 | 파일 |
|------|------|
| 게임 목록 | [pages/index.tsx](pages/index.tsx) |
| 게임 플레이 | [pages/play/[id].tsx](pages/play/[id].tsx) |
| 결과 페이지 | [pages/result.tsx](pages/result.tsx) |
| 게임 API | [pages/api/games.ts](pages/api/games.ts) |
| 댓글 API | [pages/api/comments.ts](pages/api/comments.ts) |
| 기록 API | [pages/api/records.ts](pages/api/records.ts) |
| 순위 API | [pages/api/ranking.ts](pages/api/ranking.ts) |
| 우승자 API | [pages/api/winner.ts](pages/api/winner.ts) |
| 이어하기 API | [pages/api/resume.ts](pages/api/resume.ts) |

---

### 9.3 사용자 인증 관련

| 기능 | 파일 |
|------|------|
| 로그인 UI | [pages/login.tsx](pages/login.tsx) |
| 회원가입 UI | [pages/signup.tsx](pages/signup.tsx) |
| 프로필 편집 | [pages/profile.tsx](pages/profile.tsx) |
| 로그인 API | [pages/api/login.ts](pages/api/login.ts) |
| 회원가입 API | [pages/api/signup.ts](pages/api/signup.ts) |
| JWT 검증 API | [pages/api/jwt.ts](pages/api/jwt.ts) |
| 이메일 확인 | [pages/api/check-email.ts](pages/api/check-email.ts) |
| 사용자 정보 | [pages/api/user.ts](pages/api/user.ts) |
| 계정 수정 | [pages/api/update.ts](pages/api/update.ts) |
| 계정 삭제 | [pages/api/delete.ts](pages/api/delete.ts) |
| User 모델 | [models/User.ts](models/User.ts) |

---

### 9.4 댓글 관련

| 기능 | 파일 |
|------|------|
| 댓글 CRUD | [pages/api/comments.ts](pages/api/comments.ts) |
| 댓글 좋아요 | [pages/api/comments/like.ts](pages/api/comments/like.ts) |
| 댓글 수정 | [pages/api/comments/update.ts](pages/api/comments/update.ts) |
| 댓글 삭제 | [pages/api/comments/delete.ts](pages/api/comments/delete.ts) |
| 댓글 템플릿 | [lib/commentTemplates.ts](lib/commentTemplates.ts) |

---

### 9.5 관리자 관련

| 기능 | 파일 |
|------|------|
| 관리자 대시보드 | [pages/admin/index.tsx](pages/admin/index.tsx) |
| 사용자 관리 | [pages/api/admin/users.ts](pages/api/admin/users.ts) |
| 게임 관리 | [pages/api/admin/games.ts](pages/api/admin/games.ts) |
| 댓글 관리 | [pages/api/admin/comments.ts](pages/api/admin/comments.ts) |
| 역할 변경 | [pages/api/admin/updateRole.ts](pages/api/admin/updateRole.ts) |
| 게임 수정 | [pages/api/admin/updateGame.ts](pages/api/admin/updateGame.ts) |
| 댓글 수정 | [pages/api/admin/updateComment.ts](pages/api/admin/updateComment.ts) |
| 게임 삭제 | [pages/api/admin/deleteGame.ts](pages/api/admin/deleteGame.ts) |
| 댓글 삭제 | [pages/api/admin/deleteComment.ts](pages/api/admin/deleteComment.ts) |
| 사용자 삭제 | [pages/api/admin/delete.ts](pages/api/admin/delete.ts) |
| 관리자 인증 | [utils/adminAuth.ts](utils/adminAuth.ts) |

---

### 9.6 유틸리티 및 컴포넌트

| 기능 | 파일 |
|------|------|
| MongoDB 연결 | [lib/mongodb.ts](lib/mongodb.ts) |
| S3 업로드/삭제 | [lib/aws-s3.ts](lib/aws-s3.ts) |
| 유틸리티 함수 | [lib/utils.ts](lib/utils.ts) |
| Alert Context | [lib/alert.tsx](lib/alert.tsx) |
| 헤더 컴포넌트 | [components/Header.tsx](components/Header.tsx) |
| 게임 카드 | [components/GameCard.tsx](components/GameCard.tsx) |
| 업로드 모달 | [components/UploadModal.tsx](components/UploadModal.tsx) |
| Alert 모달 | [components/AlertModal.tsx](components/AlertModal.tsx) |
| Google 광고 | [components/GoogleAd.tsx](components/GoogleAd.tsx) |

---

## 10. 알려진 이슈 및 개선 사항 (Known Issues & Improvements)

### 10.1 현재 상태

**전체적으로 잘 구성된 프로덕션 레벨의 Next.js 게임 플랫폼**
- ✅ 안정적인 아키텍처 (Next.js + 별도 API 서버)
- ✅ 완성도 높은 기능 (게임 생성, 플레이, 관리자 패널)
- ✅ AWS 인프라 활용 (S3, CloudFront)
- ✅ 적절한 보안 설정 (JWT, 헤더 보안)
- ✅ PM2 기반 프로덕션 배포

---

### 10.2 즉시 수정 권장 사항

#### 1. 코드 품질
- **ESLint 설정 필요**: `npm run lint` 시 ESLint 설정이 안되어 있음
- **사용하지 않는 변수 정리**: pages/index.tsx에 10개의 미사용 스타일 변수
- **Console.log 정리**: 프로덕션 코드에 70개 이상의 console 출력 존재

**해결 방법:**
```bash
# ESLint 설정
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin

# .eslintrc.json 생성
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "warn"
  }
}

# Lint 실행
npm run lint
```

---

#### 2. 의존성 업데이트
- **보안 패치**: @types/node (20.17.45 → 24.3.1), next (15.3.0 → 15.5.2) 등
- **마이너 업데이트**: mongodb, mongoose, bootstrap 등 12개 패키지

**해결 방법:**
```bash
npm outdated
npm update
npm audit fix
```

---

#### 3. 보안 강화
- **환경변수 파일**: .env 파일이 누락되어 있음 (README에서 언급된 설정들)
- **Private key 노출**: sukito-ec2-key.pem이 repository에 커밋됨 (.gitignore 추가 필요)

**해결 방법:**
```bash
# .gitignore에 추가
echo "sukito-ec2-key.pem" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Git에서 제거 (이미 커밋된 경우)
git rm --cached sukito-ec2-key.pem
git commit -m "Remove private key from repository"
```

---

### 10.3 중장기 개선 제안

#### 1. 타입 안전성
- TypeScript strict 모드 활용 개선
- API 응답 타입 정의 통일
- Props 타입 정의 강화

**예시:**
```typescript
// types/api.ts
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export type GameResponse = ApiResponse<Game>;
export type CommentsResponse = ApiResponse<Comment[]>;
```

---

#### 2. 성능 최적화
- React.memo, useMemo 적용으로 불필요한 렌더링 방지
- 이미지 lazy loading 구현
- 게임 목록 pagination/infinite scroll

**예시:**
```typescript
import { memo } from 'react';

const GameCard = memo(({ id, title, desc }: GameCardProps) => {
  // ...
});

export default GameCard;
```

---

#### 3. 테스트 환경
- Jest + Testing Library 설정
- 핵심 API 엔드포인트 테스트 코드
- E2E 테스트 (Playwright/Cypress)

**설정 예시:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

---

#### 4. 모니터링
- 에러 추적 (Sentry 등)
- 성능 모니터링
- 사용자 분석

**Sentry 설정 예시:**
```bash
npm install @sentry/nextjs

# sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

#### 5. 개발자 경험
- Prettier 설정으로 코드 포맷팅 통일
- Husky + lint-staged로 pre-commit hook
- Storybook으로 컴포넌트 문서화

**Prettier 설정:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

#### 6. 추가 보안 강화
- **Rate Limiting**: API 요청 속도 제한
- **CSRF 토큰**: Cross-Site Request Forgery 방어
- **입력값 Sanitization**: XSS 방지

**Rate Limiting 예시 (Express Middleware):**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 100,                   // 최대 100 요청
  message: 'Too many requests',
});

app.use('/api/', limiter);
```

---

### 10.4 우선순위별 작업 순서

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

---

### 10.5 주의사항

- **환경변수는 절대 커밋하지 말 것**
- **Private key 파일들은 .gitignore에 추가**
- **프로덕션 환경에서는 console.log 제거**
- **PM2 로그 파일 정기적 정리 필요**

```bash
# PM2 로그 정리
pm2 flush

# 로그 파일 크기 확인
du -sh ~/.pm2/logs/
```

---

## 부록 (Appendix)

### A. 주요 라이브러리 버전

| 라이브러리 | 버전 |
|-----------|------|
| next | 15.3.0 |
| react | 19.0.0 |
| typescript | 5.8.3 |
| mongodb | 6.16.0 |
| mongoose | 8.13.2 |
| aws-sdk | 2.1692.0 |
| bcryptjs | 3.0.2 |
| jsonwebtoken | 9.0.2 |
| formidable | 3.5.4 |
| axios | 1.11.0 |
| bootstrap | 5.3.5 |
| ffmpeg-static | 5.2.0 |
| fluent-ffmpeg | 2.1.3 |

---

### B. 유용한 명령어 모음

```bash
# 개발
npm run dev
npm run build
npm start

# PM2
pm2 start ecosystem.config.js
pm2 restart all
pm2 logs
pm2 monit
pm2 status

# Git
git pull origin main
git status
git log --oneline -10

# 로그 확인
tail -f ~/.pm2/logs/sukito-nextjs-out.log
sudo tail -f /var/log/nginx/access.log

# 시스템
df -h                    # 디스크 사용량
free -h                  # 메모리 사용량
top                      # CPU 사용량
lsof -i :3000           # 포트 사용 확인
```

---

### C. 참고 링크

- **Next.js 공식 문서**: https://nextjs.org/docs
- **MongoDB 드라이버**: https://www.mongodb.com/docs/drivers/node/current/
- **AWS SDK for JavaScript**: https://docs.aws.amazon.com/sdk-for-javascript/
- **FFmpeg 문서**: https://ffmpeg.org/documentation.html
- **PM2 문서**: https://pm2.keymetrics.io/docs/usage/quick-start/

---

## 핵심 보완 사항 (Critical Improvements Needed)

### 🔴 우선순위 1: 보안 취약점
- **Private Key 노출**: `sukito-ec2-key.pem` 파일이 Git 저장소에 커밋됨 → 즉시 `.gitignore` 추가 및 키 재발급 필요
- **환경변수 누락**: `.env.local` 파일 미설정 → MongoDB URI, AWS 자격증명, JWT_SECRET 등 민감 정보 관리 체계 구축

### 🟠 우선순위 2: 코드 품질
- **ESLint 미설정**: `npm run lint` 실행 불가 → TypeScript/Next.js ESLint 플러그인 설치 및 설정 필요
- **Console.log 과다**: 프로덕션 코드에 70+ 개 존재 → 적절한 로깅 라이브러리(winston, pino) 도입 또는 제거
- **미사용 코드**: `pages/index.tsx`에 10개 미사용 스타일 변수 → 코드 정리

### 🟡 우선순위 3: 의존성 관리
- **보안 패치 필요**: @types/node, next, mongodb 등 12개 패키지 업데이트 대기 중
- **취약점 점검**: `npm audit` 실행 후 critical/high 등급 취약점 우선 해결

### 🟢 우선순위 4: 테스트 환경
- **테스트 코드 부재**: Jest, Testing Library 미설정 → 핵심 API(로그인, 게임 생성, 댓글) 단위 테스트 구축
- **E2E 테스트 없음**: Playwright 또는 Cypress로 주요 사용자 플로우 검증 필요

### 🔵 우선순위 5: 모니터링 및 성능
- **에러 추적 없음**: Sentry 등 에러 모니터링 도구 미도입 → 프로덕션 에러 파악 어려움
- **Rate Limiting 부재**: API 남용 방지 장치 없음 → Express middleware로 요청 속도 제한 구현
- **성능 최적화**: 이미지 lazy loading, React.memo 미적용 → 불필요한 렌더링 발생 가능성

---

**마지막 업데이트**: 2025-01-09
**작성자**: Claude Code
**버전**: 2.0.0

---

## 11. 변경 이력 (Change Log)

> 작업이 완료될 때마다 이 섹션에 날짜와 내용을 추가합니다.

---

### 2026-04-12 — SEO 및 코드 품질 개선

#### 홈페이지 SSR 전환 (`pages/index.tsx`)
- **변경 전**: `useEffect` + `fetch('/api/games')` — CSR 방식 (Google 봇이 게임 목록 인식 불가)
- **변경 후**: `getServerSideProps`로 MongoDB에서 직접 게임 목록 + playCount 조회 — SSR 방식
- **효과**: 페이지 소스에 게임 목록이 포함되어 Google 크롤링 및 Ads 품질 점수 개선 기대
- **제거**: 로딩 애니메이션(`UploadModal`), 게임 fetch `useEffect`

#### play 페이지 OG태그 보완 (`pages/play/[id].tsx`)
- **변경 전**: 게임 시작 전 화면에 `og:image` 없음, `twitter:card: summary`
- **변경 후**: `og:image`, `og:locale`, `twitter:image` 추가, `twitter:card: summary_large_image` 변경
- **추가**: `getOgImage()` 헬퍼 — YouTube는 `img.youtube.com` 썸네일 자동 변환, GIF는 기본 이미지로 fallback
- **추가**: `getServerSideProps`에서 `thumbnails` 필드 fetch 포함

#### sitemap 동적 생성 (`pages/sitemap.xml.tsx` 신규)
- **변경 전**: `public/sitemap.xml` 정적 파일 — 8개 고정 페이지만 등록, 게임 URL 없음
- **변경 후**: DB에서 전체 게임 조회 후 `/play/{id}` URL 자동 포함, 24시간 캐싱
- **삭제**: `public/sitemap.xml`

#### robots.txt 수정 (`public/robots.txt`)
- 한국어 주석 제거 (일본어 사이트에 한국어 노출 방지)
- `Crawl-delay: 1` 제거
- `Disallow: /api/` 추가 (API 엔드포인트 크롤링 차단)

#### console.log 정리
- `pages/api/upload.ts`: 환경변수 노출 로그 4줄 제거 (보안)
- `pages/bulk.tsx`: 디버그 log/warn 제거
- `pages/result.tsx`: console.warn 제거

#### GameCard 하단 클릭 영역 추가 (`components/GameCard.tsx`)
- 제목/설명 영역 클릭 시 게임 시작 (새 탭)
- 마우스 오버 시 배경 연한 초록, 제목 진한 초록으로 변경 (0.2s 트랜지션)

#### SSR 전환에 따른 버그 수정 (`components/GameCard.tsx`)
- `window.location.origin` 최상단 직접 참조 → `typeof window !== 'undefined'` 조건부 처리
- SSR 환경(서버)에서 `window is not defined` 에러 방지

#### 파일 정리
- **삭제**: `260412Edit.md`, `manual-deploy.sh`, `ec2-setup-complete.sh`, `ec2-control-guide.sh`, `debug.sh`
- **이유**: 작업 완료된 분석 보고서, 중복 배포 가이드, 초기 셋업 완료 스크립트
