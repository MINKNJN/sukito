#!/bin/bash

echo "🚀 Sukito EC2 배포 시작..."

# 변수 설정
PROJECT_DIR="/home/ubuntu/sukito"
LOG_FILE="$PROJECT_DIR/deploy.log"

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 프로젝트 디렉토리로 이동
cd "$PROJECT_DIR" || {
    log "❌ 프로젝트 디렉토리로 이동 실패: $PROJECT_DIR"
    exit 1
}

log "📁 현재 디렉토리: $(pwd)"

# 1단계: Git에서 최신 코드 가져오기
log "📥 Git에서 최신 코드 가져오는 중..."
git fetch origin
git reset --hard origin/main
log "✅ Git 업데이트 완료"

# 2단계: 이전 빌드 파일 정리
log "🗑️ 이전 빌드 파일 삭제 중..."
rm -rf .next
log "✅ 빌드 파일 정리 완료"

# 3단계: Next.js 빌드 (메모리 최적화)
log "🔨 Next.js 빌드 중..."
if NODE_OPTIONS="--max-old-space-size=4096" npm run build; then
    log "✅ Next.js 빌드 완료"
else
    log "❌ Next.js 빌드 실패"
    exit 1
fi

# 4단계: PM2 프로세스 재시작
log "🔄 PM2 프로세스 재시작 중..."
if pm2 restart ecosystem.config.js; then
    log "✅ PM2 재시작 완료"
else
    log "❌ PM2 재시작 실패"
    exit 1
fi

# 5단계: Nginx 설정 적용
log "🔧 Nginx 설정 적용 중..."
if sudo cp nginx.conf /etc/nginx/sites-available/sukito.net; then
    log "✅ Nginx 설정 파일 복사 완료"
else
    log "❌ Nginx 설정 파일 복사 실패"
    exit 1
fi

# 심볼릭 링크 생성
if sudo ln -sf /etc/nginx/sites-available/sukito.net /etc/nginx/sites-enabled/; then
    log "✅ Nginx 심볼릭 링크 생성 완료"
else
    log "❌ Nginx 심볼릭 링크 생성 실패"
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

# 6단계: 서비스 상태 확인
log "📊 서비스 상태 확인..."
echo "=== PM2 상태 ==="
pm2 status
echo ""
echo "=== 포트 사용 현황 ==="
sudo ss -tlnp | grep -E ':(80|443|3000|3001)'
echo ""

log "🎉 EC2 배포 완료!"
log "🌐 사이트 확인: https://sukito.net"
log "📋 로그 확인: tail -f $LOG_FILE"
log "📊 PM2 모니터링: pm2 monit"