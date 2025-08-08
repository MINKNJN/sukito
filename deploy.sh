#!/bin/bash

# EC2 배포 스크립트
echo "🚀 Sukito 배포 시작..."

# 프로젝트 디렉토리로 이동
cd /home/ubuntu/sukito

# Git에서 최신 코드 가져오기
echo "📥 Git에서 최신 코드 가져오기..."
git pull origin main

# 의존성 설치
echo "📦 의존성 설치..."
npm install

# Next.js 빌드
echo "🔨 Next.js 빌드..."
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# PM2 재시작
echo "🔄 PM2 재시작..."
pm2 restart all

# 상태 확인
echo "✅ 배포 완료!"
pm2 status

echo "🌐 웹사이트 확인: https://sukito.net" 