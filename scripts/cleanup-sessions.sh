#!/bin/bash
# scripts/cleanup-sessions.sh
# 만료된 세션을 정리하는 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "========================================="
echo "  Session Cleanup Script"
echo "  Started at: $(date)"
echo "========================================="

# TypeScript 스크립트 실행
npx tsx scripts/cleanup-sessions.ts

EXIT_CODE=$?

echo "========================================="
echo "  Cleanup finished at: $(date)"
echo "  Exit code: $EXIT_CODE"
echo "========================================="

exit $EXIT_CODE

