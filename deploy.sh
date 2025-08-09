#!/bin/bash

echo "🚀 Sukito EC2 배포 시작..."

# 변수 설정
PROJECT_DIR="/home/ubuntu/sukito"
LOG_FILE="$PROJECT_DIR/deploy.log"
NODE_OPTIONS="--max-old-space-size=2048"

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 실패 시 롤백 함수
rollback() {
    log "❌ 배포 실패! 롤백 시도..."
    pm2 restart all || pm2 start ecosystem.config.js
    exit 1
}

# 오류 발생 시 롤백 실행
trap rollback ERR

# 프로젝트 디렉토리로 이동
cd "$PROJECT_DIR" || {
    log "❌ 프로젝트 디렉토리로 이동 실패: $PROJECT_DIR"
    exit 1
}

log "📁 현재 디렉토리: $(pwd)"

# 1단계: 기존 프로세스 완전 정리
log "⏹️ 기존 프로세스 완전 정리 중..."
pm2 stop all || true
pm2 delete all || true
sudo pkill -f node || true
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true
sleep 3

# 2단계: Git 최신 코드 가져오기
log "📥 Git에서 최신 코드 가져오는 중..."
git status
if git pull origin main; then
    log "✅ Git pull 완료"
else
    log "❌ Git pull 실패"
    exit 1
fi

# 3단계: 이전 빌드 파일 정리
log "🗑️ 이전 빌드 파일 삭제 중..."
rm -rf .next node_modules/.cache tmp/*.gif tmp/*.mp4 2>/dev/null || true

# 4단계: 메인 프로젝트 의존성 설치
log "📦 메인 프로젝트 의존성 설치 중..."
if NODE_OPTIONS="$NODE_OPTIONS" npm ci; then
    log "✅ 메인 npm ci 완료"
else
    log "❌ 메인 npm ci 실패"
    exit 1
fi

# 5단계: Express 서버 의존성 설치
log "📦 Express 서버 의존성 설치 중..."
cd "$PROJECT_DIR/server" || {
    log "❌ server 디렉토리로 이동 실패"
    exit 1
}

if npm ci; then
    log "✅ Express 서버 의존성 설치 완료"
else
    log "❌ Express 서버 의존성 설치 실패"
    exit 1
fi

# 프로젝트 루트로 돌아가기
cd "$PROJECT_DIR"

# 6단계: Next.js 빌드
log "🔨 Next.js 빌드 중 (메모리 최적화)..."
if NODE_OPTIONS="$NODE_OPTIONS" npm run build; then
    log "✅ Next.js 빌드 완료"
    # 빌드 파일 확인
    if [ -d ".next/static" ]; then
        log "✅ 정적 파일 빌드 확인됨"
        ls -la .next/static/ | head -3
    else
        log "❌ 정적 파일 빌드 실패"
        exit 1
    fi
else
    log "❌ Next.js 빌드 실패"
    exit 1
fi

# 7단계: PM2 프로세스 시작
log "🔄 PM2 프로세스 시작 중..."
if pm2 start ecosystem.config.js; then
    log "✅ PM2 시작 완료"
else
    log "❌ PM2 시작 실패"
    exit 1
fi

# 8단계: 서버 응답 확인
log "🔍 서버 응답 확인 중..."
sleep 10

# Next.js 서버 확인
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    log "✅ Next.js 서버(3000) 정상 응답"
else
    log "❌ Next.js 서버(3000) 응답 실패"
    pm2 logs sukito-nextjs --lines 10
    exit 1
fi

# Express 서버 확인
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health | grep -q "200"; then
    log "✅ Express 서버(3001) 정상 응답"
else
    log "❌ Express 서버(3001) 응답 실패"
    pm2 logs sukito-api --lines 10
    exit 1
fi

# 9단계: Nginx 설정 업데이트
log "🔧 Nginx 설정 업데이트 중..."
if sudo cp nginx.conf /etc/nginx/sites-available/sukito; then
    log "✅ Nginx 설정 파일 복사 완료"
else
    log "❌ Nginx 설정 파일 복사 실패"
    exit 1
fi

# Nginx 설정 테스트
log "🔧 Nginx 설정 테스트 중..."
if sudo nginx -t; then
    log "✅ Nginx 설정 테스트 통과"
else
    log "❌ Nginx 설정 오류"
    exit 1
fi

# Nginx 재시작
log "🔄 Nginx 재시작 중..."
if sudo systemctl restart nginx; then
    log "✅ Nginx 재시작 완료"
else
    log "❌ Nginx 재시작 실패"
    exit 1
fi

# 10단계: 최종 상태 확인
log "📊 최종 서비스 상태 확인..."
echo "=== PM2 상태 ==="
pm2 status
echo ""
echo "=== 포트 사용 현황 ==="
sudo ss -tlnp | grep -E ':(80|443|3000|3001)'
echo ""

# 11단계: HTTPS 사이트 접근 테스트
log "🌐 HTTPS 사이트 접근 테스트 중..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://sukito.net)
if [ "$HTTP_CODE" = "200" ]; then
    log "✅ HTTPS 사이트 접근 성공 (HTTP $HTTP_CODE)"
else
    log "⚠️ HTTPS 사이트 접근 실패 (HTTP $HTTP_CODE)"
    log "💡 브라우저에서 직접 확인하세요: https://sukito.net"
fi

log "🎉 EC2 배포 완료!"
log "🌐 사이트 확인: https://sukito.net"
log "📋 로그 확인: tail -f $LOG_FILE"
log "📊 PM2 모니터링: pm2 monit"

# 성공 시 trap 해제
trap - ERR