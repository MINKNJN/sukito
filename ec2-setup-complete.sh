#!/bin/bash

echo "🏗️ Sukito EC2 완전 초기 설정 가이드"
echo "=================================="

cat << 'EOF'

🚀 새로운 EC2 인스턴스에서 Sukito를 완전히 설정하는 과정

1️⃣ 시스템 업데이트 & 기본 패키지 설치
===================================

sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git htop unzip

2️⃣ Node.js 설치 (v18 LTS)
========================

# Node.js 18.x 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 버전 확인
node --version
npm --version

3️⃣ PM2 글로벌 설치
=================

sudo npm install -g pm2

# PM2 버전 확인
pm2 --version

4️⃣ Nginx 설치 & 설정
==================

# Nginx 설치
sudo apt install -y nginx

# 기본 사이트 비활성화
sudo rm /etc/nginx/sites-enabled/default

# Nginx 시작 및 부팅 시 자동 시작 설정
sudo systemctl start nginx
sudo systemctl enable nginx

5️⃣ FFmpeg 설치 (동영상 변환용)
=============================

sudo apt install -y ffmpeg

# FFmpeg 버전 확인
ffmpeg -version

6️⃣ SSL 인증서 도구 설치 (Certbot)
===============================

sudo apt install -y certbot python3-certbot-nginx

7️⃣ 프로젝트 클론 & 초기 설정
===========================

# 홈 디렉토리로 이동
cd /home/ubuntu

# 프로젝트 클론
git clone https://github.com/MINKNJN/sukito.git

# 프로젝트 디렉토리로 이동
cd sukito

# 메인 프로젝트 의존성 설치
npm ci

# Express 서버 의존성 설치
cd server
npm ci
cd ..

8️⃣ 환경 변수 설정
================

# .env.local 파일 생성 (중요!)
nano .env.local

# 다음 내용을 입력:
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=your_s3_bucket_name
CLOUDFRONT_DOMAIN=your_cloudfront_domain

9️⃣ 첫 빌드 실행
===============

# 메모리 제한으로 빌드
NODE_OPTIONS="--max-old-space-size=2048" npm run build

🔟 PM2 서비스 시작
=================

# PM2로 서비스 시작
pm2 start ecosystem.config.js

# PM2 상태 확인
pm2 status

# PM2 부팅 시 자동 시작 설정
pm2 startup
pm2 save

1️⃣1️⃣ Nginx 설정 적용
====================

# Nginx 설정 파일 복사
sudo cp nginx.conf /etc/nginx/sites-available/sukito

# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/sukito /etc/nginx/sites-enabled/

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx

1️⃣2️⃣ 도메인 연결 (DNS 설정)
===========================

# Gabia에서 DNS 설정:
# A 레코드: sukito.net → EC2 IP 주소
# A 레코드: www.sukito.net → EC2 IP 주소

1️⃣3️⃣ SSL 인증서 설치
====================

# Let's Encrypt SSL 인증서 발급
sudo certbot --nginx -d sukito.net -d www.sukito.net

# 자동 갱신 테스트
sudo certbot renew --dry-run

1️⃣4️⃣ 방화벽 설정
================

# UFW 방화벽 설정
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 방화벽 상태 확인
sudo ufw status

1️⃣5️⃣ 최종 테스트
================

# 로컬 서버 응답 확인
curl -I http://localhost:3000
curl -I http://localhost:3001/health

# 실제 사이트 확인
curl -I https://sukito.net

# PM2 모니터링
pm2 monit

🎉 설정 완료!
============

이제 다음이 모두 작동합니다:
✅ Next.js 프론트엔드 (포트 3000)
✅ Express API 서버 (포트 3001) 
✅ Nginx 리버스 프록시 (포트 80, 443)
✅ SSL/HTTPS 인증서
✅ 도메인 연결 (sukito.net)
✅ PM2 프로세스 관리
✅ 자동 재시작 설정

EOF

echo ""
echo "💡 위 과정을 순서대로 따라하면 완전한 Sukito EC2 환경이 구축됩니다!"
echo "⚠️  환경 변수(.env.local) 설정을 잊지 마세요!"
