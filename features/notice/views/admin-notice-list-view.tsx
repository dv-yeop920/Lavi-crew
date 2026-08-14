'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useId, useRef, useState } from 'react'

import {
  createNoticeAction,
  deleteNoticeAction,
  updateNoticeAction,
} from '@/features/notice/actions/notice-actions'
import { formatNoticeDate } from '@/features/notice/lib/notice-display'
import type { NoticeActionResult } from '@/features/notice/schemas/notice-input'
import type { AdminNoticeViewModel } from '@/features/notice/schemas/notice-view-model'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { Button } from '@/shared/ui/button/button'
import { LoadingDots } from '@/shared/ui/button/loading-dots'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './notice.css'
import * as layout from '@/shared/ui/layout/layout.css'

type AdminNotice = AdminNoticeViewModel['notices'][number]
type NoticeAction = (
  state: NoticeActionResult | null,
  formData: FormData,
) => Promise<NoticeActionResult>

type MutationRequestIds = {
  create: string
  notices: Record<string, { delete: string; update: string }>
}

function NoticeEditor({
  initialRequestId,
  mode,
  notice,
  onCancel,
  onRefresh,
  onSuccess,
}: {
  initialRequestId: string
  mode: 'create' | 'update'
  notice?: AdminNotice
  onCancel: () => void
  onRefresh: () => void
  onSuccess: (message: string) => void
}) {
  const action: NoticeAction = mode === 'create' ? createNoticeAction : updateNoticeAction
  const [state, formAction, isPending] = useActionState(action, null)
  const [title, setTitle] = useState(notice?.title ?? '')
  const [content, setContent] = useState(notice?.content ?? '')
  const [isPinned, setIsPinned] = useState(notice?.isPinned ?? false)
  const contentId = useId()
  const contentErrorId = `${contentId}-error`

  useEffect(() => {
    if (!state) return
    if (state.ok) {
      onSuccess(state.message)
    }
  }, [onSuccess, state])

  const payload =
    mode === 'create'
      ? { content, isPinned, requestId: initialRequestId, title }
      : {
          content,
          expectedUpdatedAt: notice?.updatedAt,
          isPinned,
          noticeId: notice?.id,
          requestId: initialRequestId,
          title,
        }
  const contentError = getFirstFieldError(state?.fieldErrors, 'content')

  return (
    <ContentCard>
      <form action={formAction} className={styles.form} noValidate>
        <strong>{mode === 'create' ? '새 공지 등록' : '공지 수정'}</strong>
        <input name="payload" type="hidden" value={JSON.stringify(payload)} />
        <TextField
          disabled={isPending}
          error={getFirstFieldError(state?.fieldErrors, 'title')}
          label="제목"
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          required
          value={title}
        />
        <label className={styles.field} htmlFor={contentId}>
          <span className={styles.label}>내용</span>
          <textarea
            aria-describedby={contentError ? contentErrorId : undefined}
            aria-invalid={Boolean(contentError)}
            className={styles.textarea}
            disabled={isPending}
            id={contentId}
            maxLength={10000}
            onChange={(event) => setContent(event.target.value)}
            required
            value={content}
          />
          {contentError ? (
            <span aria-live="polite" className={styles.error} id={contentErrorId}>
              {contentError}
            </span>
          ) : null}
        </label>
        <label className={styles.checkbox}>
          <input
            checked={isPinned}
            disabled={isPending}
            onChange={(event) => setIsPinned(event.target.checked)}
            type="checkbox"
          />
          중요 공지로 고정
        </label>
        <p aria-live="polite" className={state && !state.ok ? styles.error : styles.meta}>
          {isPending ? '저장 중입니다.' : state?.message}
        </p>
        {state?.code === 'STALE_NOTICE' ? (
          <Button onClick={onRefresh} type="button" variant="secondary">
            최신 상태 다시 불러오기
          </Button>
        ) : null}
        <div className={layout.wrap}>
          <Button disabled={isPending} type="submit">
            {isPending ? <>저장 중<LoadingDots /></> : mode === 'create' ? '공지 등록' : '수정 저장'}
          </Button>
          <Button disabled={isPending} onClick={onCancel} type="button" variant="secondary">
            취소
          </Button>
        </div>
      </form>
    </ContentCard>
  )
}

