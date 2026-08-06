import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const requiredFiles = [
  'AGENTS.md',
  'Design.md',
  '.prettierignore',
  '.prettierrc.json',
  'eslint.config.mjs',
  'docs/architecture.md',
  'docs/decisions/001-nextjs-vac.md',
  'docs/decisions/002-role-routing.md',
  'docs/decisions/003-cache-strategy.md',
  'docs/requirements-specification.html',
  'docs/screen-architecture.html',
  'docs/supabase-erd.html',
  'docs/user-flow.html',
  'docs/conventions/architecture-boundaries.md',
  'docs/conventions/next-server-boundaries.md',
  'docs/domain/glossary.md',
  'docs/failures/README.md',
  'CLAUDE.md',
  '.claude/agents/code-quality-reviewer.md',
  '.claude/agents/frontend-senior-developer.md',
  '.claude/agents/backend-senior-developer.md',
  '.claude/agents/product-planner.md',
  '.claude/agents/qa-qc-tester.md',
  '.github/workflows/ci.yml',
  'scripts/check-architecture.mjs',
  'scripts/check-harness.mjs',
]
const forbiddenArtifactName =
  /^(?:temp[-_].+|.+_(?:new|old|backup|fix)(?:\.[^.]+)?|.+\.(?:bak|tmp))$/i

function projectPath(path) {
  return relative(repositoryRoot, path).split(sep).join('/')
}

function readText(path) {
  return readFileSync(resolve(repositoryRoot, path), 'utf8')
}

function walk(directory) {
  if (!existsSync(directory)) {
    return []
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

for (const requiredFile of requiredFiles) {
  if (!existsSync(resolve(repositoryRoot, requiredFile))) {
    errors.push(`필수 파일이 없습니다: ${requiredFile}`)
  }
}

const agentsPath = resolve(repositoryRoot, 'AGENTS.md')
if (existsSync(agentsPath) && statSync(agentsPath).size > 32 * 1024) {
  errors.push('AGENTS.md가 기본 지시문 한도인 32 KiB를 초과했습니다.')
}

const packagePath = resolve(repositoryRoot, 'package.json')
if (existsSync(packagePath)) {
  try {
    const packageJson = JSON.parse(readText('package.json'))
    for (const script of [
      'build',
      'check:architecture',
      'check:harness',
      'format',
      'format:check',
      'lint',
      'lint:fix',
    ]) {
      if (!packageJson.scripts?.[script]) {
        errors.push(`package.json scripts에 ${script} 명령이 없습니다.`)
      }
    }
  } catch (error) {
    errors.push(`package.json을 읽을 수 없습니다: ${error.message}`)
  }
}

const claudeAgentsRoot = resolve(repositoryRoot, '.claude/agents')
const claudeAgents = existsSync(claudeAgentsRoot)
  ? readdirSync(claudeAgentsRoot).filter((file) => file.endsWith('.md'))
  : []

for (const claudeAgent of claudeAgents) {
  const path = resolve(claudeAgentsRoot, claudeAgent)
  const content = readFileSync(path, 'utf8')
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const name = frontmatter?.[1].match(/^name:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]
  const description = frontmatter?.[1].match(/^description:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]
  const expectedAgentName = claudeAgent.replace(/\.md$/, '')

  if (!frontmatter || !description) {
    errors.push(`${projectPath(path)}에 frontmatter description이 없습니다.`)
  }

  if (name !== expectedAgentName) {
    errors.push(
      `${projectPath(path)}의 name은 파일명과 같은 ${expectedAgentName}이어야 합니다. 현재: ${name ?? '없음'}`,
    )
  }
}

for (const root of ['app', 'features', 'shared', 'docs', 'scripts', '.claude']) {
  for (const path of walk(resolve(repositoryRoot, root))) {
    if (forbiddenArtifactName.test(basename(path))) {
      errors.push(`임시 또는 대체 작업 파일을 정리하세요: ${projectPath(path)}`)
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`하네스 드리프트 ${errors.length}건을 발견했습니다.\n`)
  process.stderr.write(`${errors.map((error) => `- ${error}`).join('\n')}\n`)
  process.exit(1)
}

process.stdout.write(
  `Harness check passed (${requiredFiles.length} required files, ${claudeAgents.length} agents).\n`,
)
