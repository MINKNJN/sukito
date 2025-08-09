#!/bin/bash

echo "📊 Sukito EC2 모니터링"
echo "======================="

# 시스템 정보
echo "💻 시스템 메모리 사용률:"
free -h

echo ""
echo "💾 디스크 사용률:"
df -h / /tmp

echo ""
echo "🔄 PM2 프로세스 상태:"
pm2 status

echo ""
echo "🌐 Nginx 상태:"
sudo systemctl status nginx --no-pager -l | head -10

echo ""
echo "🔌 포트 사용 현황:"
sudo ss -tlnp | grep -E ':(80|443|3000|3001)'

echo ""
echo "📈 최근 로그 (Nginx 에러):"
sudo tail -n 10 /var/log/nginx/error.log

echo ""
echo "🌐 사이트 접근 테스트:"
curl -I https://sukito.net 2>/dev/null | head -3

echo ""
echo "📊 모니터링 완료!"
echo "실시간 모니터링: pm2 monit"
