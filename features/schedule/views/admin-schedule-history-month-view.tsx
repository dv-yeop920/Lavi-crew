'use client'

import { useRef, useState } from 'react'

import { formatDateLabel, monthLabel } from '@/features/schedule/lib/date-format'
import type { ScheduleHistoryRow } from '@/features/schedule/schemas/schedule-history-view-model'
import { POSITION_CATALOG } from '@/shared/domain/positions'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

export function AdminScheduleHistoryMonthView({
  month,
  rows,
}: {
  month: string
  rows: ScheduleHistoryRow[]
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const topRef = useRef<HTMLDivElement>(null)
  const currentRow = rows[currentIndex]

  function navigate(nextIndex: number) {
    setCurrentIndex(nextIndex)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={layout.page}>
      <PageHeader
        backHref="/admin/schedules/history"
        backLabel="스케줄 이력으로 돌아가기"
        eyebrow="일정 관리"
        title={`${monthLabel(month)} 스케줄 이력`}
        description="해당 월에 등록된 일정과 배정 결과를 확인합니다."
      />
      {currentRow ? (
        <>
          <div className={styles.periodNavigator} ref={topRef}>
            <button
              aria-label="이전 날짜 보기"
              className={styles.monthArrowButton}
              disabled={currentIndex === 0}
              type="button"
              onClick={() => navigate(currentIndex - 1)}
            >
              ←
            </button>
            <div aria-live="polite">
              <strong>{formatDateLabel(currentRow.date)}</strong>
              <p className={styles.periodCounter}>
                {currentIndex + 1} / {rows.length}
              </p>
            </div>
            <button
              aria-label="다음 날짜 보기"
              className={styles.monthArrowButton}
              disabled={currentIndex === rows.length - 1}
              type="button"
              onClick={() => navigate(currentIndex + 1)}
            >
              →
            </button>
          </div>
          <ContentCard aria-label={formatDateLabel(currentRow.date)}>
            <StatusBadge tone={currentRow.status === 'cancelled' ? 'neutral' : 'positive'}>
              {currentRow.status === 'cancelled' ? '취소됨' : '게시됨'}
            </StatusBadge>
            <p className={styles.meta}>
              시간 · {currentRow.startTime}–{currentRow.endTime}
            </p>
            <p className={styles.meta}>예식수 · {currentRow.ceremonyCount}건</p>
            <ul className={styles.positionAssignmentList}>
              {POSITION_CATALOG.map((position) => (
                <li className={styles.positionAssignmentRow} key={position.id}>
                  <StatusBadge tone="accent">{position.name}</StatusBadge>
                  <span className={styles.meta}>
                    {currentRow.positionAssignments[position.id].length > 0
                      ? currentRow.positionAssignments[position.id].join(', ')
                      : '-'}
                  </span>
                </li>
              ))}
            </ul>
          </ContentCard>
          <div className={styles.periodNavigator}>
            <button
              aria-label="이전 날짜 보기"
              className={styles.monthArrowButton}
              disabled={currentIndex === 0}
              type="button"
              onClick={() => navigate(currentIndex - 1)}
            >
              ←
            </button>
            <div>
              <p className={styles.periodCounter}>
                {currentIndex + 1} / {rows.length}
              </p>
            </div>
            <button
              aria-label="다음 날짜 보기"
              className={styles.monthArrowButton}
              disabled={currentIndex === rows.length - 1}
              type="button"
              onClick={() => navigate(currentIndex + 1)}
            >
              →
            </button>
          </div>
        </>
      ) : (
        <ContentCard>
          <p className={styles.emptyState}>이 달에 등록된 스케줄이 없습니다.</p>
        </ContentCard>
      )}
    </div>
  )
}
