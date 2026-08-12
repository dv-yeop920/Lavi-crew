import { createClient } from '@supabase/supabase-js'

import { crewMembers, getWeekendDates } from './lib/crew-roster.mjs'

const requiredEnvironmentNames = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'LAVI_ALLOW_CREW_SEED',
  'LAVI_CREW_SEED_PASSWORD',
  'LAVI_SEED_APPLICATION_MONTH',
]
const missingEnvironmentNames = requiredEnvironmentNames.filter((name) => !process.env[name])

if (missingEnvironmentNames.length > 0) {
  throw new Error(`신청 시드에 필요한 환경 변수가 없습니다: ${missingEnvironmentNames.join(', ')}`)
}

if (process.env.LAVI_ALLOW_CREW_SEED !== '1') {
  throw new Error('LAVI_ALLOW_CREW_SEED=1을 명시해야 신청 시드를 실행할 수 있습니다.')
}

const month = process.env.LAVI_SEED_APPLICATION_MONTH.trim()
const weekendDates = getWeekendDates(month)

/**
 * 서비스 역할 키를 쓰지 않는다. 각 구성원 본인 세션으로 로그인해 실제 화면과 같은
 * `save_own_monthly_schedule_applications` RPC를 호출하므로 RLS가 그대로 적용된다.
 * 대상 월의 신청 기간이 열려 있어야 하며, 마감된 달은 관리자가 먼저 다시 열어야 한다.
 */
function createAnonymousClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

let appliedCount = 0
const failures = []

for (const member of crewMembers) {
  const client = createAnonymousClient()
  const { error: signInError } = await client.auth.signInWithPassword({
    email: member.email,
    password: process.env.LAVI_CREW_SEED_PASSWORD,
  })
  if (signInError) {
    failures.push(`${member.name}(${member.email}) 로그인 실패: ${signInError.message}`)
    continue
  }

  const { data: period, error: periodError } = await client
    .from('schedule_application_periods')
    .select('id, status, updated_at')
    .eq('year_month', `${month}-01`)
    .maybeSingle()
  if (periodError || !period) {
    await client.auth.signOut()
    throw new Error(`${month} 신청 기간을 찾지 못했습니다. 관리자 화면에서 먼저 기간을 여세요.`)
  }
  if (period.status !== 'open') {
    await client.auth.signOut()
    throw new Error(
      `${month} 신청 기간이 열려 있지 않습니다(현재 ${period.status}). 관리자 화면에서 "신청 다시 열기"를 누른 뒤 실행하세요.`,
    )
  }

  const { error } = await client.rpc('save_own_monthly_schedule_applications', {
    p_expected_period_updated_at: period.updated_at,
    p_period_id: period.id,
    p_request_id: crypto.randomUUID(),
    p_selected_dates: weekendDates,
  })
  if (error) failures.push(`${member.name} 신청 저장 실패: ${error.message}`)
  else appliedCount += 1
  await client.auth.signOut()
}

if (failures.length > 0) {
  throw new Error(`일부 구성원의 신청을 저장하지 못했습니다.\n${failures.join('\n')}`)
}

process.stdout.write(
  `${month} 주말 ${weekendDates.length}일에 구성원 ${appliedCount}명의 신청을 등록했습니다.\n` +
    '관리자 화면에서 신청을 다시 마감한 뒤 일정을 등록하세요.\n',
)
