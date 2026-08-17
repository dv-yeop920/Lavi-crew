import Link from 'next/link'

import { getAdminDashboardTasks } from '@/features/dashboard/model/admin-dashboard-display'
import type { AdminDashboardViewModel } from '@/features/dashboard/schema/admin-dashboard-view-model'
import { RegisteredScheduleCard } from '@/features/schedule'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './dashboard.css'
import * as layout from '@/shared/ui/layout/layout.css'

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    ...options,
  }).format(new Date(`${value}T00:00:00Z`))
}

function previousDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export function AdminDashboardView({ viewModel }: { viewModel: AdminDashboardViewModel }) {
  const tasks = getAdminDashboardTasks(viewModel)
  const weekEnd = previousDate(viewModel.currentWeek.endExclusive)

  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow={formatDate(viewModel.asOfDate, { weekday: 'long', year: 'numeric' })}
        title="오늘의 운영 현황"
        description="월 마감과 스케줄 등록이 필요한 항목을 확인하세요."
      />

      <section className={layout.stack} aria-labelledby="task-title">
        <h2 id="task-title">처리할 일</h2>
        {tasks.length > 0 ? (
          <ul className={layout.list}>
            {tasks.map((task) => (
              <li key={task.label}>
                <Link className={styles.cardLink} href={task.href}>
                  <ContentCard>
                    <div className={styles.responsiveRow}>
                      <strong>{task.label}</strong>
                      <StatusBadge tone={task.tone}>{task.status}</StatusBadge>
                    </div>
                  </ContentCard>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ContentCard>
            <p className={styles.emptyState}>지금 처리할 운영 항목이 없습니다.</p>
          </ContentCard>
        )}
      </section>

      <section
        className={layout.stack}
        aria-describedby="week-description"
        aria-labelledby="week-title"
      >
        <div className={styles.responsiveRow}>
          <h2 id="week-title">이번 주 일정</h2>
          <Link className={styles.link} href="/admin/schedules">
            일정 관리
          </Link>
        </div>
        <p className={styles.meta} id="week-description">
          {formatDate(viewModel.currentWeek.start)}–{formatDate(weekEnd)} · 월요일–일요일
        </p>
        {viewModel.currentWeek.schedules.length > 0 ? (
          <ul className={layout.list}>
            {viewModel.currentWeek.schedules.map((schedule) => (
              <li key={schedule.id}>
                <RegisteredScheduleCard
                  assignedCount={schedule.assignedWorkerCount}
                  ceremonyCount={schedule.ceremonyCount}
                  date={schedule.date}
                  dateLabel={formatDate(schedule.date, { weekday: 'long' })}
                  time={`${schedule.startTime}–${schedule.endTime}`}
                  variant="summary"
                />
              </li>
            ))}
          </ul>
        ) : (
          <ContentCard>
            <p className={styles.emptyState}>이번 주에 등록된 일정이 없습니다.</p>
          </ContentCard>
        )}
      </section>
    </div>
  )
}
