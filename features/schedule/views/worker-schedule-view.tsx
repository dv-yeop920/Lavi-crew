'use client'

import { useState } from 'react'

import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

const shifts = [
  {
    date: '2026-07-19',
    dateLabel: '7월 19일 일요일',
    education: true,
    position: '메인',
    time: '09:00–18:00',
  },
  {
    date: '2026-07-25',
    dateLabel: '7월 25일 토요일',
    education: false,
    position: '대기실',
    time: '10:00–19:30',
  },
  {
    date: '2026-07-26',
    dateLabel: '7월 26일 일요일',
    education: false,
    position: '메인',
    time: '09:00–18:00',
  },
]

type ViewMode = 'month' | 'week' | 'day'

const viewOptions: { label: string; mode: ViewMode }[] = [
  { label: '월', mode: 'month' },
  { label: '주', mode: 'week' },
  { label: '일', mode: 'day' },
]

const periods: Record<ViewMode, { end: string; label: string; start: string }> = {
  month: { end: '2026-07-31', label: '2026년 7월', start: '2026-07-01' },
  week: { end: '2026-07-26', label: '7월 20일–26일', start: '2026-07-20' },
  day: { end: '2026-07-25', label: '2026년 7월 25일', start: '2026-07-25' },
}

export function WorkerScheduleView() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const period = periods[viewMode]
  const visibleShifts = shifts.filter(
    (shift) => shift.date >= period.start && shift.date <= period.end,
  )

  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="확정 일정"
        title="내 스케줄"
        description="관리자가 확정한 포지션과 근무시간입니다."
      />
      <div className={styles.tabList} role="tablist" aria-label="일정 보기 단위">
        {viewOptions.map((option) => (
          <button
            aria-controls="worker-schedule-panel"
            aria-selected={viewMode === option.mode}
            className={styles.tab}
            id={`worker-schedule-${option.mode}-tab`}
            key={option.mode}
            role="tab"
            type="button"
            onClick={() => setViewMode(option.mode)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <section
        aria-labelledby={`worker-schedule-${viewMode}-tab`}
        className={layout.stack}
        id="worker-schedule-panel"
        role="tabpanel"
      >
        <h2>
          {period.label} · {visibleShifts.length}회
        </h2>
        {visibleShifts.length > 0 ? (
          <ul className={layout.list}>
            {visibleShifts.map((shift) => (
              <li key={shift.date}>
                <ContentCard>
                  <div className={layout.row}>
                    <strong>{shift.dateLabel}</strong>
                    <StatusBadge tone="accent">{shift.position}</StatusBadge>
                  </div>
                  <p className={styles.meta}>{shift.time}</p>
                  {shift.education ? <StatusBadge tone="warning">교육 근무</StatusBadge> : null}
                </ContentCard>
              </li>
            ))}
          </ul>
        ) : (
          <ContentCard>
            <p className={styles.emptyState}>이 기간에 확정된 일정이 없습니다.</p>
          </ContentCard>
        )}
      </section>
    </div>
  )
}
