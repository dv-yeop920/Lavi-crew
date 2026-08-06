import Link from 'next/link'

import type { WorkerHomeViewModel } from '@/features/dashboard/schemas/worker-home-view-model'
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

function formatMonth(value: string) {
  const month = value.slice(0, 7)
  const [year, numericMonth] = month.split('-')
  return `${year}년 ${Number(numericMonth)}월`
}

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'long',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value))
}

function formatNoticeDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value))
}

export function WorkerHomeView({ viewModel }: { viewModel: WorkerHomeViewModel }) {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="오늘의 라비크루"
        title={`안녕하세요, ${viewModel.name}님`}
        description="확정된 일정과 신청 현황, 새 공지를 확인하세요."
      />

      <section className={layout.stack} aria-labelledby="next-shift-title">
        <div className={styles.responsiveRow}>
          <h2 id="next-shift-title">다음 근무</h2>
          <Link className={styles.link} href="/schedule">
            전체 일정
          </Link>
        </div>
        {viewModel.nextShift ? (
          <ContentCard>
            <div className={styles.responsiveRow}>
              <div className={styles.metric}>
                <strong className={styles.metricValue}>
                  {formatDate(viewModel.nextShift.date)}
                </strong>
                <span className={styles.meta}>
                  {formatDate(viewModel.nextShift.date, { weekday: 'long' })} ·{' '}
                  {viewModel.nextShift.startTime}–{viewModel.nextShift.endTime}
                </span>
              </div>
              <div className={layout.wrap}>
                <StatusBadge tone="accent">{viewModel.nextShift.positionName}</StatusBadge>
                {viewModel.nextShift.isTraining ? (
                  <StatusBadge tone="warning">교육 근무</StatusBadge>
                ) : null}
              </div>
            </div>
            <Link
              className={styles.link}
              href={`/schedule?mode=day&anchor=${viewModel.nextShift.date}`}
            >
              일정 자세히 보기
            </Link>
          </ContentCard>
        ) : (
          <ContentCard>
            <p className={styles.emptyState}>예정된 확정 근무가 없습니다.</p>
          </ContentCard>
        )}
      </section>

      <section className={layout.stack} aria-labelledby="application-title">
        <h2 id="application-title">일정 신청</h2>
        {viewModel.application ? (
          <ContentCard>
            <div className={layout.wrap}>
              <StatusBadge tone="positive">신청 가능</StatusBadge>
              <StatusBadge tone="accent">{viewModel.application.appliedCount}일 신청</StatusBadge>
            </div>
            <strong>{formatMonth(viewModel.application.yearMonth)} 신청 진행 중</strong>
            <span className={styles.meta}>
              {formatDeadline(viewModel.application.deadline)}까지 변경할 수 있어요.
            </span>
            <Link
              className={styles.link}
              href={`/schedule/apply?month=${viewModel.application.yearMonth.slice(0, 7)}`}
            >
              신청 달력 열기
            </Link>
          </ContentCard>
        ) : (
          <ContentCard>
            <p className={styles.emptyState}>현재 신청할 수 있는 일정이 없습니다.</p>
          </ContentCard>
        )}
      </section>

      <section className={layout.stack} aria-labelledby="notice-title">
        <div className={styles.responsiveRow}>
          <h2 id="notice-title">공지</h2>
          <Link className={styles.link} href="/notices">
            모두 보기
          </Link>
        </div>
        {viewModel.notices.length > 0 ? (
          <ul className={layout.list}>
            {viewModel.notices.map((notice) => (
              <li key={notice.id}>
                <ContentCard>
                  <div className={layout.wrap}>
                    {notice.isPinned ? <StatusBadge tone="warning">고정</StatusBadge> : null}
                    {!notice.isRead ? <StatusBadge tone="accent">새 공지</StatusBadge> : null}
                  </div>
                  <strong>{notice.title}</strong>
                  {notice.contentPreview ? (
                    <p className={styles.noticePreview}>{notice.contentPreview}</p>
                  ) : null}
                  <span className={styles.meta}>{formatNoticeDate(notice.createdAt)}</span>
                </ContentCard>
              </li>
            ))}
          </ul>
        ) : (
          <ContentCard>
            <p className={styles.emptyState}>등록된 공지가 없습니다.</p>
          </ContentCard>
        )}
      </section>
    </div>
  )
}
