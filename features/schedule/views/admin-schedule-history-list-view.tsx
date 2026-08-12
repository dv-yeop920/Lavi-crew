import Link from 'next/link'

import { summarizeScheduleHistoryMonths } from '@/features/schedule/domain/schedule-history'
import { monthLabel } from '@/features/schedule/lib/date-format'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

export function AdminScheduleHistoryListView({
  databaseWorkDates,
}: {
  databaseWorkDates: string[]
}) {
  const months = summarizeScheduleHistoryMonths(databaseWorkDates)

  return (
    <div className={layout.page}>
      <PageHeader
        backHref="/admin/more"
        backLabel="관리로 돌아가기"
        eyebrow="일정 관리"
        title="스케줄 이력"
        description="일정이 등록된 월을 선택해 해당 월의 스케줄 이력을 확인하세요."
      />
      {months.length > 0 ? (
        <ul className={layout.list}>
          {months.map((month) => (
            <li key={month.month}>
              <Link
                className={styles.registeredScheduleCardLink}
                href={`/admin/schedules/history/${month.month}`}
              >
                <ContentCard>
                  <strong>{monthLabel(month.month)}</strong>
                  <p className={styles.meta}>{month.registeredDateCount}일 등록됨</p>
                </ContentCard>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ContentCard>
          <p className={styles.emptyState}>등록된 스케줄이 없습니다.</p>
        </ContentCard>
      )}
    </div>
  )
}
