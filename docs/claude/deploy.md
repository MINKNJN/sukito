# 배포 가이드

## EC2 배포 절차

```bash
git pull origin main
npm install
npm run build
pm2 restart ecosystem.config.js
```

## PM2 프로세스

| 프로세스명 | 포트 | 역할 |
|---|---|---|
| `sukito-nextjs` | 3000 | Next.js |
| `sukito-api` | 3001 | Express (FFmpeg) |

```bash
pm2 list              # 프로세스 상태 확인
pm2 logs              # 실시간 로그
pm2 restart sukito-nextjs
pm2 start ecosystem.config.js
```

## 주의사항

- **EC2 메모리 부족**: TypeScript/ESLint 빌드 체크 스킵 설정이 `next.config.ts`에 있음 (변경 금지)
- **Elastic IP**: `54.65.187.115` — 인스턴스 재시작 후에도 고정
- **빌드 실패 시**: `.next` 디렉토리 삭제 후 재빌드
  ```bash
  rm -rf .next && npm run build
  ```
- **OOM으로 빌드 중단 시**: Swap이 2GB로 설정되어 있으나, 빌드가 계속 실패하면 메모리 사용 프로세스 확인
  ```bash
  free -h
  pm2 stop all  # 빌드 전에 PM2 중지
  ```

## Nginx

설정 파일 위치: `/etc/nginx/sites-available/sukito`

```bash
sudo nginx -t            # 설정 검증
sudo systemctl reload nginx
```

## 아키텍처

```
사용자 → Nginx (443/HTTPS) → Next.js (3000) → MongoDB
                           → Express (3001)  → FFmpeg → S3 → CloudFront
```
