import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

const shifts = [
  { date: '7월 19일 일요일', education: true, position: '연회장', time: '09:00–18:00' },
  { date: '7월 25일 토요일', education: false, position: '신부대기실', time: '10:00–19:30' },
  { date: '7월 26일 일요일', education: false, position: '연회장', time: '09:00–18:00' },
]

export function WorkerScheduleView() {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="확정 일정"
        title="내 스케줄"
        description="관리자가 확정한 포지션과 근무시간입니다."
      />
      <div className={styles.tabList} role="tablist" aria-label="일정 보기 단위">
        <button className={styles.tab} type="button" role="tab" aria-selected="true">
          월
        </button>
        <button className={styles.tab} type="button" role="tab" aria-selected="false">
          주
        </button>
        <button className={styles.tab} type="button" role="tab" aria-selected="false">
          일
        </button>
      </div>
      <section className={layout.stack} aria-labelledby="shift-list-title">
        <h2 id="shift-list-title">2026년 7월 · 3회</h2>
        <ul className={layout.list}>
          {shifts.map((shift) => (
            <li key={shift.date}>
              <ContentCard>
                <div className={layout.row}>
                  <strong>{shift.date}</strong>
                  <StatusBadge tone="accent">{shift.position}</StatusBadge>
                </div>
                <p className={styles.meta}>{shift.time}</p>
                {shift.education ? <StatusBadge tone="warning">교육 근무</StatusBadge> : null}
              </ContentCard>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
