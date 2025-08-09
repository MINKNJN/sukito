#!/bin/bash

echo "⚡ Sukito 빠른 배포 (코드 변경만)"

# 프로젝트 디렉토리로 이동
cd /home/ubuntu/sukito

# Git 최신 코드 가져오기
echo "📥 최신 코드 가져오기..."
git pull origin main

# PM2 재시작 (빌드 스킵)
echo "🔄 PM2 재시작..."
pm2 restart all

# Nginx 재시작
echo "🔄 Nginx 재시작..."
sudo systemctl restart nginx

echo "✅ 빠른 배포 완료!"
pm2 status
