#!/bin/bash

# 여행 종료 2일 후 비밀번호 자동 변경 스크립트
# 매일 자동으로 실행되도록 crontab에 등록할 수 있습니다.
# 
# crontab 예시 (매일 오전 2시 실행):
# 0 2 * * * /path/to/cruise-guide/scripts/run-cron-expire-trips.sh
#
# .env 파일에 CRON_SECRET 값을 설정해야 합니다.

# 현재 스크립트 디렉토리
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# .env 파일 로드
if [ -f "$PROJECT_DIR/.env" ]; then
  source "$PROJECT_DIR/.env"
elif [ -f "$PROJECT_DIR/.env.local" ]; then
  source "$PROJECT_DIR/.env.local"
fi

# CRON_SECRET이 설정되지 않은 경우 기본값 사용 (보안상 권장하지 않음)
CRON_SECRET="${CRON_SECRET:-your-secret-key-here}"

# Next.js 서버 URL (배포 환경에 맞게 수정)
NEXT_URL="${NEXT_PUBLIC_URL:-http://localhost:3030}"

# API 호출
echo "$(date): 여행 종료 비밀번호 변경 작업 시작..."

RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  "$NEXT_URL/api/cron/expire-trips")

echo "Response: $RESPONSE"
echo "$(date): 작업 완료"

