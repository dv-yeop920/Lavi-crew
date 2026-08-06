'use client'

import { useActionState } from 'react'

import { markNoticeReadAction } from '@/features/notice/actions/notice-actions'
import { formatNoticeDate } from '@/features/notice/lib/notice-display'
import type { WorkerNoticeViewModel } from '@/features/notice/schemas/notice-view-model'
import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './notice.css'
import * as layout from '@/shared/ui/layout/layout.css'

type WorkerNotice = WorkerNoticeViewModel['notices'][number]

function WorkerNoticeCard({
  initialRequestId,
  notice,
}: {
  initialRequestId: string
  notice: WorkerNotice
}) {
  const [state, formAction, isPending] = useActionState(markNoticeReadAction, null)
  const isRead = notice.isRead || state?.ok === true

  function handleToggle(event: React.SyntheticEvent<HTMLDetailsElement>) {
    if (notice.isDemo || !event.currentTarget.open || isRead || isPending || state) return
    event.currentTarget.querySelector('form')?.requestSubmit()
  }

  return (
    <ContentCard>
      <details onToggle={handleToggle}>
        <summary className={styles.noticeSummary}>
          <span className={styles.summaryText}>
            <strong>{notice.title}</strong>
            <span className={styles.meta}>{formatNoticeDate(notice.createdAt)}</span>
          </span>
          <span className={layout.wrap}>
            {notice.isPinned ? <StatusBadge tone="warning">고정</StatusBadge> : null}
            {notice.isDemo ? <StatusBadge tone="accent">데모</StatusBadge> : null}
            <StatusBadge tone={isRead ? 'positive' : 'accent'}>
              {isRead ? '읽음' : '읽지 않음'}
            </StatusBadge>
          </span>
        </summary>
        <div className={styles.noticeBody}>
          <p className={styles.noticeContent}>{notice.content}</p>
          <form action={formAction}>
            <input
              name="payload"
              type="hidden"
              value={JSON.stringify({ noticeId: notice.id, requestId: initialRequestId })}
            />
            {state && !state.ok ? (
              <Button disabled={isPending} type="submit" variant="secondary">
                {isPending ? '읽음 처리 중…' : '읽음 처리 다시 시도'}
              </Button>
            ) : null}
          </form>
          <p aria-live="polite" className={state && !state.ok ? styles.error : styles.meta}>
            {isPending ? '읽음 처리 중입니다.' : state?.message}
          </p>
        </div>
      </details>
    </ContentCard>
  )
}

export function WorkerNoticeListView({
  requestIds,
  viewModel,
}: {
  requestIds: Record<string, string>
  viewModel: WorkerNoticeViewModel
}) {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="공지"
        title="꼭 확인해 주세요"
        description="고정 공지가 먼저 표시되며, 내용을 열면 읽음으로 기록됩니다."
      />
      {viewModel.notices.length > 0 ? (
        <ul className={layout.list}>
          {viewModel.notices.map((notice) => (
            <li key={notice.id}>
              <WorkerNoticeCard initialRequestId={requestIds[notice.id]} notice={notice} />
            </li>
          ))}
        </ul>
      ) : (
        <ContentCard>
          <p className={styles.empty}>등록된 공지가 없습니다.</p>
        </ContentCard>
      )}
    </div>
  )
}
