# 보안 규칙

## 관리자 API

모든 `/api/admin/*` 라우트는 반드시 `requireAdmin()` 호출 필수.

```ts
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req, res) {
  const authResult = await requireAdmin(req, res);
  if (!authResult) return; // 401/403 자동 응답됨
  // 이후 로직
}
```

## JWT

- 유효기간: 7일
- 환경변수: `process.env.JWT_SECRET`
- 관련 파일: `pages/api/jwt.ts`

## 파일 업로드

- 최대 20MB (MP4는 10MB)
- 허용 형식: JPG/PNG/GIF/MP4
- **GIF** → Express(3001) `/convert`에서 FFmpeg으로 MP4+썸네일 변환 후 S3 업로드
- **MP4 (level ≤ 41)** → S3 직접 업로드 + Next.js(3000)에서 로컬 ffmpeg으로 썸네일 추출
- **MP4 (level > 41)** → Express(3001) `/reencode-upload`에서 재인코딩 후 S3 업로드
- Express(3001) FFmpeg 큐: 동시 1개, 대기 최대 2개, 초과 시 503 반환
- S3 파일은 **반드시 CloudFront URL**로 참조 (`d2ojyvx5ines08.cloudfront.net`)
  - S3 직접 URL 노출 금지

## 절대 금지

- `.env*` 파일 커밋 금지
- S3 버킷명/키 하드코딩 금지
- 관리자 체크 없이 데이터 삭제/수정 API 작성 금지

## 에러 응답

에러 메시지는 일본어로 작성.

```ts
res.status(400).json({ error: 'タイトルを入力してください。' });
res.status(401).json({ error: 'ログインが必要です。' });
res.status(403).json({ error: 'アクセス権限がありません。' });
res.status(404).json({ error: '存在しないデータです。' });
```