function DeleteNoticeDialog({
  initialRequestId,
  notice,
  onDeleted,
  onRefresh,
}: {
  initialRequestId: string
  notice: AdminNotice
  onDeleted: (message: string) => void
  onRefresh: () => void
}) {
  const [state, formAction, isPending] = useActionState(deleteNoticeAction, null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!state) return
    if (state.ok) {
      dialogRef.current?.close()
      onDeleted(state.message)
    }
  }, [onDeleted, state])

  return (
    <>
      <Button
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
        variant="secondary"
      >
        삭제
      </Button>
      <dialog aria-labelledby={titleId} className={styles.dialog} ref={dialogRef}>
        <form action={formAction} className={styles.form} noValidate>
          <strong id={titleId}>공지를 삭제할까요?</strong>
          <p className={styles.noticeContent}>
            “{notice.title}” 공지는 목록에서 숨겨지며 삭제 이력은 보존됩니다.
          </p>
          <input
            name="payload"
            type="hidden"
            value={JSON.stringify({
              expectedUpdatedAt: notice.updatedAt,
              noticeId: notice.id,
              requestId: initialRequestId,
            })}
          />
          <p aria-live="assertive" className={state && !state.ok ? styles.error : styles.meta}>
            {isPending ? '삭제 중입니다.' : state?.message}
          </p>
          {state?.code === 'STALE_NOTICE' ? (
            <Button
              onClick={() => {
                dialogRef.current?.close()
                onRefresh()
              }}
              type="button"
              variant="secondary"
            >
              최신 상태 다시 불러오기
            </Button>
          ) : null}
          <div className={layout.wrap}>
            <Button disabled={isPending} type="submit">
              {isPending ? <>삭제 중<LoadingDots /></> : '삭제 확인'}
            </Button>
            <Button
              disabled={isPending}
              onClick={() => dialogRef.current?.close()}
              type="button"
              variant="secondary"
            >
              취소
            </Button>
          </div>
        </form>
      </dialog>
    </>
  )
}

function AdminNoticeCard({
  notice,
  onFeedback,
  onRefresh,
  requestIds,
}: {
  notice: AdminNotice
  onFeedback: (message: string) => void
  onRefresh: () => void
  requestIds: { delete: string; update: string }
}) {
  const [isEditing, setIsEditing] = useState(false)

  function refreshNotice() {
    setIsEditing(false)
    onRefresh()
  }

  return (
    <li>
      <ContentCard>
        <div className={styles.responsiveRow}>
          <strong>{notice.title}</strong>
          <span className={layout.wrap}>
            {notice.isPinned ? <StatusBadge tone="warning">고정</StatusBadge> : null}
          </span>
        </div>
        <span className={styles.meta}>{formatNoticeDate(notice.createdAt)}</span>
        <p className={styles.noticeContent}>{notice.content}</p>
        <div className={styles.responsiveRow}>
          <StatusBadge tone="neutral">
            읽음 {notice.readCount} / {notice.activeWorkerCount}명
          </StatusBadge>
          <div className={layout.wrap}>
            <Button onClick={() => setIsEditing(true)} type="button" variant="secondary">
              수정
            </Button>
            <DeleteNoticeDialog
              initialRequestId={requestIds.delete}
              notice={notice}
              onDeleted={onFeedback}
              onRefresh={refreshNotice}
            />
          </div>
        </div>
      </ContentCard>
      {isEditing ? (
        <div className={styles.editor}>
          <NoticeEditor
            initialRequestId={requestIds.update}
            mode="update"
            notice={notice}
            onCancel={() => setIsEditing(false)}
            onRefresh={refreshNotice}
            onSuccess={(message) => {
              setIsEditing(false)
              onFeedback(message)
            }}
          />
        </div>
      ) : null}
    </li>
  )
}

export function AdminNoticeListView({
  requestIds,
  viewModel,
}: {
  requestIds: MutationRequestIds
  viewModel: AdminNoticeViewModel
}) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [feedback, setFeedback] = useState('')

  function refreshNotices() {
    setIsCreateOpen(false)
    router.refresh()
  }

  return (
    <div className={layout.page}>
      <PageHeader
        backHref="/admin/more"
        backLabel="관리로 돌아가기"
        eyebrow="공지 관리"
        title="공지와 읽음 현황"
        description={`활성 알바 ${viewModel.activeWorkerCount}명의 공지 읽음 상태를 관리합니다.`}
      />
      <div className={styles.responsiveRow}>
        <p aria-live="polite" className={styles.meta}>
          {feedback}
        </p>
        <Button onClick={() => setIsCreateOpen(true)} type="button">
          새 공지 등록
        </Button>
      </div>
      {isCreateOpen ? (
        <NoticeEditor
          initialRequestId={requestIds.create}
          mode="create"
          onCancel={() => setIsCreateOpen(false)}
          onRefresh={refreshNotices}
          onSuccess={(message) => {
            setIsCreateOpen(false)
            setFeedback(message)
          }}
        />
      ) : null}

      {viewModel.notices.length > 0 ? (
        <ul className={layout.list}>
          {viewModel.notices.map((notice) => (
            <AdminNoticeCard
              key={notice.id}
              notice={notice}
              onFeedback={setFeedback}
              onRefresh={refreshNotices}
              requestIds={requestIds.notices[notice.id]}
            />
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
