import Link from 'next/link'

import { ContentCard } from '@/shared/ui/content-card/content-card'

import * as styles from '../views/schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

type RegisteredScheduleCardProps = {
  assignedCount: number
  ceremonyCount: number
  date: string
  dateLabel: string
  time: string
  variant?: 'management' | 'summary'
}

export function RegisteredScheduleCard({
  assignedCount,
  ceremonyCount,
  date,
  dateLabel,
  time,
  variant = 'management',
}: RegisteredScheduleCardProps) {
  return (
    <Link
      aria-label={`${dateLabel} 일정 상세 관리`}
      className={styles.registeredScheduleCardLink}
      href={`/admin/schedules/${date}`}
    >
      <ContentCard>
        <strong>{dateLabel}</strong>
        <p className={styles.meta}>
          예식 {ceremonyCount}개 · {time}
        </p>
        {variant === 'management' ? (
          <div className={layout.row}>
            <span className={styles.meta}>배정 {assignedCount}명</span>
            <span className={styles.cardAction}>상세 보기</span>
          </div>
        ) : null}
      </ContentCard>
    </Link>
  )
}
