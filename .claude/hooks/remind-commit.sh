#!/bin/bash
# UserPromptSubmit hook: 미커밋 변경사항이 있으면 커밋 제안

cd "$CLAUDE_PROJECT_DIR" || exit 0

changed=$(git diff --name-only HEAD 2>/dev/null | head -5)
untracked=$(git ls-files --others --exclude-standard 2>/dev/null | head -5)

if [ -z "$changed" ] && [ -z "$untracked" ]; then
  exit 0
fi

count_changed=$(git diff --name-only HEAD 2>/dev/null | wc -l | tr -d ' ')
count_untracked=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')
total=$((count_changed + count_untracked))

echo "[커밋 알림] 커밋되지 않은 변경이 ${total}개 파일에 있습니다. 새 작업 전에 이전 작업을 커밋할지 사용자에게 물어보세요."
