#!/usr/bin/env node

/**
 * PreToolUse 훅: Bash 도구로 실행하려는 명령이 되돌릴 수 없는 파괴적 명령이면
 * 실행 전에 차단한다(exit code 2 = PreToolUse 차단, stderr가 Claude에게 전달됨).
 *
 * 완전한 셸 파서가 아닌 휴리스틱이다. heredoc 안에 문자열로만 등장하는 경우처럼
 * 오탐이 있을 수 있고, 변수 치환·난독화로 우회하는 경우까지는 잡지 못한다.
 * 그래도 에이전트가 스스로 만들어 실행하는 실수를 막는 마지막 안전망 역할은 한다.
 */

import { readFileSync } from 'node:fs'

function readStdin() {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function splitSegments(command) {
  return command
    .split(/&&|\|\||;|\n|\|/g)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function tokenize(segment) {
  const matches = segment.match(/(?:"[^"]*"|'[^']*'|\S)+/g) ?? []
  return matches.map((token) => token.replace(/^['"]|['"]$/g, ''))
}

function isRmRecursiveForce(tokens) {
  const rmIndex = tokens.findIndex((token) => token === 'rm' || token.endsWith('/rm'))
  if (rmIndex === -1) return false

  let hasRecursive = false
  let hasForce = false
  for (const token of tokens.slice(rmIndex + 1)) {
    if (token === '--recursive') hasRecursive = true
    if (token === '--force') hasForce = true
    if (/^-[a-z]+$/i.test(token)) {
      if (/r/i.test(token)) hasRecursive = true
      if (/f/i.test(token)) hasForce = true
    }
  }
  return hasRecursive && hasForce
}

function isChmodRecursiveOnRoot(segment, tokens) {
  const hasChmod = tokens.includes('chmod')
  if (!hasChmod) return false
  const isRecursive = tokens.some(
    (token) => token === '-R' || token === '--recursive' || /^-[a-z]*R[a-z]*$/i.test(token),
  )
  if (!isRecursive) return false
  return /(^|\s)(\/|~|\$HOME)(\s|$)/.test(segment)
}

function gitDestructiveReason(tokens) {
  const gitIndex = tokens.indexOf('git')
  if (gitIndex === -1) return null
  const rest = tokens.slice(gitIndex + 1)
  const sub = rest[0]

  if (
    sub === 'push' &&
    rest.some((token) => token === '--force' || token === '-f' || token === '--force-with-lease')
  ) {
    return 'git push --force (원격 이력을 덮어씀)'
  }
  if (sub === 'reset' && rest.includes('--hard')) {
    return 'git reset --hard (커밋되지 않은 변경과 작업 트리를 되돌릴 수 없이 버림)'
  }
  if (
    sub === 'clean' &&
    rest.some((token) => token === '--force' || /^-[a-z]*f[a-z]*$/i.test(token))
  ) {
    return 'git clean -f (추적되지 않는 파일을 되돌릴 수 없이 삭제)'
  }
  if (sub === 'branch' && rest.includes('-D')) {
    return 'git branch -D (병합 여부와 무관하게 브랜치 강제 삭제)'
  }
  if ((sub === 'checkout' || sub === 'restore') && rest.includes('.')) {
    return `git ${sub} .(작업 트리 전체의 변경 사항을 되돌릴 수 없이 버림)`
  }

  return null
}

const GENERIC_DANGEROUS_PATTERNS = [
  {
    test: /\bdd\b[^&;|\n]*\bof=\/dev\//i,
    reason: '디스크 파티션에 직접 쓰는 dd 명령',
  },
  {
    test: /\bmkfs(\.\w+)?\b/i,
    reason: '파일시스템을 포맷하는 mkfs 명령',
  },
  {
    test: />\s*\/dev\/(sd|nvme|disk|hd)[a-z0-9]*/i,
    reason: '디스크 장치 파일에 직접 덮어쓰는 리다이렉션',
  },
  {
    test: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
    reason: '시스템 자원을 고갈시키는 포크 폭탄',
  },
]

function evaluateSegment(segment) {
  const tokens = tokenize(segment)

  if (isRmRecursiveForce(tokens)) {
    return '재귀 삭제(rm -rf/-fr 계열) 명령'
  }
  if (isChmodRecursiveOnRoot(segment, tokens)) {
    return '루트·홈 디렉터리 전체 권한을 재귀적으로 바꾸는 chmod -R 명령'
  }

  const gitReason = gitDestructiveReason(tokens)
  if (gitReason) {
    return gitReason
  }

  return null
}

// 포크 폭탄처럼 ';'나 '|'를 패턴 자체에 포함하는 경우 세그먼트 분리 전에 걸러야 하므로
// 원본 명령 전체를 대상으로 별도 검사한다.
function evaluateRawCommand(command) {
  for (const { test, reason } of GENERIC_DANGEROUS_PATTERNS) {
    if (test.test(command)) {
      return reason
    }
  }
  return null
}

const raw = readStdin()

let payload
try {
  payload = JSON.parse(raw)
} catch {
  process.exit(0)
}

if (payload.tool_name !== 'Bash') {
  process.exit(0)
}

const command = typeof payload.tool_input?.command === 'string' ? payload.tool_input.command : ''
if (!command.trim()) {
  process.exit(0)
}

const rawReason = evaluateRawCommand(command)
if (rawReason) {
  process.stderr.write(
    `[block-dangerous-bash] 실행을 차단했습니다: ${rawReason}.\n` +
      `차단된 명령: ${command}\n` +
      '이 명령은 자동으로 실행할 수 없습니다. 정말 필요하면 사용자에게 직접 실행해 달라고 요청하세요.\n',
  )
  process.exit(2)
}

for (const segment of splitSegments(command)) {
  const reason = evaluateSegment(segment)
  if (reason) {
    process.stderr.write(
      `[block-dangerous-bash] 실행을 차단했습니다: ${reason}.\n` +
        `차단된 부분 명령: ${segment}\n` +
        '이 명령은 자동으로 실행할 수 없습니다. 정말 필요하면 사용자에게 직접 실행해 달라고 요청하세요.\n',
    )
    process.exit(2)
  }
}

process.exit(0)
