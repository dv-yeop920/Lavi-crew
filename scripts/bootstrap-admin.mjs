import { createClient } from '@supabase/supabase-js'

const requiredEnvironmentNames = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LAVI_ADMIN_EMAIL',
]
const missingEnvironmentNames = requiredEnvironmentNames.filter((name) => !process.env[name])

if (missingEnvironmentNames.length > 0) {
  throw new Error(
    `관리자 초기화에 필요한 환경 변수가 없습니다: ${missingEnvironmentNames.join(', ')}`,
  )
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)
const targetEmail = process.env.LAVI_ADMIN_EMAIL.trim().toLowerCase()
const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({
  perPage: 1000,
})
if (listError) throw new Error('인증 사용자를 조회할 수 없습니다.')

const user = listedUsers.users.find((candidate) => candidate.email?.toLowerCase() === targetEmail)
if (!user)
  throw new Error('일치하는 인증 사용자가 없습니다. 이메일 확인과 가입 완료 후 다시 실행하세요.')

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, role')
  .eq('id', user.id)
  .maybeSingle()
if (profileError || !profile) throw new Error('대상 사용자의 운영 프로필이 없습니다.')
if (profile.role === 'admin') {
  process.stdout.write('대상 사용자는 이미 관리자입니다. 변경하지 않았습니다.\n')
  process.exit(0)
}

const { error: updateError } = await supabase
  .from('profiles')
  .update({ role: 'admin' })
  .eq('id', user.id)
if (updateError) throw new Error('관리자 역할을 부여하지 못했습니다.')

process.stdout.write(
  '관리자 역할을 부여했습니다. LAVI_ADMIN_EMAIL과 서비스 키를 즉시 제거하세요.\n',
)
