#!/usr/bin/env bash
set -euo pipefail

# 1) 기존 next/node 잔여 프로세스 정리(있어도 없어도 조용히)
pkill -f "next dev"       >/dev/null 2>&1 || true
pkill -f "next-server"    >/dev/null 2>&1 || true
pkill -f "node .*next"    >/dev/null 2>&1 || true

# 2) 기준 포트 (원하면 .env.local 에 BASE_PORT=3000 둘 수 있음)
BASE_PORT="${BASE_PORT:-3000}"
P="$BASE_PORT"

# 3) 사용 중이 아닌 포트 찾기
is_in_use () {
  # ss 가 포트 열려있으면 한 줄 이상을 출력 -> 사용 중 판단
  ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":$1\$"
}

while is_in_use "$P"; do
  P=$((P+1))
done

export PORT="$P"

echo "────────────────────────────────────────────"
echo "  ✅ Free port found: $PORT"
echo "  ▶️  Starting Next.js on http://localhost:$PORT"
echo "────────────────────────────────────────────"

# 4) 실제 실행
exec npm exec next dev . --hostname 0.0.0.0 -p "$PORT"






