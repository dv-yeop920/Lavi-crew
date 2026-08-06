#!/bin/bash
# Notification 훅: Claude Code가 사용자 입력이나 권한 승인을 기다릴 때 macOS 데스크톱 알림을 띄운다.
osascript -e 'display notification "확인해주세요" with title "클로드 코드"' >/dev/null 2>&1
exit 0
