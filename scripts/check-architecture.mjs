import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoots = ['src/app', 'src/features', 'src/shared']
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
const violations = []

function toProjectPath(path) {
  return relative(repositoryRoot, path).split(sep).join('/')
}

function toSourcePath(path) {
  return path.startsWith('src/') ? path.slice('src/'.length) : path
}

function collectSourceFiles(directory) {
  if (!existsSync(directory)) {
    return []
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      return collectSourceFiles(path)
    }

    const extensionIndex = entry.name.lastIndexOf('.')
    const extension = extensionIndex === -1 ? '' : entry.name.slice(extensionIndex)
    return sourceExtensions.has(extension) ? [path] : []
  })
}

function collectImports(content) {
  const imports = new Set()
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      imports.add(match[1])
    }
  }

  return [...imports]
}

function resolveProjectImport(file, source) {
  if (source.startsWith('@/')) {
    return `src/${source.slice(2)}`
  }

  if (source.startsWith('.')) {
    return toProjectPath(resolve(dirname(file), source))
  }

  return null
}

function addViolation(file, content, source, rule) {
  const index = content.indexOf(source)
  const line = index === -1 ? 1 : content.slice(0, index).split('\n').length
  violations.push(`${toProjectPath(file)}:${line} ${rule} (import: ${source})`)
}

function inspectFile(file) {
  const projectPath = toProjectPath(file)
  const sourcePath = toSourcePath(projectPath)
  const content = readFileSync(file, 'utf8')
  const isClientModule =
    /^\s*(?:(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*)(?:\r?\n|\s))*['"]use client['"];?/.test(content)
  const featureMatch = sourcePath.match(/^features\/([^/]+)\//)

  for (const source of collectImports(content)) {
    const resolvedImportPath = resolveProjectImport(file, source)
    const importedPath = resolvedImportPath ? toSourcePath(resolvedImportPath) : null

    if (
      sourcePath.startsWith('shared/') &&
      importedPath &&
      /^(app|features)\//.test(importedPath)
    ) {
      addViolation(file, content, source, 'shared는 app 또는 features에 의존할 수 없습니다.')
    }

    if (sourcePath.startsWith('app/') && importedPath && /^shared\/supabase\//.test(importedPath)) {
      addViolation(
        file,
        content,
        source,
        'app은 Supabase를 직접 참조하지 말고 feature의 view/api 경계를 사용해야 합니다.',
      )
    }

    if (featureMatch && importedPath) {
      const importedFeatureMatch = importedPath.match(/^features\/([^/]+)(?:\/(.+))?$/)
      if (
        importedFeatureMatch &&
        importedFeatureMatch[1] !== featureMatch[1] &&
        importedFeatureMatch[2]
      ) {
        addViolation(
          file,
          content,
          source,
          '다른 feature의 내부 파일을 직접 참조할 수 없습니다. 공개 진입점 또는 shared를 사용하세요.',
        )
      }
    }

    if (
      isClientModule &&
      (source === 'server-only' ||
        (importedPath &&
          (/^shared\/supabase\//.test(importedPath) ||
            /(^|\/)server(?:\/|\.|$)/.test(importedPath))))
    ) {
      addViolation(
        file,
        content,
        source,
        'Client Component에서 서버 전용 모듈을 참조할 수 없습니다.',
      )
    }
  }
}

for (const sourceRoot of sourceRoots) {
  for (const file of collectSourceFiles(resolve(repositoryRoot, sourceRoot))) {
    inspectFile(file)
  }
}

if (violations.length > 0) {
  process.stderr.write(`아키텍처 경계 위반 ${violations.length}건을 발견했습니다.\n`)
  process.stderr.write(`${violations.map((violation) => `- ${violation}`).join('\n')}\n`)
  process.exit(1)
}

process.stdout.write('Architecture check passed.\n')
