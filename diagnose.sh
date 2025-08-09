#!/bin/bash

echo "🔍 Sukito 502 오류 진단 도구"
echo "============================="

# 1. PM2 상태 확인
echo "1️⃣ PM2 프로세스 상태:"
pm2 status
echo ""

# 2. 포트 사용 확인
echo "2️⃣ 포트 사용 상황:"
sudo ss -tlnp | grep -E ':(3000|3001)'
echo ""

# 3. Next.js 서버 응답 확인
echo "3️⃣ Next.js 서버 응답 테스트:"
curl -I http://localhost:3000 2>/dev/null || echo "❌ Next.js 서버 응답 없음"
echo ""

# 4. Express 서버 응답 확인
echo "4️⃣ Express 서버 응답 테스트:"
curl -I http://localhost:3001/health 2>/dev/null || echo "❌ Express 서버 응답 없음"
echo ""

# 5. PM2 로그 확인
echo "5️⃣ PM2 최근 로그 (Next.js):"
pm2 logs sukito-nextjs --lines 10 --nostream 2>/dev/null || echo "❌ Next.js 로그 없음"
echo ""

echo "6️⃣ PM2 최근 로그 (Express):"
pm2 logs sukito-api --lines 10 --nostream 2>/dev/null || echo "❌ Express 로그 없음"
echo ""

# 7. Nginx 상태 확인
echo "7️⃣ Nginx 상태:"
sudo systemctl status nginx --no-pager -l | head -5
echo ""

# 8. Nginx 로그 확인
echo "8️⃣ Nginx 오류 로그:"
sudo tail -n 10 /var/log/nginx/error.log 2>/dev/null || echo "❌ Nginx 로그 없음"
echo ""

# 9. 빌드 파일 확인
echo "9️⃣ Next.js 빌드 파일 확인:"
if [ -d ".next/static" ]; then
    echo "✅ .next/static 디렉토리 존재"
    ls -la .next/static/ | head -3
else
    echo "❌ .next/static 디렉토리 없음"
fi
echo ""

# 10. 메모리 사용량 확인
echo "🔟 시스템 메모리 사용량:"
free -h
echo ""

echo "🎯 진단 완료!"
echo ""
echo "💡 문제 해결 팁:"
echo "   - PM2 프로세스가 없으면: pm2 start ecosystem.config.js"
echo "   - 포트가 사용 중이면: sudo lsof -ti:3000 | xargs sudo kill -9"
echo "   - 빌드 파일이 없으면: npm run build"
echo "   - 메모리 부족이면: NODE_OPTIONS=\"--max-old-space-size=2048\" npm run build"
