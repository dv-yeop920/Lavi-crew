import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

try {
  JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

let status = ''
let repositoryRoot = ''

try {
  repositoryRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
  status = execFileSync('git', ['status', '--short'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
} catch {
  process.exit(0)
}

const codePath = /^(app|features|shared|supabase)\//
const configPath = /^(package(?:-lock)?\.json|next\.config\.|tsconfig\.json|eslint\.config\.)/
const harnessPath =
  /^(AGENTS\.md|Design\.md|docs\/|scripts\/|\.agents\/|\.codex\/|\.github\/workflows\/)/
const changedPaths = status
  .split('\n')
  .filter(Boolean)
  .map((line) => line.slice(3))
const hasCodeChanges = changedPaths.some((path) => codePath.test(path) || configPath.test(path))
const hasHarnessChanges = changedPaths.some((path) => harnessPath.test(path))

if (!hasCodeChanges && !hasHarnessChanges) {
  process.exit(0)
}

const failedChecks = []

function runFastCheck(scriptName) {
  const result = spawnSync(process.execPath, [join(repositoryRoot, 'scripts', scriptName)], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    const detail = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
    failedChecks.push(detail || `${scriptName} 실행에 실패했습니다.`)
  }
}

if (hasHarnessChanges) {
  runFastCheck('check-harness.mjs')
}

if (hasCodeChanges) {
  runFastCheck('check-architecture.mjs')
}

const reminders = []

if (hasCodeChanges) {
  reminders.push(
    '코드 변경 완료 전 npm run format:check, npm run lint, 관련 npm test를 실행하고, 라우트·빌드 설정·서버/클라이언트 경계 변경이면 npm run build도 실행하세요.',
  )
}

if (failedChecks.length > 0) {
  reminders.unshift(`빠른 검사가 실패했습니다.\n${failedChecks.join('\n')}`)
}

if (reminders.length === 0) {
  process.exit(0)
}

process.stdout.write(
  JSON.stringify({
    continue: true,
    systemMessage: reminders.join('\n'),
  }),
)
