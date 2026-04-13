# CLAUDE.md — Sukito (スキト)

일본어 토너먼트 투표 게임 플랫폼.

## 기술 스택

- Next.js 15 + React 19 + TypeScript + Bootstrap 5
- MongoDB (native driver) | AWS S3 + CloudFront | JWT + bcryptjs
- Deploy: PM2 + Nginx + EC2 (Ubuntu)

## 개발 명령어

```bash
npm run dev          # 개발 서버 (포트 3000)
npm run build        # 프로덕션 빌드
npm run pm2:restart  # PM2 재시작
npm run pm2:logs     # 로그 확인
```

## 핵심 규칙 (항상 적용)

1. `window` / `localStorage` → **반드시 `useEffect` 안에서만** 사용
2. API 에러 메시지 → **일본어**로 작성
3. S3 파일 → **CloudFront URL**로만 참조 (`d2ojyvx5ines08.cloudfront.net`)
4. `.env*` 파일 → **절대 커밋 금지**
5. 관리자 API → **`requireAdmin()` 필수** (`utils/adminAuth.ts`)

## 상황별 참조 파일

| 상황 | 참조 | 업데이트 시점 |
|---|---|---|
| EC2 배포 / PM2 / Nginx | [docs/claude/deploy.md](docs/claude/deploy.md) | 배포 절차가 바뀔 때 |
| DB 스키마 / 쿼리 작성 | [docs/claude/db-schema.md](docs/claude/db-schema.md) | 컬렉션/필드 추가·변경 시 |
| SSR / hydration 오류 | [docs/claude/ssr-rules.md](docs/claude/ssr-rules.md) | 새 SSR 버그 발견·해결 시 |
| 인증 / 보안 / 파일 업로드 | [docs/claude/security.md](docs/claude/security.md) | 보안 정책 변경 시 |
| 과거 변경 이력 확인 | [docs/claude/history.md](docs/claude/history.md) | **작업 완료 후 매번** |

## 파일 업데이트 규칙

**history.md — 사용자가 요청할 때만 업데이트**
- 시점: 사용자가 "변경 이력 정리해줘" 등으로 명시적으로 요청한 경우
- 형식: `YYYY-MM-DD` + 수정 파일 + 한 줄 설명
- 기준: 기능 추가, 버그 수정, 구조 변경 포함. 오타/스타일만 수정한 경우 생략 가능

**나머지 파일 — 해당 영역 작업 시에만 업데이트**
- DB 스키마 변경 → `db-schema.md` 동기화
- 배포 절차 바뀜 → `deploy.md` 수정
- 새 SSR 버그 패턴 발견 → `ssr-rules.md`에 사례 추가

## 주요 파일

```
pages/index.tsx          홈 (SSR)
pages/play/[id].tsx      게임 플레이 (SSR + OG태그)
pages/sitemap.xml.tsx    동적 sitemap
pages/api/               API 라우트
components/              Header, GameCard, UploadModal, GoogleAd
lib/mongodb.ts           DB 연결
server/app.js            Express FFmpeg 서버 (포트 3001)
```
