import { createClient } from '@supabase/supabase-js'

import { crewMembers as members } from './lib/crew-roster.mjs'

const requiredEnvironmentNames = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LAVI_ALLOW_CREW_SEED',
  'LAVI_CREW_SEED_PASSWORD',
]
const missingEnvironmentNames = requiredEnvironmentNames.filter((name) => !process.env[name])

if (missingEnvironmentNames.length > 0) {
  throw new Error(
    `구성원 시드에 필요한 환경 변수가 없습니다: ${missingEnvironmentNames.join(', ')}`,
  )
}

if (process.env.LAVI_ALLOW_CREW_SEED !== '1') {
  throw new Error('LAVI_ALLOW_CREW_SEED=1을 명시해야 구성원 시드를 실행할 수 있습니다.')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const { data: adminProfile, error: adminError } = await supabase
  .from('profiles')
  .select('id')
  .eq('role', 'admin')
  .eq('is_active', true)
  .limit(1)
  .maybeSingle()
if (adminError || !adminProfile) {
  throw new Error('활성 관리자 프로필을 찾지 못했습니다. 관리자 계정을 먼저 만드세요.')
}

const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({
  perPage: 1000,
})
if (listError) throw new Error('인증 사용자를 조회할 수 없습니다.')
const existingUserIdByEmail = new Map(
  listedUsers.users.filter((user) => user.email).map((user) => [user.email.toLowerCase(), user.id]),
)

let createdCount = 0
const memberIdByEmail = new Map()

for (const member of members) {
  const existingUserId = existingUserIdByEmail.get(member.email)
  if (existingUserId) {
    memberIdByEmail.set(member.email, existingUserId)
    continue
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: member.email,
    email_confirm: true,
    password: process.env.LAVI_CREW_SEED_PASSWORD,
    user_metadata: {},
  })
  if (error || !data.user) {
    throw new Error(`${member.email} 인증 계정 생성 실패: ${error?.message ?? '알 수 없는 오류'}`)
  }
  memberIdByEmail.set(member.email, data.user.id)
  createdCount += 1
}

const profileRows = members.map((member) => ({
  email: member.email,
  hired_at: member.hiredAt,
  hourly_wage: member.hourlyWage,
  id: memberIdByEmail.get(member.email),
  is_active: true,
  name: member.name,
  phone: member.phone,
  role: 'worker',
}))
const { error: profileError } = await supabase
  .from('profiles')
  .upsert(profileRows, { onConflict: 'id' })
if (profileError) throw new Error(`운영 프로필 저장 실패: ${profileError.message}`)

const skillRows = members.flatMap((member) =>
  member.positionIds.map((positionId) => ({
    assigned_by: adminProfile.id,
    position_id: positionId,
    worker_id: memberIdByEmail.get(member.email),
  })),
)
const { error: skillError } = await supabase
  .from('worker_position_skills')
  .upsert(skillRows, { onConflict: 'worker_id,position_id' })
if (skillError) throw new Error(`포지션 가능 여부 저장 실패: ${skillError.message}`)

process.stdout.write(
  `구성원 ${members.length}명을 반영했습니다. 새로 만든 인증 계정 ${createdCount}개.\n` +
    'LAVI_CREW_SEED_PASSWORD와 서비스 키를 즉시 제거하세요.\n',
)
