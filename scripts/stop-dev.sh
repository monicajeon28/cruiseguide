#!/usr/bin/env bash
set -euo pipefail

echo "Killing any leftover Next/Node dev servers…"
pkill -f "next dev"       >/dev/null 2>&1 || true
pkill -f "next-server"    >/dev/null 2>&1 || true
pkill -f "node .*next"    >/dev/null 2>&1 || true

# 3000~3099 포트 강제 해제(권한 필요할 수 있음. 없으면 조용히 스킵)
for p in $(seq 3000 3099); do
  fuser -k "${p}/tcp" >/dev/null 2>&1 || true
done

echo "✅ All clear."










