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

# 메모리 정리 함수
cleanup_memory() {
    log "🧹 메모리 정리 중..."
    # Node.js 프로세스 정리 (PM2 제외)
    sudo pkill -f "node.*next" || true
    # 캐시 정리
    npm cache clean --force 2>/dev/null || true
    # 시스템 캐시 정리
    sudo sync && sudo sysctl vm.drop_caches=3 2>/dev/null || true
    sleep 2
}

# 프로젝트 디렉토리로 이동
cd "$PROJECT_DIR" || {
    log "❌ 프로젝트 디렉토리로 이동 실패: $PROJECT_DIR"
    exit 1
}

log "📁 현재 디렉토리: $(pwd)"

# 현재 PM2 프로세스 중지 (메모리 확보)
log "⏹️ PM2 프로세스 중지 중..."
pm2 stop all || true

# 메모리 정리
cleanup_memory

# Git 상태 확인
log "🔍 Git 상태 확인..."
git status

# Git에서 최신 코드 가져오기
log "📥 Git에서 최신 코드 가져오는 중..."
if git pull origin main; then
    log "✅ Git pull 완료"
else
    log "❌ Git pull 실패"
    exit 1
fi

# 이전 빌드 파일 삭제 (용량 확보)
log "🗑️ 이전 빌드 파일 삭제 중..."
rm -rf .next node_modules/.cache tmp/*.gif tmp/*.mp4 2>/dev/null || true

# 의존성 설치 (메모리 제한)
log "📦 의존성 설치 중..."
if NODE_OPTIONS="$NODE_OPTIONS" npm ci; then
    log "✅ npm ci 완료"
else
    log "❌ npm ci 실패"
    exit 1
fi

# 추가 메모리 정리
cleanup_memory

# Next.js 빌드 (메모리 제한 적용)
log "🔨 Next.js 빌드 중 (메모리 최적화)..."
if NODE_OPTIONS="$NODE_OPTIONS" npm run build; then
    log "✅ Next.js 빌드 완료"
    # 빌드 파일 확인
    if [ -d ".next/static" ]; then
        log "✅ 정적 파일 빌드 확인됨"
        ls -la .next/static/ | head -5
    else
        log "❌ 정적 파일 빌드 실패"
        exit 1
    fi
else
    log "❌ Next.js 빌드 실패"
    exit 1
fi

# Express 서버 의존성 설치
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

# Nginx 설정 복사 및 테스트
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

# PM2로 모든 프로세스 시작
log "🔄 PM2 프로세스 시작 중..."
if pm2 restart all; then
    log "✅ PM2 재시작 완료"
    # PM2 상태 확인
    pm2 status
else
    log "❌ PM2 재시작 실패"
    # PM2가 실패한 경우 개별 시작 시도
    log "🔄 PM2 개별 프로세스 시작 시도..."
    pm2 start ecosystem.config.js || {
        log "❌ PM2 시작 완전 실패"
        exit 1
    }
fi

# Nginx 재시작
log "🔄 Nginx 재시작 중..."
if sudo systemctl restart nginx; then
    log "✅ Nginx 재시작 완료"
else
    log "❌ Nginx 재시작 실패"
    exit 1
fi

# 배포 후 상태 확인
log "📊 서비스 상태 확인 중..."
echo "=== PM2 상태 ==="
pm2 status
echo "=== Nginx 상태 ==="
sudo systemctl status nginx --no-pager -l | head -10
echo "=== 포트 사용 현황 ==="
sudo ss -tlnp | grep -E ':(80|443|3000|3001)'

# 최종 확인
log "🌐 사이트 접근 테스트 중..."
sleep 5
if curl -s -o /dev/null -w "%{http_code}" https://sukito.net | grep -q "200"; then
    log "✅ 사이트 접근 성공"
else
    log "⚠️ 사이트 접근 확인 필요 - 브라우저에서 직접 확인하세요"
fi

log "🎉 EC2 배포 완료!"
log "🌐 사이트 확인: https://sukito.net"
log "📋 로그 확인: tail -f $LOG_FILE"
log "📊 PM2 모니터링: pm2 monit"