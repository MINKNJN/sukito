# 변경 이력

## 2026-04-23

### 마케팅 추적 시스템 구축
- `pages/_document.tsx`: 기존 GA4 gtag 직접 스크립트 제거
- `pages/_document.tsx`: GTM(`GTM-KQTKB8RT`) 스크립트 설치 (`<head>` 최상단 + `<body>` noscript)
- `pages/_document.tsx`: TikTok 픽셀(`D7HMBKRC77U62Q87D7FG`), X 픽셀(`rbzh9`), Meta 픽셀(`2202013950602138`) 베이스 스크립트 설치
- `lib/tracking.ts`: 신규 생성 — `trackTournamentStart`, `trackTournamentComplete`, `trackResultShare` (GTM dataLayer + 각 픽셀 동시 발사)
- `pages/play/[id].tsx`: 게임 시작(`startTournament`) 및 완료 시점에 추적 이벤트 연결
- `components/GameCard.tsx`: 공유 4개 버튼에 `trackResultShare` 연결
- `pages/result.tsx`: 공유 4개 버튼에 `trackResultShare` 연결, X 공유 텍스트를 실제 게임 제목으로 변경
- `components/GameCard.tsx`: X 공유 텍스트를 실제 게임 제목으로 변경

## 2026-04-16

### result.tsx UI 개선
- `pages/result.tsx`: `isMobile` 훅 추가 — 外部 패딩·테이블 패딩·폰트 모바일 축소, 이미지 열 50×75px로 축소 표시
- `pages/result.tsx`: 싫어요 버튼 카운트 숨김 (버튼은 유지)
- `pages/result.tsx`: 검색 중 랭킹 제목 동적 변경 — `「검색어」の検索結果 (N件)`
- `pages/result.tsx`: 댓글 fetch 시 pinned 3개 유지 + 나머지 무작위 셔플
- `pages/result.tsx`: alt 텍스트 `투표 결과` → `投票結果`, 섹션 제목 이모지(🔥💬) 제거
- `lib/commentTemplates.ts`: 토너먼트 결과 특화 표현 20개 추가

### 관리자 댓글 관리 개선
- `pages/api/admin/comments.ts`: `sortBy` 파라미터 추가(createdAt/dislikes), likes/dislikes 필드 응답에 포함
- `pages/admin/index.tsx`: Comment 인터페이스에 likes/dislikes 추가, 👎 많은 순 정렬 버튼, 👍👎 열 추가, dislikes≥5 행 배경 강조

## 2026-04-15

### SNS 공유 최적화
- `pages/play/[id].tsx`: `getServerSideProps` 매핑에 `thumbUrl` 누락 수정 → og:image 정상화
- `pages/play/[id].tsx`: `getServerSideProps`에서 thumbnails 앞 2장 중 랜덤 선택해 `ogThumbnail` props 전달
- `pages/result.tsx`: CSR → SSR 전환 (`getServerSideProps` 추가) — DB 1위 winner + thumbUrl 조회해 og:image SSR 세팅
- `pages/api/winner.ts`: `sort({playedAt:-1}).limit(1)` → aggregation 기준 1위 반환으로 수정

### GIF 썸네일 추출 개선
- `server/app.js`: FFmpeg 첫 프레임(`-vframes 1`) → 6번째 프레임(`-vf "select=eq(n\\,5)"`) 추출로 변경

### 게임 플레이 UX 개선
- `components/GameCard.tsx`: `window.open(_blank)` → `location.href` 같은 창으로 변경
- `pages/play/[id].tsx`: Header 추가 (스크롤 업 시 표시 / 기본 숨김) — 라운드 선택·게임 플레이 화면 공통 적용
- `pages/play/[id].tsx`: 라운드 선택 화면에 VS 배틀 연출 추가 — 대표 이미지 슬라이드인, VS 텍스트 펄스, 손가락 왕복 애니메이션, 모바일 대응

## 2026-04-13

### SEO 수정
- `play/[id].tsx`: `useState(true)` → `useState(false)` — SSR 블로킹 수정 (OG태그 및 body 빈 문제 해결)
- `sitemap.xml.tsx`: `/ranking` 항목 제거 (존재하지 않는 페이지)

### 문서 구조 개선
- `CLAUDE.md`: 하네스 구조로 재편 — 핵심 인덱스만 유지
- `docs/claude/` 신규 생성: deploy.md / db-schema.md / ssr-rules.md / security.md / history.md

### 관리자 페이지 전면 재작성
- `pages/admin/index.tsx`: 전체 리뉴얼
  - `prompt()` / `confirm()` → 커스텀 모달 + 댓글 인라인 편집
  - 언어 한국어 통일, 이모지/그라데이션 제거
  - 게임 탭 visibility(공개/비공개/비밀번호) 컬럼 추가
  - 회원 삭제·권한변경 버그 수정 (`_id` undefined → `userId` 사용)
- `pages/api/admin/comments.ts`: 게임명 서버 join 추가 (클라이언트 limit=10000 제거)
- `pages/api/admin/games.ts`: visibility 필드 projection 추가

## 2026-04-12 — SEO 및 코드 품질 개선
- `pages/index.tsx`: CSR → SSR (`getServerSideProps`), dateRange 필터 삭제, Bootstrap 반응형 필터
- `pages/play/[id].tsx`: OG태그 추가 (`og:image`, `twitter:card`, JSON-LD)
- `pages/sitemap.xml.tsx`: 신규 — DB에서 게임 URL 동적 생성
- `public/robots.txt`: 한국어 제거, `/api/` 차단, Crawl-delay 삭제
- `components/GameCard.tsx`: 클릭 영역 확장, SSR 호환 수정
- 이모지 제거: guide.tsx, about.tsx, result.tsx, admin/index.tsx
- `next.config.ts`: `ignoreBuildErrors`, `ignoreDuringBuilds` 추가 (EC2 OOM 방지)
