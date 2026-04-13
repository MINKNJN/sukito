# 변경 이력

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
