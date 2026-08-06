'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useState } from 'react'

import {
  createInviteAction,
  deactivateInviteAction,
} from '@/features/management/actions/management-actions'
import type { InviteStatus } from '@/features/management/domain/invite-status'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useActionSuccessEffect } from '@/shared/forms/use-action-success-effect'
import { useSelectiveFormRecovery } from '@/shared/forms/use-selective-form-recovery'
import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './management.css'
import * as layout from '@/shared/ui/layout/layout.css'

export type InviteViewModel = {
  code: string
  expiresAt: string
  id: string
  label: string
  maxUses: number
  status: InviteStatus
  usedCount: number
}

const inviteStatusLabel: Record<InviteStatus, string> = {
  active: '사용 중',
  disabled: '사용 중지',
  exhausted: '사용 완료',
  expired: '기간 만료',
}

function InviteItem({ invite, requestId }: { invite: InviteViewModel; requestId: string }) {
  const action = deactivateInviteAction.bind(null, invite.id, requestId)
  const [state, formAction, isPending] = useActionState(action, null)
  const expiresAt = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(
    new Date(invite.expiresAt),
  )
  return (
    <ContentCard>
      <div className={layout.row}>
        <strong>{invite.label}</strong>
        <StatusBadge tone={invite.status === 'active' ? 'positive' : 'neutral'}>
          {inviteStatusLabel[invite.status]}
        </StatusBadge>
      </div>
      <p className={styles.inviteCode}>{invite.code}</p>
      <p>
        {expiresAt} 만료 · {invite.usedCount} / {invite.maxUses}회 사용
      </p>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`${invite.label} 초대 코드 사용을 중지할까요?`)) {
            event.preventDefault()
          }
        }}
      >
        <Button
          disabled={invite.status !== 'active' || isPending}
          type="submit"
          variant="secondary"
        >
          {isPending ? '처리 중...' : '사용 중지'}
        </Button>
      </form>
      {state?.message ? (
        <p
          className={state.ok ? styles.saveMessage : styles.errorMessage}
          role={state.ok ? 'status' : 'alert'}
        >
          {state.message}
        </p>
      ) : null}
    </ContentCard>
  )
}

export function InviteManagementView({
  createRequestId,
  deactivateRequestIds,
  invites,
}: {
  createRequestId: string
  deactivateRequestIds: Record<string, string>
  invites: InviteViewModel[]
}) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [requestId, setRequestId] = useState(createRequestId)
  const [state, formAction, isPending] = useActionState(
    createInviteAction.bind(null, requestId),
    null,
  )
  const { captureSubmission, formRef } = useSelectiveFormRecovery(state)

  useActionSuccessEffect(state, () => {
    queueMicrotask(() => {
      formRef.current?.reset()
      setIsCreating(false)
      setRequestId(crypto.randomUUID())
      router.refresh()
    })
  })

  return (
    <div className={layout.page}>
      <PageHeader
        backHref="/admin/more"
        backLabel="관리로 돌아가기"
        eyebrow="관리자"
        title="초대 코드"
        description="가입 전용 코드의 만료일과 사용 가능 횟수를 관리합니다."
      />
      <Button onClick={() => setIsCreating((current) => !current)}>
        {isCreating ? '등록 닫기' : '새 초대 코드 등록'}
      </Button>
      {state?.ok ? (
        <p className={styles.saveMessage} role="status">
          {state.message}
        </p>
      ) : null}

      {isCreating ? (
        <ContentCard>
          <form
            action={formAction}
            className={styles.form}
            noValidate
            onSubmitCapture={captureSubmission}
            ref={formRef}
          >
            <TextField
              error={getFirstFieldError(state?.fieldErrors, 'label')}
              label="코드 설명"
              maxLength={60}
              name="label"
              required
            />
            <TextField
              error={getFirstFieldError(state?.fieldErrors, 'expiresAt')}
              label="만료일"
              name="expiresAt"
              required
              type="date"
            />
            <TextField
              error={getFirstFieldError(state?.fieldErrors, 'maxUses')}
              inputMode="numeric"
              label="사용 가능 횟수"
              min="1"
              name="maxUses"
              required
              type="number"
            />
            <Button disabled={isPending} type="submit">
              {isPending ? '생성 중...' : '코드 생성'}
            </Button>
            {state?.message && !state.fieldErrors ? (
              <p
                className={state.ok ? styles.saveMessage : styles.errorMessage}
                role={state.ok ? 'status' : 'alert'}
              >
                {state.message}
              </p>
            ) : null}
          </form>
        </ContentCard>
      ) : null}

      {invites.length > 0 ? (
        <ul className={layout.list}>
          {invites.map((invite) => (
            <li key={invite.id}>
              <InviteItem invite={invite} requestId={deactivateRequestIds[invite.id]} />
            </li>
          ))}
        </ul>
      ) : (
        <ContentCard>
          <p className={styles.contactList}>등록된 초대 코드가 없습니다.</p>
        </ContentCard>
      )}
    </div>
  )
}
