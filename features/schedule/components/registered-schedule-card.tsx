import Link from 'next/link'

import { ContentCard } from '@/shared/ui/content-card/content-card'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from '../views/schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

type RegisteredScheduleCardProps = {
  assignedCount: number
  cancellationReason?: string | null
  ceremonyCount: number
  date: string
  dateLabel: string
  time: string
  status?: 'cancelled' | 'published'
  isDraft?: boolean
  variant?: 'management' | 'summary'
}

export function RegisteredScheduleCard({
  assignedCount,
  cancellationReason,
  ceremonyCount,
  date,
  dateLabel,
  time,
  status = 'published',
  isDraft = false,
  variant = 'management',
}: RegisteredScheduleCardProps) {
  return (
    <Link
      aria-label={`${dateLabel} ${status === 'cancelled' ? '취소된 ' : ''}일정 상세 관리`}
      className={styles.registeredScheduleCardLink}
      href={isDraft ? `/admin/schedules/new?month=${date.slice(0, 7)}` : `/admin/schedules/${date}`}
    >
      <ContentCard>
        <div className={layout.row}>
          <strong>{dateLabel}</strong>
          {status === 'cancelled' ? <StatusBadge tone="neutral">취소됨</StatusBadge> : null}
        </div>
        <p className={styles.meta}>
          예식 {ceremonyCount}개 · {time}
        </p>
        {status === 'cancelled' && cancellationReason ? (
          <p className={styles.meta}>취소 사유 · {cancellationReason}</p>
        ) : null}
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
