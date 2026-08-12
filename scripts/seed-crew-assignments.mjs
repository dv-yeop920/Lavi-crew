import { createClient } from '@supabase/supabase-js'

import { crewMembers, getWeekendDates } from './lib/crew-roster.mjs'

const requiredEnvironmentNames = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LAVI_ALLOW_CREW_SEED',
]
const missingEnvironmentNames = requiredEnvironmentNames.filter((name) => !process.env[name])

if (missingEnvironmentNames.length > 0) {
  throw new Error(`배정 시드에 필요한 환경 변수가 없습니다: ${missingEnvironmentNames.join(', ')}`)
}

if (process.env.LAVI_ALLOW_CREW_SEED !== '1') {
  throw new Error('LAVI_ALLOW_CREW_SEED=1을 명시해야 배정 시드를 실행할 수 있습니다.')
}

const targetMonth = process.env.LAVI_SEED_ASSIGNMENT_MONTH?.trim() ?? '2026-07'
const weekendDates = getWeekendDates(targetMonth)

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
  throw new Error('활성 관리자 프로필을 찾지 못했습니다.')
}

const { data: workerProfiles, error: profileError } = await supabase
  .from('profiles')
  .select('id, name, hourly_wage')
  .eq('role', 'worker')
  .eq('is_active', true)
if (profileError) throw new Error('구성원 프로필을 조회하지 못했습니다.')

const workerByName = new Map(workerProfiles.map((p) => [p.name, p]))

const periodMonthStart = `${targetMonth}-01`
const { data: existingPeriod } = await supabase
  .from('schedule_application_periods')
  .select('id')
  .eq('year_month', periodMonthStart)
  .maybeSingle()

let periodId
if (existingPeriod) {
  periodId = existingPeriod.id
} else {
  const { data: newPeriod, error: periodCreateError } = await supabase
    .from('schedule_application_periods')
    .insert({
      year_month: periodMonthStart,
      status: 'closed',
      application_deadline: new Date(`${targetMonth}-20T00:00:00Z`).toISOString(),
      created_by: adminProfile.id,
    })
    .select('id')
    .single()
  if (periodCreateError) throw new Error(`신청 기간 생성 실패: ${periodCreateError.message}`)
  periodId = newPeriod.id
}

function pickRandomPositions(positionIds, count) {
  const shuffled = [...positionIds].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

function pickRandomWorkers(members, count) {
  const shuffled = [...members].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

let shiftCount = 0
let assignmentCount = 0

for (const workDate of weekendDates) {
  const { data: existingShift } = await supabase
    .from('shifts')
    .select('id')
    .eq('work_date', workDate)
    .maybeSingle()

  let shiftId
  if (existingShift) {
    shiftId = existingShift.id
  } else {
    const { data: newShift, error: shiftError } = await supabase
      .from('shifts')
      .insert({
        application_period_id: periodId,
        work_date: workDate,
        start_time: '10:00',
        end_time: '19:00',
        ceremony_count: 2 + Math.floor(Math.random() * 3),
        status: 'published',
        created_by: adminProfile.id,
      })
      .select('id')
      .single()
    if (shiftError) throw new Error(`${workDate} 근무일 생성 실패: ${shiftError.message}`)
    shiftId = newShift.id
    shiftCount += 1
  }

  const workersForDate = pickRandomWorkers(crewMembers, 5 + Math.floor(Math.random() * 5))

  for (const member of workersForDate) {
    const profile = workerByName.get(member.name)
    if (!profile) continue

    const positions = pickRandomPositions(member.positionIds, 1)
    if (positions.length === 0) continue

    const positionId = positions[0]

    const { data: existingAssignment } = await supabase
      .from('shift_assignments')
      .select('id')
      .eq('shift_id', shiftId)
      .eq('worker_id', profile.id)
      .eq('position_id', positionId)
      .maybeSingle()

    if (existingAssignment) continue

    const { data: assignment, error: assignmentError } = await supabase
      .from('shift_assignments')
      .insert({
        shift_id: shiftId,
        worker_id: profile.id,
        position_id: positionId,
        is_training: false,
        hourly_wage_snapshot: profile.hourly_wage,
        status: 'confirmed',
        assigned_by: adminProfile.id,
        confirmed_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (assignmentError) {
      process.stderr.write(`${workDate} ${member.name} 배정 실패: ${assignmentError.message}\n`)
      continue
    }

    const { error: attendanceError } = await supabase.from('attendance_records').insert({
      assignment_id: assignment.id,
      status: 'present',
      confirmed_by: adminProfile.id,
      confirmed_at: new Date().toISOString(),
    })
    if (attendanceError) {
      process.stderr.write(
        `${workDate} ${member.name} 출석 기록 실패: ${attendanceError.message}\n`,
      )
      continue
    }

    assignmentCount += 1
  }
}

process.stdout.write(
  `${targetMonth} 배정 시드 완료: 근무일 ${shiftCount}개 생성, 배정·출석 ${assignmentCount}건\n` +
    '셀렉트 리스트에서 "지난달: 팀장 2회, 스캔 1회..." 형태로 표시됩니다.\n',
)
