#!/bin/bash

echo "🚀 Sukito EC2 완전 제어 가이드"
echo "================================="

cat << 'EOF'

💻 1. 시스템 서비스 제어
====================

📊 시스템 상태 확인:
  free -h                    # 메모리 사용량
  df -h                      # 디스크 사용량
  htop                       # 실시간 프로세스 모니터링
  sudo systemctl status nginx
  sudo systemctl status ssh

🔄 시스템 재시작:
  sudo reboot                # 전체 시스템 재시작
  sudo systemctl restart nginx
  sudo systemctl restart ssh

🚀 2. Node.js & PM2 제어
====================

📋 PM2 상태 관리:
  pm2 status                 # 현재 실행 중인 프로세스 확인
  pm2 list                   # 전체 프로세스 목록
  pm2 monit                  # 실시간 모니터링 (GUI)

🔄 PM2 프로세스 제어:
  pm2 start ecosystem.config.js    # 전체 서비스 시작
  pm2 restart all                  # 전체 서비스 재시작
  pm2 stop all                     # 전체 서비스 중지
  pm2 delete all                   # 전체 프로세스 삭제

🎯 개별 프로세스 제어:
  pm2 start sukito-nextjs          # Next.js만 시작
  pm2 restart sukito-nextjs        # Next.js만 재시작
  pm2 stop sukito-nextjs           # Next.js만 중지
  pm2 start sukito-api             # Express API만 시작
  pm2 restart sukito-api           # Express API만 재시작
  pm2 stop sukito-api              # Express API만 중지

📊 PM2 로그 확인:
  pm2 logs                         # 전체 로그 실시간
  pm2 logs sukito-nextjs           # Next.js 로그만
  pm2 logs sukito-api              # Express API 로그만
  pm2 logs --lines 50              # 최근 50줄
  pm2 flush                        # 로그 파일 초기화

💾 PM2 자동 시작 설정:
  pm2 startup                      # 부팅 시 자동 시작 설정
  pm2 save                         # 현재 상태 저장

🌐 3. Nginx 웹서버 제어
====================

🔧 Nginx 서비스 제어:
  sudo systemctl start nginx       # Nginx 시작
  sudo systemctl stop nginx        # Nginx 중지
  sudo systemctl restart nginx     # Nginx 재시작
  sudo systemctl reload nginx      # 설정만 다시 로드
  sudo systemctl status nginx      # Nginx 상태 확인

📝 Nginx 설정 관리:
  sudo nginx -t                    # 설정 파일 검증
  sudo nginx -s reload             # 설정 다시 로드 (서비스 중단 없음)
  
📁 Nginx 설정 파일 위치:
  /etc/nginx/sites-available/sukito    # 설정 파일
  /etc/nginx/sites-enabled/sukito      # 활성화된 설정 (심볼릭 링크)
  
📋 Nginx 로그 확인:
  sudo tail -f /var/log/nginx/access.log     # 접근 로그 실시간
  sudo tail -f /var/log/nginx/error.log      # 오류 로그 실시간
  sudo tail -n 100 /var/log/nginx/error.log  # 최근 100줄 오류 로그

🔒 4. SSL 인증서 관리
===================

📜 SSL 인증서 상태 확인:
  sudo certbot certificates               # 설치된 인증서 목록
  sudo certbot renew --dry-run           # 갱신 테스트
  
🔄 SSL 인증서 갱신:
  sudo certbot renew                     # 수동 갱신
  sudo systemctl status certbot.timer    # 자동 갱신 타이머 상태

🌐 5. 네트워크 & 포트 관리
=======================

🔌 포트 사용 상태 확인:
  sudo ss -tlnp                          # 전체 리스닝 포트
  sudo ss -tlnp | grep :80               # 80번 포트 사용 상황
  sudo ss -tlnp | grep :443              # 443번 포트 사용 상황
  sudo ss -tlnp | grep :3000             # 3000번 포트 (Next.js)
  sudo ss -tlnp | grep :3001             # 3001번 포트 (Express)
  
🛡️ 방화벽 설정:
  sudo ufw status                        # 방화벽 상태
  sudo ufw enable                        # 방화벽 활성화
  sudo ufw allow 80/tcp                  # HTTP 포트 허용
  sudo ufw allow 443/tcp                 # HTTPS 포트 허용
  sudo ufw allow ssh                     # SSH 포트 허용

💾 6. 코드 & 데이터 관리
=====================

📥 Git 코드 관리:
  cd /home/ubuntu/sukito
  git status                             # 현재 Git 상태
  git stash                              # 로컬 변경사항 임시 저장
  git pull origin main                   # 최신 코드 가져오기
  git reset --hard origin/main          # 강제로 원격 버전으로 리셋

📦 Node.js 의존성 관리:
  npm ci                                 # 클린 설치 (package-lock.json 기준)
  npm install                            # 일반 설치
  npm cache clean --force                # npm 캐시 정리
  
🗑️ 임시 파일 정리:
  rm -rf .next                           # Next.js 빌드 파일 삭제
  rm -rf node_modules/.cache             # 노드 캐시 삭제
  rm -rf tmp/*.gif tmp/*.mp4             # 임시 미디어 파일 삭제

🔨 7. 빌드 & 배포
===============

🔨 Next.js 빌드:
  NODE_OPTIONS="--max-old-space-size=2048" npm run build
  
📊 빌드 결과 확인:
  ls -la .next/static/                   # 정적 파일 확인
  du -sh .next/                          # 빌드 크기 확인

🚀 8. 헬스 체크 & 테스트
======================

🏥 서버 응답 테스트:
  curl -I http://localhost:3000          # Next.js 서버 테스트
  curl -I http://localhost:3001/health   # Express 서버 테스트
  curl -I https://sukito.net             # 실제 사이트 테스트
  
📊 성능 테스트:
  curl -w "@curl-format.txt" -o /dev/null -s https://sukito.net

🆘 9. 문제 해결 & 응급 복구
=========================

🚨 전체 서비스 재시작:
  sudo pkill -f node                     # 모든 Node.js 프로세스 강제 종료
  pm2 delete all                         # PM2 프로세스 모두 삭제
  pm2 start ecosystem.config.js          # 서비스 재시작
  sudo systemctl restart nginx           # Nginx 재시작

🔄 응급 롤백:
  git log --oneline -5                   # 최근 커밋 확인
  git reset --hard HEAD~1                # 이전 커밋으로 롤백
  
💾 완전 초기화:
  cd /home/ubuntu
  rm -rf sukito
  git clone https://github.com/MINKNJN/sukito.git
  cd sukito
  ./deploy.sh

📋 10. 종합 상태 체크 스크립트
===========================

다음 스크립트들 실행:
  ./diagnose.sh                          # 문제 진단
  ./monitor.sh                           # 종합 모니터링
  ./deploy.sh                            # 전체 배포

EOF

echo ""
echo "💡 이 가이드를 참고하여 EC2 Sukito 서비스를 완전히 제어하세요!"
echo "⚠️  중요: 각 명령어는 상황에 맞게 신중히 사용하세요!"
