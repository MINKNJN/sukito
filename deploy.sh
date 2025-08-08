#!/bin/bash

echo "🚀 Sukito 배포 시작..."

# 현재 디렉토리 확인
echo "📁 현재 디렉토리: $(pwd)"

# Git 상태 확인
echo "🔍 Git 상태 확인..."
git status

# 최신 코드 가져오기
echo "📥 최신 코드 가져오기..."
git pull origin main

# 의존성 설치
echo "📦 의존성 설치..."
npm ci

# 이전 빌드 파일 삭제
echo "🗑️ 이전 빌드 파일 삭제..."
rm -rf .next

# Next.js 빌드
echo "🔨 Next.js 빌드..."
npm run build

# 빌드 결과 확인
if [ $? -eq 0 ]; then
    echo "✅ 빌드 성공!"
else
    echo "❌ 빌드 실패!"
    exit 1
fi

# PM2 재시작
echo "🔄 PM2 재시작..."
pm2 restart sukito-nextjs

# PM2 상태 확인
echo "📊 PM2 상태 확인..."
pm2 status

# Nginx 설정 테스트
echo "🔧 Nginx 설정 테스트..."
sudo nginx -t

# Nginx 재시작
echo "🔄 Nginx 재시작..."
sudo systemctl restart nginx

# 서비스 상태 확인
echo "📊 서비스 상태 확인..."
sudo systemctl status nginx --no-pager -l

echo "🎉 배포 완료!"
echo "🌐 https://sukito.net 에서 확인하세요!" 