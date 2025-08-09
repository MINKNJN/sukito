#!/bin/bash

echo "📋 Sukito 수동 배포 가이드"
echo "=========================="

cat << 'EOF'

🚀 완벽한 수동 배포 과정

1️⃣ 로컬에서 작업 완료 후:
   git add .
   git commit -m "배포 메시지"
   git push origin main

2️⃣ EC2 접속:
   ssh -i "your-key.pem" ubuntu@13.231.218.132

3️⃣ 기존 프로세스 완전 정리:
   cd /home/ubuntu/sukito
   pm2 stop all
   pm2 delete all
   sudo pkill -f node
   sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
   sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true

4️⃣ 최신 코드 가져오기:
   git pull origin main

5️⃣ 의존성 설치:
   npm ci
   cd server && npm ci && cd ..

6️⃣ 빌드:
   rm -rf .next
   NODE_OPTIONS="--max-old-space-size=2048" npm run build
   ls -la .next/static/

7️⃣ 서비스 시작:
   pm2 start ecosystem.config.js
   pm2 status

8️⃣ 서버 응답 확인:
   curl -I http://localhost:3000
   curl -I http://localhost:3001/health

9️⃣ Nginx 설정 적용:
   sudo cp nginx.conf /etc/nginx/sites-available/sukito
   sudo nginx -t
   sudo systemctl restart nginx

🔟 최종 확인:
   curl -I https://sukito.net
   pm2 monit

EOF

echo ""
echo "💡 위 과정을 하나씩 따라하세요!"
echo "⚠️  각 단계에서 오류가 발생하면 다음 단계로 넘어가지 마세요!"
