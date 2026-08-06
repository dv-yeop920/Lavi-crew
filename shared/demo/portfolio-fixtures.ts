import { POSITION_CATALOG, type PositionId } from '../domain/positions'

export const PORTFOLIO_DEMO_WORKER_ID_PREFIX = 'demo-worker-'
export const PORTFOLIO_DEMO_NOTICE_ID_PREFIX = 'demo-notice-'

type PortfolioDemoWorkerSource = {
  applicationAverage: number
  attendanceCount: number
  email: string
  hourlyWage: number
  id: string
  joinedAt: string
  name: string
  phone: string
  positionCounts: Partial<Record<PositionId, number>>
  positionIds: PositionId[]
}

export type PortfolioDemoWorker = PortfolioDemoWorkerSource & {
  appliedDates: string[]
  history: string
  isActive: true
  isDemo: true
  role: 'worker'
  summary: string
}

type PortfolioDemoWorkerFixture = {
  attendanceCount: number
  name: string
  positionIds: readonly PositionId[]
}

const workers: readonly PortfolioDemoWorkerFixture[] = [
  { attendanceCount: 5, name: '전옥진', positionIds: ['leader', 'song', 'manager', 'guide'] },
  {
    attendanceCount: 4,
    name: '안유정',
    positionIds: ['leader', 'dress', 'main', 'waiting-room', 'song', 'manager'],
  },
  {
    attendanceCount: 1,
    name: '박지희',
    positionIds: ['leader', 'dress', 'main', 'waiting-room', 'song', 'manager'],
  },
  {
    attendanceCount: 3,
    name: '윤태관',
    positionIds: ['leader', 'scan', 'main', 'song', 'manager', 'guide'],
  },
  { attendanceCount: 5, name: '문태희', positionIds: ['scan', 'song', 'guide'] },
  { attendanceCount: 2, name: '이시온', positionIds: ['main', 'song', 'manager', 'guide'] },
  { attendanceCount: 4, name: '김지윤', positionIds: ['dress', 'waiting-room', 'song', 'manager'] },
  { attendanceCount: 1, name: '강예서', positionIds: ['dress', 'waiting-room', 'song', 'manager'] },
  { attendanceCount: 3, name: '김윤아', positionIds: ['dress', 'waiting-room', 'song', 'manager'] },
  { attendanceCount: 5, name: '박주은', positionIds: ['waiting-room', 'song', 'manager'] },
  { attendanceCount: 2, name: '신서하', positionIds: ['waiting-room', 'song', 'manager'] },
  {
    attendanceCount: 4,
    name: '안효상',
    positionIds: ['scan', 'song', 'main', 'manager', 'guide'],
  },
  { attendanceCount: 1, name: '이효린', positionIds: ['waiting-room', 'song', 'manager'] },
]

const workerSources: PortfolioDemoWorkerSource[] = workers.map(
  ({ attendanceCount, name, positionIds }, index) => {
    const idNumber = String(index + 1).padStart(2, '0')
    const positionCounts: Partial<Record<PositionId, number>> = {}
    for (let attendanceIndex = 0; attendanceIndex < attendanceCount; attendanceIndex += 1) {
      const positionId = positionIds[attendanceIndex % positionIds.length]
      positionCounts[positionId] = (positionCounts[positionId] ?? 0) + 1
    }

    return {
      applicationAverage: 2 + (index % 4),
      attendanceCount,
      email: `demo.crew.${idNumber}@example.com`,
      hourlyWage: 12000 + (index % 3) * 500,
      id: `${PORTFOLIO_DEMO_WORKER_ID_PREFIX}${idNumber}`,
      joinedAt: `${2024 + (index % 2)}-${String((index % 9) + 1).padStart(2, '0')}-01T00:00:00+09:00`,
      name,
      phone: `010-0000-${String(index + 101).padStart(4, '0')}`,
      positionCounts,
      positionIds: [...positionIds],
    }
  },
)

function getWeekendDates(month: string) {
  const dates: string[] = []
  const cursor = new Date(`${month}-01T00:00:00Z`)
  while (cursor.toISOString().slice(0, 7) === month) {
    if (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6) {
      dates.push(cursor.toISOString().slice(0, 10))
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

function getPositionName(positionId: PositionId) {
  return POSITION_CATALOG.find((position) => position.id === positionId)?.name ?? positionId
}

function toDemoWorker(source: PortfolioDemoWorkerSource, month: string): PortfolioDemoWorker {
  const positionHistory = source.positionIds
    .map((positionId) => ({ count: source.positionCounts[positionId] ?? 0, positionId }))
    .filter(({ count }) => count > 0)
    .map(({ count, positionId }) => `${getPositionName(positionId)} ${count}회`)
  const skills = source.positionIds.map(getPositionName).join(', ')
  const history = [`지난달 출근 ${source.attendanceCount}회`, ...positionHistory].join(' · ')
  const positionHistoryText = positionHistory.join(', ')
  const summary = [positionHistoryText ? `지난달: ${positionHistoryText}` : '', `가능: ${skills}`]
    .filter(Boolean)
    .join(' · ')

  return {
    ...source,
    appliedDates: getWeekendDates(month),
    history,
    isActive: true,
    isDemo: true,
    role: 'worker',
    summary,
  }
}

export function getPortfolioDemoWorkers(month: string) {
  return workerSources.map((worker) => toDemoWorker(worker, month))
}

export function getPortfolioDemoWorker(workerId: string, month: string) {
  const worker = workerSources.find((candidate) => candidate.id === workerId)
  return worker ? toDemoWorker(worker, month) : null
}

export function isPortfolioDemoWorkerId(value: string) {
  return value.startsWith(PORTFOLIO_DEMO_WORKER_ID_PREFIX)
}

export function containsPortfolioDemoWorkerId(workerIds: Iterable<string>) {
  return Array.from(workerIds).some(isPortfolioDemoWorkerId)
}

export const PORTFOLIO_DEMO_NOTICES = [
  {
    content:
      '이번 달 스케줄 신청은 월 마감 전까지 변경할 수 있습니다. 가능한 주말을 모두 확인한 뒤 저장해 주세요.',
    createdAt: '2026-08-01T09:00:00+09:00',
    id: `${PORTFOLIO_DEMO_NOTICE_ID_PREFIX}01`,
    isDemo: true as const,
    isPinned: true,
    title: '8월 스케줄 신청 안내',
    updatedAt: '2026-08-01T09:00:00+09:00',
  },
  {
    content:
      '확정된 근무일에는 근무 시작 10분 전까지 직원 통로로 도착해 주세요. 변동 사항은 관리자에게 알려 주세요.',
    createdAt: '2026-07-28T18:00:00+09:00',
    id: `${PORTFOLIO_DEMO_NOTICE_ID_PREFIX}02`,
    isDemo: true as const,
    isPinned: false,
    title: '근무 당일 안내',
    updatedAt: '2026-07-28T18:00:00+09:00',
  },
  {
    content: '개인 프로필에서 확정 출석 기준의 월별 급여와 평균 급여를 확인할 수 있습니다.',
    createdAt: '2026-07-20T12:00:00+09:00',
    id: `${PORTFOLIO_DEMO_NOTICE_ID_PREFIX}03`,
    isDemo: true as const,
    isPinned: false,
    title: '급여 내역 확인 안내',
    updatedAt: '2026-07-20T12:00:00+09:00',
  },
]

export function isPortfolioDemoNoticeId(value: string) {
  return value.startsWith(PORTFOLIO_DEMO_NOTICE_ID_PREFIX)
}
