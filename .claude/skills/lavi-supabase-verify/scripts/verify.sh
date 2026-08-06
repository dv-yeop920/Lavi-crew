#!/usr/bin/env bash
set -euo pipefail

run_e2e=false
for arg in "$@"; do
  case "$arg" in
    --e2e)
      run_e2e=true
      ;;
    *)
      echo "알 수 없는 옵션: $arg" >&2
      echo "사용법: $0 [--e2e]" >&2
      exit 1
      ;;
  esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$repo_root"

fail() {
  echo "실행 불가: $1" >&2
  exit 1
}

command -v docker >/dev/null 2>&1 || fail "Docker 호환 런타임이 없습니다."
command -v psql >/dev/null 2>&1 || fail "psql이 없습니다."

node_major="$(node -v | sed 's/^v//' | cut -d. -f1)"
if [ "$node_major" -lt 22 ]; then
  fail "Node.js 22 이상이 필요합니다 (현재: $(node -v))."
fi

if [ "$run_e2e" = true ]; then
  echo "== playwright install chromium (이미 설치돼 있으면 빠르게 건너뜀) =="
  npx playwright install chromium
fi

echo "== db:start =="
npm run db:start

echo "== db:reset =="
npm run db:reset

if [ "$run_e2e" = true ]; then
  echo "== test:e2e =="
  npm run test:e2e
  echo "파이프라인 완료: test:e2e"
else
  echo "== test:db =="
  npm run test:db
  echo "파이프라인 완료: test:db"
fi
