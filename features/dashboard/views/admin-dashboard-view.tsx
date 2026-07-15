import Link from 'next/link'

import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './dashboard.css'
import * as layout from '@/shared/ui/layout/layout.css'

const tasks = [
  { count: '2건', href: '/admin/schedules', label: '신청 마감 필요', tone: 'warning' },
  { count: '8명', href: '/admin/assignments', label: '미배정 신청자', tone: 'accent' },
  { count: '4건', href: '/admin/attendance', label: '출석 미확정', tone: 'neutral' },
] as const

export function AdminDashboardView() {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="관리자"
        title="오늘의 운영 현황"
        description="마감과 출석 확정이 필요한 항목부터 확인하세요."
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
        <ContentCard>
          <div className={layout.row}>
            <div className={styles.metric}>
              <strong className={styles.metricValue}>36명</strong>
              <span className={styles.meta}>토·일 확정 배정 인원</span>
            </div>
            <StatusBadge tone="positive">배정 완료</StatusBadge>
          </div>
        </ContentCard>
      </section>
    </div>
  )
}
