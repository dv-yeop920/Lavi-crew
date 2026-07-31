import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

import { createClient } from '@supabase/supabase-js'

const requiredEnvironmentNames = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL',
  'LAVI_ALLOW_LOCAL_SEED',
  'LAVI_E2E_PASSWORD',
]
const missingEnvironmentNames = requiredEnvironmentNames.filter((name) => !process.env[name])

if (missingEnvironmentNames.length > 0) {
  throw new Error(
    `로컬 브라우저 fixture 환경 변수가 없습니다: ${missingEnvironmentNames.join(', ')}`,
  )
}

const apiUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
const databaseUrl = new URL(process.env.SUPABASE_DB_URL)
const isAllowedLocalUrl =
  apiUrl.protocol === 'http:' &&
  apiUrl.port === '54321' &&
  ['127.0.0.1', 'localhost'].includes(apiUrl.hostname)
const isAllowedLocalDatabase =
  ['postgres:', 'postgresql:'].includes(databaseUrl.protocol) &&
  databaseUrl.port === '54322' &&
  databaseUrl.pathname === '/postgres' &&
  ['127.0.0.1', 'localhost'].includes(databaseUrl.hostname)

if (!isAllowedLocalUrl || !isAllowedLocalDatabase || process.env.LAVI_ALLOW_LOCAL_SEED !== '1') {
  throw new Error('로컬 Supabase API(54321)와 DB(54322)에서만 E2E fixture를 만들 수 있습니다.')
}

const fixtures = JSON.parse(
  await readFile(new URL('../e2e/fixtures.json', import.meta.url), 'utf8'),
)
const serviceClient = createClient(apiUrl.origin, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const publicClient = createClient(apiUrl.origin, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const existingIdentityCounts = execFileSync(
  'psql',
  [
    process.env.SUPABASE_DB_URL,
    '-Atc',
    'select (select count(*) from auth.users), (select count(*) from public.profiles)',
  ],
  { encoding: 'utf8' },
).trim()
if (existingIdentityCounts !== '0|0') {
  throw new Error('clean local DB가 아닙니다. npm run db:reset 후 다시 실행하세요.')
}

const identities = [fixtures.admin, ...fixtures.workers]
for (const identity of identities) {
  const { error } = await serviceClient.auth.admin.createUser({
    id: identity.id,
    email: identity.email,
    password: process.env.LAVI_E2E_PASSWORD,
    email_confirm: true,
    user_metadata: {},
  })
  if (error) throw new Error(`${identity.email} Auth fixture 생성 실패: ${error.message}`)
}

function sqlText(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

const profileRows = [
  `(${sqlText(fixtures.admin.id)}, ${sqlText(fixtures.admin.email)}, ${sqlText(fixtures.admin.name)}, ${sqlText(fixtures.admin.phone)}, 'admin', 15000, true, false)`,
  ...fixtures.workers.map(
    (worker, index) =>
      `(${sqlText(worker.id)}, ${sqlText(worker.email)}, ${sqlText(worker.name)}, ${sqlText(worker.phone)}, 'worker', ${10000 + index * 100}, true, ${index === 0})`,
  ),
]
const workerIds = fixtures.workers.map((worker) => sqlText(worker.id)).join(', ')
const fixtureSql = `
begin;
insert into public.profiles
  (id, email, name, phone, role, hourly_wage, is_active, kakao_consent)
values ${profileRows.join(',\n')};
insert into public.worker_position_skills (worker_id, position_id, assigned_by)
select worker_id, position.id, ${sqlText(fixtures.admin.id)}
from unnest(array[${workerIds}]::uuid[]) worker_id
cross join public.positions position;
insert into public.invite_codes
  (code, label, expires_at, max_uses, created_by)
values (
  ${sqlText(fixtures.signupInviteCode)}, '브라우저 E2E 회원가입',
  timestamptz '2099-12-31 23:59:59+09', 2, ${sqlText(fixtures.admin.id)}
);
commit;
`
execFileSync('psql', [process.env.SUPABASE_DB_URL, '-v', 'ON_ERROR_STOP=1'], {
  input: fixtureSql,
  stdio: ['pipe', 'inherit', 'inherit'],
})

for (const identity of [fixtures.admin, fixtures.workers[0]]) {
  const { data, error } = await publicClient.auth.signInWithPassword({
    email: identity.email,
    password: process.env.LAVI_E2E_PASSWORD,
  })
  if (error || data.user?.id !== identity.id) {
    throw new Error(`${identity.email} 로그인 fixture 검증 실패`)
  }
  await publicClient.auth.signOut()
}

process.stdout.write(`로컬 브라우저 E2E fixture ${identities.length}명을 생성했습니다.\n`)
