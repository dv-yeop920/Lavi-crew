import Link from 'next/link'

import { moveWorkerScheduleAnchor } from '@/features/schedule/model/worker-schedule-navigation'
import type { WorkerScheduleViewModel } from '@/features/schedule/schema/worker-schedule-view-model'
import { ButtonLink } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

type ReadyWorkerSchedule = WorkerScheduleViewModel & { state: 'ready' }
const viewOptions = [
  { label: '월', mode: 'month' },
  { label: '주', mode: 'week' },
  { label: '일', mode: 'day' },
] as const

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    ...options,
  }).format(new Date(`${value}T00:00:00Z`))
}

function getRangeLabel(viewModel: ReadyWorkerSchedule) {
  if (viewModel.mode === 'month') {
    return formatDate(viewModel.range.start, { year: 'numeric' }).replace(' 1일', '')
  }
  if (viewModel.mode === 'day') {
    return formatDate(viewModel.range.start, { weekday: 'long', year: 'numeric' })
  }
  return `${formatDate(viewModel.range.start)}–${formatDate(viewModel.range.end)}`
}

export function WorkerScheduleView({ viewModel }: { viewModel: ReadyWorkerSchedule }) {
  const shifts = [...viewModel.shifts].sort((left, right) => left.date.localeCompare(right.date))
  const rangeLabel = getRangeLabel(viewModel)
  const previousAnchor = moveWorkerScheduleAnchor(viewModel.mode, viewModel.anchor, -1)
  const nextAnchor = moveWorkerScheduleAnchor(viewModel.mode, viewModel.anchor, 1)

  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="확정 일정"
        title="내 스케줄"
        description="관리자가 확정한 포지션과 근무시간입니다."
      />
      <nav className={styles.tabList} aria-label="일정 보기 단위">
        {viewOptions.map((option) => (
          <Link
            aria-current={viewModel.mode === option.mode ? 'page' : undefined}
            className={styles.tab}
            href={`/schedule?mode=${option.mode}&anchor=${viewModel.anchor}`}
            key={option.mode}
          >
            {option.label}
          </Link>
        ))}
      </nav>
      <div className={styles.periodNavigator}>
        <Link
          aria-label="이전 기간 보기"
          className={styles.monthArrowButton}
          href={`/schedule?mode=${viewModel.mode}&anchor=${previousAnchor}`}
        >
          ←
        </Link>
        <strong>{rangeLabel}</strong>
        <Link
          aria-label="다음 기간 보기"
          className={styles.monthArrowButton}
          href={`/schedule?mode=${viewModel.mode}&anchor=${nextAnchor}`}
        >
          →
        </Link>
      </div>
      <section className={layout.stack} aria-labelledby="worker-schedule-title">
        <h2 id="worker-schedule-title">{shifts.length}회 확정</h2>
        {shifts.length > 0 ? (
          <ul className={layout.list}>
            {shifts.map((shift) => (
              <li key={shift.assignmentId}>
                <ContentCard>
                  <div className={styles.responsiveRow}>
                    <strong>{formatDate(shift.date, { weekday: 'long' })}</strong>
                    <StatusBadge tone="accent">{shift.positionName}</StatusBadge>
                  </div>
                  <p className={styles.meta}>
                    {shift.startTime}–{shift.endTime}
                  </p>
                  {shift.isTraining ? <StatusBadge tone="warning">교육 근무</StatusBadge> : null}
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
      <ButtonLink
        href={`/schedule/all?month=${viewModel.range.start.slice(0, 7)}`}
        variant="secondary"
      >
        전체 일정 조회하기
      </ButtonLink>
    </div>
  )
}
