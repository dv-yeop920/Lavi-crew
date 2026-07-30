'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useState } from 'react'

import {
  deactivateManagedWorkerAction,
  updateManagedWorkerAction,
} from '@/features/management/actions/management-actions'
import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useSelectiveFormRecovery } from '@/shared/forms/use-selective-form-recovery'
import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'
import { TextField } from '@/shared/ui/text-field/text-field'

import { formatJoinedAt, formatTenure } from '../lib/tenure'

import * as styles from './management.css'
import * as layout from '@/shared/ui/layout/layout.css'

export type WorkerDetailViewModel = {
  averageMonthlyApplicationDays: number
  email: string
  history: string
  hourlyWage: number
  id: string
  isActive: boolean
  joinedAt: string
  name: string
  phone: string
  positionIds: PositionId[]
  role: 'admin' | 'worker'
}

export function WorkerDetailView({ worker }: { worker: WorkerDetailViewModel }) {
  const router = useRouter()
  const updateAction = updateManagedWorkerAction.bind(null, worker.id)
  const deactivateAction = deactivateManagedWorkerAction.bind(null, worker.id)
  const [updateState, updateFormAction, isUpdating] = useActionState(updateAction, null)
  const [deactivateState, deactivateFormAction, isDeactivating] = useActionState(
    deactivateAction,
    null,
  )
  const { captureSubmission, formRef } = useSelectiveFormRecovery(updateState)
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)

  return (
    <div className={layout.page}>
      <PageHeader
        backHref="/admin/workers"
        backLabel="인원 목록으로 돌아가기"
        eyebrow="인원 상세"
        title={worker.name}
        description="이름, 개인 시급과 가능한 포지션을 수정할 수 있습니다."
      />

      <ContentCard>
        <div className={layout.row}>
          <strong>회원 상태</strong>
          <StatusBadge tone={worker.isActive ? 'positive' : 'neutral'}>
            {worker.role === 'admin' ? '관리자' : worker.isActive ? '활성' : '삭제됨 · 로그인 불가'}
          </StatusBadge>
        </div>
        <div className={styles.contactList}>
          <span>이메일 · {worker.email}</span>
          <span>연락처 · {worker.phone}</span>
          <span>
            가입일 · {formatJoinedAt(worker.joinedAt)} · 근속 {formatTenure(worker.joinedAt)}
          </span>
          <span>월 평균 신청 일수 · {worker.averageMonthlyApplicationDays}일</span>
          <span>{worker.history}</span>
        </div>
      </ContentCard>

      <ContentCard>
        <form
          action={updateFormAction}
          className={styles.form}
          noValidate
          onSubmitCapture={captureSubmission}
          ref={formRef}
        >
          <TextField
            defaultValue={worker.name}
            disabled={!worker.isActive || isUpdating}
            error={getFirstFieldError(updateState?.fieldErrors, 'name')}
            label="이름"
            name="name"
            required
          />
          <TextField
            defaultValue={worker.hourlyWage}
            disabled={!worker.isActive || isUpdating}
            error={getFirstFieldError(updateState?.fieldErrors, 'hourlyWage')}
            hint="이 인원의 모든 포지션 근무에 공통으로 적용됩니다."
            inputMode="numeric"
            label="개인 시급"
            min="1"
            name="hourlyWage"
            required
            step="100"
            type="number"
          />
          <TextField
            disabled
            hint="마스킹된 연락처는 조회 전용이며 관리자 수정으로 원본을 덮어쓰지 않습니다."
            label="연락처"
            value={worker.phone}
          />

          <fieldset disabled={!worker.isActive || isUpdating} className={styles.positionFieldset}>
            <legend className={styles.positionLegend}>가능한 포지션</legend>
            <div className={styles.checkboxGrid}>
              {POSITION_CATALOG.map((position) => (
                <label className={styles.checkbox} key={position.id}>
                  <input
                    className={styles.checkboxInput}
                    defaultChecked={worker.positionIds.includes(position.id)}
                    name="positionIds"
                    type="checkbox"
                    value={position.id}
                  />
                  <span>{position.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {getFirstFieldError(updateState?.fieldErrors, 'positionIds') ? (
            <p aria-live="polite" className={styles.fieldError}>
              {getFirstFieldError(updateState?.fieldErrors, 'positionIds')}
            </p>
          ) : null}

          <div className={layout.wrap}>
            <Button disabled={!worker.isActive || isUpdating} type="submit">
              {isUpdating ? '저장 중...' : '완료'}
            </Button>
            <Button
              disabled={isUpdating}
              variant="secondary"
              onClick={() => router.push('/admin/workers')}
            >
              취소
            </Button>
            <Button
              disabled={!worker.isActive || worker.role === 'admin'}
              variant="secondary"
              onClick={() => setIsDeleteConfirming(true)}
            >
              회원 삭제
            </Button>
          </div>
          {updateState?.message && !updateState.fieldErrors ? (
            <p
              className={updateState.ok ? styles.saveMessage : styles.errorMessage}
              role={updateState.ok ? 'status' : 'alert'}
            >
              {updateState.message}
            </p>
          ) : null}
        </form>
      </ContentCard>

      {worker.role === 'admin' ? (
        <p className={styles.contactList}>단일 관리자 계정은 인원 관리에서 삭제할 수 없습니다.</p>
      ) : null}

      {isDeleteConfirming && worker.role === 'worker' && worker.isActive ? (
        <section className={styles.confirmation} aria-labelledby="delete-worker-title">
          <strong id="delete-worker-title">{worker.name} 회원을 삭제할까요?</strong>
          <p>로그인과 신규 신청·배정은 차단되며 기존 근무 및 급여 이력은 삭제되지 않습니다.</p>
          <form action={deactivateFormAction} className={layout.wrap}>
            <Button disabled={isDeactivating} type="submit">
              {isDeactivating ? '처리 중...' : '회원 삭제 확인'}
            </Button>
            <Button variant="secondary" onClick={() => setIsDeleteConfirming(false)}>
              취소
            </Button>
          </form>
          {deactivateState?.message ? (
            <p
              className={deactivateState.ok ? styles.saveMessage : styles.errorMessage}
              role={deactivateState.ok ? 'status' : 'alert'}
            >
              {deactivateState.message}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
