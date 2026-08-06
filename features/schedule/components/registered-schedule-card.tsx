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
  isDemo?: boolean
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
  isDemo = false,
  isDraft = false,
  variant = 'management',
}: RegisteredScheduleCardProps) {
  const isDemoOrDraft = isDemo || isDraft
  return (
    <Link
      aria-label={`${dateLabel} ${status === 'cancelled' ? '취소된 ' : ''}${isDraft ? '임시 저장 ' : isDemo ? '데모 ' : ''}일정 상세 관리`}
      className={styles.registeredScheduleCardLink}
      href={
        isDemoOrDraft
          ? `/admin/schedules/new?month=${date.slice(0, 7)}${isDemo ? `&demoDate=${date}` : ''}`
          : `/admin/schedules/${date}`
      }
    >
      <ContentCard>
        <div className={layout.row}>
          <strong>{dateLabel}</strong>
          {status === 'cancelled' ? <StatusBadge tone="neutral">취소됨</StatusBadge> : null}
          {isDemo ? <StatusBadge tone="warning">브라우저 데모</StatusBadge> : null}
          {isDraft ? (
            <StatusBadge tone="accent">임시 저장 · 미확정(이 브라우저)</StatusBadge>
          ) : null}
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
            <span className={styles.cardAction}>
              {isDraft ? '이어 작성' : isDemo ? '다시 편집' : '상세 보기'}
            </span>
          </div>
        ) : null}
      </ContentCard>
    </Link>
  )
}
