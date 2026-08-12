import Link from 'next/link'

import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import { formatJoinedAt, formatTenure } from '../lib/tenure'

import * as styles from './management.css'
import * as layout from '@/shared/ui/layout/layout.css'

export type ManagedWorkerViewModel = {
  averageMonthlyApplicationDays: number
  email: string
  history: string
  hourlyWage: number
  id: string
  isActive: boolean
  joinedAt: string
  name: string
  phone: string
  positionIds: PositionId[]
  role: 'admin' | 'worker'
}

const currencyFormatter = new Intl.NumberFormat('ko-KR')

export function WorkerManagementView({ workers }: { workers: ManagedWorkerViewModel[] }) {
  const asOf = new Date()

  return (
    <div className={layout.page}>
      <PageHeader
        backHref="/admin/more"
        backLabel="관리로 돌아가기"
        eyebrow="관리자"
        title="인원 관리"
        description="연락처, 개인 시급, 출근·포지션 이력과 가능한 포지션을 확인하고 관리합니다."
      />
      {workers.length > 0 ? (
        <ul className={layout.list}>
          {workers.map((worker) => {
            const positionNames = POSITION_CATALOG.filter((position) =>
              worker.positionIds.includes(position.id),
            ).map((position) => position.name)

            return (
              <li key={worker.id}>
                <ContentCard>
                  <div className={layout.row}>
                    <strong>{worker.name}</strong>
                    <StatusBadge tone={worker.isActive ? 'positive' : 'neutral'}>
                      {worker.role === 'admin' ? '관리자' : worker.isActive ? '활성' : '삭제됨'}
                    </StatusBadge>
                  </div>
                  <div className={styles.contactList} aria-label={`${worker.name} 연락처`}>
                    <span>{worker.phone}</span>
                    <span>{worker.email}</span>
                    <span>
                      입사일 · {formatJoinedAt(worker.joinedAt)} · 근속{' '}
                      {formatTenure(worker.joinedAt, asOf)}
                    </span>
                  </div>
                  <p className={styles.wage}>
                    시급 {currencyFormatter.format(worker.hourlyWage)}원
                  </p>
                  <p>
                    {worker.history} · 월 평균 신청 {worker.averageMonthlyApplicationDays}일
                  </p>
                  <div className={layout.wrap} aria-label={`${worker.name} 가능한 포지션`}>
                    {positionNames.length > 0 ? (
                      positionNames.map((positionName) => (
                        <StatusBadge key={positionName} tone="accent">
                          {positionName}
                        </StatusBadge>
                      ))
                    ) : (
                      <span className={styles.contactList}>설정된 포지션 없음</span>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    <Link
                      aria-label={`${worker.name} 수정`}
                      className={styles.editLink}
                      href={`/admin/workers/${worker.id}`}
                    >
                      수정
                    </Link>
                  </div>
                </ContentCard>
              </li>
            )
          })}
        </ul>
      ) : (
        <ContentCard>
          <p className={styles.contactList}>등록된 구성원이 없습니다.</p>
        </ContentCard>
      )}
    </div>
  )
}
