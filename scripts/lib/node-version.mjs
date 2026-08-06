export function assertSupportedNodeVersion(version = process.versions.node) {
  const major = Number.parseInt(version.split('.')[0] ?? '', 10)

  if (!Number.isInteger(major) || major < 22) {
    throw new Error(
      `브라우저 E2E는 Node.js 22 이상에서만 실행할 수 있습니다. 현재 버전: ${version}`,
    )
  }
}
