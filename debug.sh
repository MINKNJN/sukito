#!/bin/bash

echo "🔍 Sukito 디버깅 시작..."

# 현재 디렉토리 확인
echo "📁 현재 디렉토리: $(pwd)"

# Next.js 빌드 파일 확인
echo "📦 Next.js 빌드 파일 확인..."
if [ -d ".next/static" ]; then
    echo "✅ .next/static 디렉토리 존재"
    ls -la .next/static/
else
    echo "❌ .next/static 디렉토리 없음"
fi

# PM2 상태 확인
echo "📊 PM2 상태 확인..."
pm2 status

# Nginx 상태 확인
echo "🔧 Nginx 상태 확인..."
sudo systemctl status nginx --no-pager -l

# Nginx 설정 테스트
echo "🔧 Nginx 설정 테스트..."
sudo nginx -t

# 포트 사용 상태 확인
echo "🔌 포트 사용 상태 확인..."
sudo ss -tlnp | grep :80
sudo ss -tlnp | grep :443
sudo ss -tlnp | grep :3000
sudo ss -tlnp | grep :3001

# 정적 파일 접근 테스트
echo "🌐 정적 파일 접근 테스트..."
curl -I https://sukito.net/_next/static/css/app.css 2>/dev/null || echo "❌ 정적 파일 접근 실패"

# 로그 확인
echo "📋 최근 로그 확인..."
sudo tail -n 20 /var/log/nginx/error.log
sudo tail -n 20 /var/log/nginx/access.log

echo "🔍 디버깅 완료!"

