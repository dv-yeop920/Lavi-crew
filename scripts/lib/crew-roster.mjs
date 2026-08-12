/**
 * 운영 초기 구성원 명단의 단일 원본. `seed-crew-members.mjs`(계정·프로필 생성)와
 * `seed-crew-applications.mjs`(월별 신청 등록)가 같은 명단을 공유한다.
 *
 * 이름·연락처·이메일은 실제 개인 정보가 아닌 자리표시자다. 연락처는 통신사에 할당되지 않는
 * 010-0000-XXXX 대역, 이메일은 예약 도메인 example.com을 쓴다. 비밀번호는 이 파일에 두지 않고
 * LAVI_CREW_SEED_PASSWORD 환경 변수로만 받는다.
 */
const roster = [
  { hourlyWage: 12000, name: '전옥진', positionIds: ['leader', 'song', 'manager', 'guide'] },
  {
    hourlyWage: 12500,
    name: '안유정',
    positionIds: ['leader', 'dress', 'main', 'waiting-room', 'song', 'manager'],
  },
  {
    hourlyWage: 13000,
    name: '박지희',
    positionIds: ['leader', 'dress', 'main', 'waiting-room', 'song', 'manager'],
  },
  {
    hourlyWage: 12000,
    name: '윤태관',
    positionIds: ['leader', 'scan', 'main', 'song', 'manager', 'guide'],
  },
  { hourlyWage: 12500, name: '문태희', positionIds: ['scan', 'song', 'guide'] },
  { hourlyWage: 13000, name: '이시온', positionIds: ['main', 'song', 'manager', 'guide'] },
  { hourlyWage: 12000, name: '김지윤', positionIds: ['dress', 'waiting-room', 'song', 'manager'] },
  { hourlyWage: 12500, name: '강예서', positionIds: ['dress', 'waiting-room', 'song', 'manager'] },
  { hourlyWage: 13000, name: '김윤아', positionIds: ['dress', 'waiting-room', 'song', 'manager'] },
  { hourlyWage: 12000, name: '박주은', positionIds: ['waiting-room', 'song', 'manager'] },
  { hourlyWage: 12500, name: '신서하', positionIds: ['waiting-room', 'song', 'manager'] },
  { hourlyWage: 13000, name: '안효상', positionIds: ['scan', 'song', 'main', 'manager', 'guide'] },
  { hourlyWage: 12000, name: '이효린', positionIds: ['waiting-room', 'song', 'manager'] },
]

export const crewMembers = roster.map((member, index) => {
  const sequence = String(index + 1).padStart(2, '0')
  return {
    ...member,
    email: `crew${sequence}@example.com`,
    hiredAt: '2026-01-02',
    phone: `0100000${String(index + 101).padStart(4, '0')}`,
  }
})

/** 대상 월(`YYYY-MM`)의 토요일과 일요일 날짜를 오름차순으로 돌려준다. */
export function getWeekendDates(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error(`대상 월 형식이 올바르지 않습니다: ${month}`)
  }
  const dates = []
  const cursor = new Date(`${month}-01T00:00:00Z`)
  while (cursor.toISOString().slice(0, 7) === month) {
    const weekday = cursor.getUTCDay()
    if (weekday === 0 || weekday === 6) dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}
