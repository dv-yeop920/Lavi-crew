import { execFileSync, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'

const supabaseStatus = JSON.parse(
  execFileSync('supabase', ['status', '-o', 'json'], { encoding: 'utf8' }),
)
const apiUrl = new URL(supabaseStatus.API_URL)
if (
  apiUrl.protocol !== 'http:' ||
  apiUrl.port !== '54321' ||
  !['127.0.0.1', 'localhost'].includes(apiUrl.hostname)
) {
  throw new Error('test:e2e는 로컬 Supabase에서만 실행할 수 있습니다.')
}

const environment = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: apiUrl.origin,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabaseStatus.PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: supabaseStatus.SERVICE_ROLE_KEY,
  SUPABASE_DB_URL: supabaseStatus.DB_URL,
  LAVI_ALLOW_LOCAL_SEED: '1',
  LAVI_E2E_PASSWORD: randomBytes(24).toString('base64url'),
  LAVI_E2E_RUN_ID: randomBytes(8).toString('hex'),
  LAVI_E2E_MAILPIT_URL: supabaseStatus.MAILPIT_URL,
  PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3000',
}

function run(command, args) {
  const result = spawnSync(command, args, { env: environment, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('node', ['scripts/seed-local-browser-e2e.mjs'])
run('playwright', ['test'])
