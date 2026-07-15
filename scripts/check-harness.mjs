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
  '.codex/config.toml',
  '.codex/hooks.json',
  '.codex/hooks/check-verification.mjs',
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

const hooksPath = resolve(repositoryRoot, '.codex/hooks.json')
if (existsSync(hooksPath)) {
  try {
    const hooks = JSON.parse(readText('.codex/hooks.json'))
    if (!Array.isArray(hooks.hooks?.Stop) || hooks.hooks.Stop.length === 0) {
      errors.push('.codex/hooks.json에 Stop 검사가 없습니다.')
    }
  } catch (error) {
    errors.push(`.codex/hooks.json을 읽을 수 없습니다: ${error.message}`)
  }
}

const skillsRoot = resolve(repositoryRoot, '.agents/skills')
const skillDirectories = existsSync(skillsRoot)
  ? readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  : []

for (const skillDirectory of skillDirectories) {
  const skillRoot = resolve(skillsRoot, skillDirectory.name)
  const skillPath = resolve(skillRoot, 'SKILL.md')
  const metadataPath = resolve(skillRoot, 'agents/openai.yaml')

  if (!existsSync(skillPath)) {
    errors.push(`스킬 지시문이 없습니다: ${projectPath(skillPath)}`)
    continue
  }

  const content = readFileSync(skillPath, 'utf8')
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const name = frontmatter?.[1].match(/^name:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]
  const description = frontmatter?.[1].match(/^description:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]

  if (!frontmatter || name !== skillDirectory.name || !description) {
    errors.push(
      `${projectPath(skillPath)}의 frontmatter name/description이 폴더명과 맞지 않습니다.`,
    )
  }

  if (!existsSync(metadataPath)) {
    errors.push(`스킬 UI 메타데이터가 없습니다: ${projectPath(metadataPath)}`)
  }
}

const customAgentsRoot = resolve(repositoryRoot, '.codex/agents')
const customAgents = existsSync(customAgentsRoot)
  ? readdirSync(customAgentsRoot).filter((file) => file.endsWith('.toml'))
  : []

for (const customAgent of customAgents) {
  const path = resolve(customAgentsRoot, customAgent)
  const content = readFileSync(path, 'utf8')
  for (const field of ['name', 'description', 'developer_instructions']) {
    if (!new RegExp(`^${field}\\s*=`, 'm').test(content)) {
      errors.push(`${projectPath(path)}에 ${field} 필드가 없습니다.`)
    }
  }
}

for (const root of ['app', 'features', 'shared', 'docs', 'scripts', '.agents', '.codex']) {
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
  `Harness check passed (${requiredFiles.length} required files, ${skillDirectories.length} skills, ${customAgents.length} agents).\n`,
)
