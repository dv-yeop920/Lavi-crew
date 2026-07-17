import Link from 'next/link'

import { POSITION_CATALOG } from '@/shared/domain/positions'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import { managedWorkers } from '../lib/management-fixtures'
import { formatJoinedAt, formatTenure } from '../lib/tenure'

import * as styles from './management.css'
import * as layout from '@/shared/ui/layout/layout.css'

const currencyFormatter = new Intl.NumberFormat('ko-KR')

export function WorkerManagementView() {
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
      <ul className={layout.list}>
        {managedWorkers.map((worker) => {
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
                    가입일 · {formatJoinedAt(worker.joinedAt)} · 근속{' '}
                    {formatTenure(worker.joinedAt, asOf)}
                  </span>
                </div>
                <p className={styles.wage}>시급 {currencyFormatter.format(worker.hourlyWage)}원</p>
                <p>{worker.history}</p>
                <div className={layout.wrap} aria-label={`${worker.name} 가능한 포지션`}>
                  {positionNames.map((positionName) => (
                    <StatusBadge key={positionName} tone="accent">
                      {positionName}
                    </StatusBadge>
                  ))}
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
    </div>
  )
}
