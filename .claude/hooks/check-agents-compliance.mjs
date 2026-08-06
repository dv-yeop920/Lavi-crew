#!/usr/bin/env node

/**
 * PostToolUse 훅: Edit/MultiEdit/Write로 파일을 바꾼 직후 AGENTS.md가 요구하는 센서
 * (check:architecture, check:harness, 파일 단위 eslint)를 그 자리에서 실행한다.
 * 위반이 남아 있으면 exit code 2로 차단해(PostToolUse 차단 규약) Claude가 세션 끝까지
 * 기다리지 않고 그 위반을 바로 고치게 만든다.
 *
 * 급여 9시간/1.5배 같은 정적 분석으로 판별할 수 없는 업무 규칙(AGENTS.md 9절)이나
 * "관련 npm test 실행" 같은 판단이 필요한 항목은 다루지 않는다 - 그런 항목은 여전히
 * npm test·qa-qc-tester 서브에이전트가 검증한다.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])

function readStdin() {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function toProjectPath(path) {
  return relative(repositoryRoot, path).split(sep).join('/')
}

function runCheck(label, command, args) {
  try {
    execFileSync(command, args, { cwd: repositoryRoot, encoding: 'utf8', stdio: 'pipe' })
    return null
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join('\n').trim()
    return `--- ${label} ---\n${output || error.message}`
  }
}

const raw = readStdin()

let payload
try {
  payload = JSON.parse(raw)
} catch {
  process.exit(0)
}

if (!['Edit', 'MultiEdit', 'Write'].includes(payload.tool_name)) {
  process.exit(0)
}

const filePath =
  typeof payload.tool_input?.file_path === 'string' ? payload.tool_input.file_path : ''
if (!filePath) {
  process.exit(0)
}

const absolutePath = resolve(filePath)
if (!absolutePath.startsWith(repositoryRoot + sep)) {
  process.exit(0)
}

const projectPath = toProjectPath(absolutePath)
const extensionIndex = projectPath.lastIndexOf('.')
const extension = extensionIndex === -1 ? '' : projectPath.slice(extensionIndex)

const isArchitectureScoped = /^(app|features|shared)\//.test(projectPath)
const isHarnessScoped =
  /^(app|features|shared|docs|scripts|\.claude)\//.test(projectPath) ||
  projectPath === 'AGENTS.md' ||
  projectPath === 'CLAUDE.md'
const isLintable = isArchitectureScoped && sourceExtensions.has(extension)

const failures = []

if (isArchitectureScoped) {
  const failure = runCheck('check:architecture (AGENTS.md 5절 VAC 경계)', 'node', [
    'scripts/check-architecture.mjs',
  ])
  if (failure) failures.push(failure)
}

if (isHarnessScoped) {
  const failure = runCheck('check:harness (AGENTS.md 13절 하네스 드리프트)', 'node', [
    'scripts/check-harness.mjs',
  ])
  if (failure) failures.push(failure)
}

if (isLintable) {
  const failure = runCheck(`eslint ${projectPath} (AGENTS.md 7절 TS·React 규칙)`, 'npx', [
    'eslint',
    projectPath,
  ])
  if (failure) failures.push(failure)
}

if (failures.length > 0) {
  process.stderr.write(
    `[check-agents-compliance] ${projectPath} 수정 이후 AGENTS.md 검증에 실패했습니다. ` +
      `계속 진행하기 전에 아래 위반을 고치세요.\n\n${failures.join('\n\n')}\n`,
  )
  process.exit(2)
}

process.exit(0)
