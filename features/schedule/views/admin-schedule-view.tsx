import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

const scheduleDates = [
  {
    date: '7월 19일 일요일',
    deadline: '마감 완료',
    events: '예식 5개 · 11:00–17:00',
    tone: 'neutral',
  },
  {
    date: '7월 25일 토요일',
    deadline: '신청 중',
    events: '예식 4개 · 12:00–17:30',
    tone: 'positive',
  },
  {
    date: '7월 26일 일요일',
    deadline: '신청 중',
    events: '예식 6개 · 10:30–18:00',
    tone: 'positive',
  },
] as const

export function AdminScheduleView() {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="스케줄 관리"
        title="7월 근무일"
        description="근무시간과 예식 정보를 등록하고 신청 마감을 관리합니다."
      />
      <Button>새 근무일 등록</Button>
      <ul className={layout.list}>
        {scheduleDates.map((schedule) => (
          <li key={schedule.date}>
            <ContentCard>
              <div className={layout.row}>
                <strong>{schedule.date}</strong>
                <StatusBadge tone={schedule.tone}>{schedule.deadline}</StatusBadge>
              </div>
              <p className={styles.meta}>{schedule.events}</p>
              <div className={layout.wrap}>
                <Button variant="secondary">수정</Button>
                <Button variant="secondary">마감 관리</Button>
              </div>
            </ContentCard>
          </li>
        ))}
      </ul>
    </div>
  )
}
