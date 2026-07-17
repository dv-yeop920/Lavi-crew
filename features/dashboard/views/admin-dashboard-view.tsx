import Link from 'next/link'

import {
  getRegisteredSchedulesForWeek,
  RegisteredScheduleCard,
  registeredSchedules,
} from '@/features/schedule'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './dashboard.css'
import * as layout from '@/shared/ui/layout/layout.css'

const tasks = [
  { count: '1개월', href: '/admin/schedules', label: '월 신청 마감 예정', tone: 'warning' },
  { count: '2일', href: '/admin/schedules', label: '스케줄 등록 필요', tone: 'accent' },
] as const

const scheduleDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
})

export function AdminDashboardView() {
  const thisWeekSchedules = getRegisteredSchedulesForWeek(registeredSchedules)

  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="관리자"
        title="오늘의 운영 현황"
        description="월 마감과 스케줄 등록이 필요한 항목을 확인하세요."
      />

      <section className={layout.stack} aria-labelledby="task-title">
        <h2 id="task-title">처리할 일</h2>
        <ul className={layout.list}>
          {tasks.map((task) => (
            <li key={task.label}>
              <Link href={task.href}>
                <ContentCard>
                  <div className={layout.row}>
                    <strong>{task.label}</strong>
                    <StatusBadge tone={task.tone}>{task.count}</StatusBadge>
                  </div>
                </ContentCard>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={layout.stack} aria-labelledby="week-title">
        <div className={layout.row}>
          <h2 id="week-title">이번 주 일정</h2>
          <Link className={styles.link} href="/admin/schedules">
            일정 관리
          </Link>
        </div>
        {thisWeekSchedules.length > 0 ? (
          <ul className={layout.list}>
            {thisWeekSchedules.map((schedule) => (
              <li key={schedule.date}>
                <RegisteredScheduleCard
                  assignedCount={schedule.assignedCount}
                  ceremonyCount={schedule.ceremonyCount}
                  date={schedule.date}
                  dateLabel={scheduleDateFormatter.format(new Date(`${schedule.date}T00:00:00`))}
                  time={schedule.time}
                  variant="summary"
                />
              </li>
            ))}
          </ul>
        ) : (
          <ContentCard>
            <p className={layout.subdued}>이번 주에 등록된 일정이 없습니다.</p>
          </ContentCard>
        )}
      </section>
    </div>
  )
}
