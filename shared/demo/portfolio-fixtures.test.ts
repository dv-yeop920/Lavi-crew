import { describe, expect, it } from 'vitest'

import { POSITION_CATALOG } from '../domain/positions'

import {
  containsPortfolioDemoWorkerId,
  getPortfolioDemoWorker,
  getPortfolioDemoWorkers,
  isPortfolioDemoNoticeId,
  isPortfolioDemoWorkerId,
  PORTFOLIO_DEMO_NOTICES,
} from './portfolio-fixtures'

describe('portfolio demo fixtures', () => {
  it('contains the requested 13 workers and 55 position skills', () => {
    const workers = getPortfolioDemoWorkers('2026-08')
    expect(workers.map((worker) => worker.name)).toEqual([
      '전옥진',
      '안유정',
      '박지희',
      '윤태관',
      '문태희',
      '이시온',
      '김지윤',
      '강예서',
      '김윤아',
      '박주은',
      '신서하',
      '안효상',
      '이효린',
    ])
    expect(workers.flatMap((worker) => worker.positionIds)).toHaveLength(55)
    expect(
      workers.every(
        (worker) =>
          Object.values(worker.positionCounts).reduce((sum, count) => sum + count, 0) ===
          worker.attendanceCount,
      ),
    ).toBe(true)
    expect(
      workers.every((worker) =>
        worker.positionIds.every((positionId) =>
          POSITION_CATALOG.some((position) => position.id === positionId),
        ),
      ),
    ).toBe(true)
  })

  it('uses stable demo-only ids and applies every August weekend', () => {
    const workers = getPortfolioDemoWorkers('2026-08')
    expect(workers.every((worker) => isPortfolioDemoWorkerId(worker.id))).toBe(true)
    expect(workers[0].appliedDates).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-08',
      '2026-08-09',
      '2026-08-15',
      '2026-08-16',
      '2026-08-22',
      '2026-08-23',
      '2026-08-29',
      '2026-08-30',
    ])
    expect(getPortfolioDemoWorker('demo-worker-01', '2026-08')?.name).toBe('전옥진')
    expect(containsPortfolioDemoWorkerId(['demo-worker-01'])).toBe(true)
    expect(containsPortfolioDemoWorkerId(['00000000-0000-4000-8000-000000000001'])).toBe(false)
  })

  it('marks sample notices as demo-only records', () => {
    expect(PORTFOLIO_DEMO_NOTICES).toHaveLength(3)
    expect(PORTFOLIO_DEMO_NOTICES.every((notice) => isPortfolioDemoNoticeId(notice.id))).toBe(true)
  })
})
