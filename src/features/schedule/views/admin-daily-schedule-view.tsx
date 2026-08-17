'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useState } from 'react'

import {
  cancelDailyScheduleAction,
  updateDailyScheduleAction,
} from '@/features/schedule/actions/daily-schedule-actions'
import { useDirtyNavigationGuard } from '@/features/schedule/hooks/use-dirty-navigation-guard'
import { createDailyPositionDrafts } from '@/features/schedule/lib/daily-schedule-view'
import type { DailyScheduleViewModel } from '@/features/schedule/schemas/daily-schedule-view-model'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useActionSuccessEffect } from '@/shared/forms/use-action-success-effect'
import { Button } from '@/shared/ui/button/button'
import { LoadingDots } from '@/shared/ui/button/loading-dots'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import {
  type PositionAssignment,
  ScheduleAssignmentTable,
} from '../components/schedule-assignment-table'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

type ReadyDailySchedule = Extract<DailyScheduleViewModel, { state: 'ready' }>

type DailyScheduleDraft = {
  ceremonyCount: number
  endTime: string
  positions: PositionAssignment[]
  startTime: string
}

const ceremonyCountOptions = Array.from({ length: 10 }, (_, index) => index + 1)

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`))
}

function createDraft(viewModel: ReadyDailySchedule): DailyScheduleDraft {
  return {
    ceremonyCount: viewModel.shift.ceremonyCount,
    endTime: viewModel.shift.endTime,
    positions: createDailyPositionDrafts(viewModel.assignments),
    startTime: viewModel.shift.startTime,
  }
}

function isSameDraft(first: DailyScheduleDraft, second: DailyScheduleDraft) {
  return JSON.stringify(first) === JSON.stringify(second)
}

export function AdminDailyScheduleView({
  requestIds,
  viewModel,
}: {
  requestIds: { cancel: string; update: string }
  viewModel: ReadyDailySchedule
}) {
  const router = useRouter()
  const initialDraft = createDraft(viewModel)
  const [draft, setDraft] = useState(initialDraft)
  const [isEditing, setIsEditing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [updateRequestId, setUpdateRequestId] = useState(requestIds.update)
  const [cancelRequestId, setCancelRequestId] = useState(requestIds.cancel)
  const [updateState, updateAction, isUpdating] = useActionState(updateDailyScheduleAction, null)
  const [cancelState, cancelAction, isCancelPending] = useActionState(
    cancelDailyScheduleAction,
    null,
  )
  const structureDirty = isEditing && !isSameDraft(draft, initialDraft)
  const cancellationDirty = isCancelling && cancellationReason.trim().length > 0
  const isDirty = (structureDirty && !updateState?.ok) || (cancellationDirty && !cancelState?.ok)
  useDirtyNavigationGuard({
    confirmationMessage: '저장하지 않은 일정 변경이 있습니다. 이동할까요?',
    isDirty,
  })

  useActionSuccessEffect(updateState, () => {
    queueMicrotask(() => {
      setIsEditing(false)
      setUpdateRequestId(crypto.randomUUID())
      router.refresh()
    })
  })

  useActionSuccessEffect(cancelState, () => {
    queueMicrotask(() => {
      setIsCancelling(false)
      setCancellationReason('')
      setCancelRequestId(crypto.randomUUID())
      router.refresh()
    })
  })

  function updateDraft(changes: Partial<DailyScheduleDraft>) {
    setDraft((current) => ({ ...current, ...changes }))
    setUpdateRequestId(crypto.randomUUID())
  }

  function updatePositions(update: (positions: PositionAssignment[]) => PositionAssignment[]) {
    setDraft((current) => ({ ...current, positions: update(current.positions) }))
    setUpdateRequestId(crypto.randomUUID())
  }

  function updateWorker(positionId: string, personIndex: number, workerId: string) {
    updatePositions((positions) =>
      positions.map((position) => {
        if (position.id !== positionId) return position
        const assignedWorkerIds = [...position.assignedWorkerIds]
        assignedWorkerIds[personIndex] = workerId
        return { ...position, assignedWorkerIds }
      }),
    )
  }

  function addPerson(positionId: string) {
    updatePositions((positions) =>
      positions.map((position) =>
        position.id === positionId &&
        position.assignedWorkerIds.length < position.minimumAssigneeCount + 1
          ? {
              ...position,
              assignedWorkerIds: [...position.assignedWorkerIds, ''],
              trainingFlags: [...position.trainingFlags, true],
            }
          : position,
      ),
    )
  }

  function removePerson(positionId: string, personIndex: number) {
    updatePositions((positions) =>
      positions.map((position) =>
        position.id === positionId && personIndex >= position.minimumAssigneeCount
          ? {
              ...position,
              assignedWorkerIds: position.assignedWorkerIds.filter(
                (_, index) => index !== personIndex,
              ),
              trainingFlags: position.trainingFlags.filter((_, index) => index !== personIndex),
            }
          : position,
      ),
    )
  }

  function toggleTraining(positionId: string, personIndex: number, isTraining: boolean) {
    updatePositions((positions) =>
      positions.map((position) => {
        if (position.id !== positionId) return position
        const trainingFlags = [...position.trainingFlags]
        trainingFlags[personIndex] = isTraining
        return { ...position, trainingFlags }
      }),
    )
  }

  const updatePayload = {
    assignments: draft.positions.flatMap((position) =>
      position.assignedWorkerIds.map((workerId, slotIndex) => ({
        isTraining: position.trainingFlags[slotIndex] ?? false,
        positionId: position.id,
        slotIndex,
        slotKind:
          slotIndex < position.minimumAssigneeCount
            ? ('base' as const)
            : ('extra-training' as const),
        workerId,
      })),
    ),
    ceremonyCount: draft.ceremonyCount,
    endTime: draft.endTime,
    expectedShiftUpdatedAt: viewModel.shift.updatedAt,
    requestId: updateRequestId,
    shiftId: viewModel.shift.id,
    startTime: draft.startTime,
  }
  const cancelPayload = {
    expectedShiftUpdatedAt: viewModel.shift.updatedAt,
    reason: cancellationReason,
    requestId: cancelRequestId,
    shiftId: viewModel.shift.id,
  }
  const scheduleCancelled = viewModel.shift.status === 'cancelled'
  const workers = viewModel.workers.map((worker) => ({
    appliedDates: worker.appliedDates,
    id: worker.id,
    isActive: worker.isActive,
    isSelectable: worker.isSelectable,
    name: worker.name,
    positionIds: worker.positionIds,
    summary: worker.summary,
  }))
  const structureReason = scheduleCancelled
    ? '취소된 일정은 구조를 변경할 수 없습니다.'
    : '게시된 일정만 구조를 변경하거나 취소할 수 있습니다.'
  const ceremonyCountError = getFirstFieldError(updateState?.fieldErrors, 'ceremonyCount')
  const startTimeError = getFirstFieldError(updateState?.fieldErrors, 'startTime')
  const endTimeError = getFirstFieldError(updateState?.fieldErrors, 'endTime')
  const assignmentsError = getFirstFieldError(updateState?.fieldErrors, 'assignments')
  const cancellationError = getFirstFieldError(cancelState?.fieldErrors, 'reason')

  return (
    <div className={layout.page}>
      <PageHeader
        backHref={`/admin/schedules?month=${viewModel.date.slice(0, 7)}`}
        backLabel="일정으로 돌아가기"
        eyebrow="일별 일정 관리"
        title={formatDate(viewModel.date)}
        description="일정 구조와 배정을 관리합니다."
      />

      <ContentCard>
        <div className={layout.row}>
          <div className={styles.detail}>
            <h2>등록 스케줄</h2>
            <span className={styles.meta}>예식, 근무시간과 포지션 배정</span>
          </div>
          {scheduleCancelled ? (
            <StatusBadge tone="neutral">취소됨</StatusBadge>
          ) : isEditing ? (
            <StatusBadge tone="warning">수정 중</StatusBadge>
          ) : viewModel.canEditStructure ? (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              수정
            </Button>
          ) : (
            <StatusBadge tone="neutral">구조 잠김</StatusBadge>
          )}
        </div>

        {scheduleCancelled ? (
          <div className={styles.errorMessage} role="status">
            <p>{structureReason}</p>
            {viewModel.shift.cancellationReason ? (
              <p>취소 사유 · {viewModel.shift.cancellationReason}</p>
            ) : null}
          </div>
        ) : !viewModel.canEditStructure ? (
          <p className={styles.saveMessage} role="status">
            {structureReason}
          </p>
        ) : null}

        <form action={updateAction} aria-busy={isUpdating} noValidate>
          <input name="payload" type="hidden" value={JSON.stringify(updatePayload)} />
          <div className={styles.scheduleInfoGrid}>
            <label className={styles.fieldLabel}>
              <span>예식 개수</span>
              <select
                aria-describedby={
                  ceremonyCountError ? 'daily-schedule-ceremony-count-error' : undefined
                }
                aria-invalid={ceremonyCountError ? true : undefined}
                className={styles.compactInput}
                disabled={!isEditing || isUpdating}
                value={draft.ceremonyCount}
                onChange={(event) => updateDraft({ ceremonyCount: Number(event.target.value) })}
              >
                {ceremonyCountOptions.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.fieldLabel}>
              <span>근무 시작</span>
              <input
                aria-describedby={startTimeError ? 'daily-schedule-start-time-error' : undefined}
                aria-invalid={startTimeError ? true : undefined}
                className={styles.compactInput}
                disabled={isUpdating}
                readOnly={!isEditing}
                type="time"
                value={draft.startTime}
                onChange={(event) => updateDraft({ startTime: event.target.value })}
              />
            </label>
            <label className={styles.fieldLabel}>
              <span>근무 종료</span>
              <input
                aria-describedby={endTimeError ? 'daily-schedule-end-time-error' : undefined}
                aria-invalid={endTimeError ? true : undefined}
                className={styles.compactInput}
                disabled={isUpdating}
                readOnly={!isEditing}
                type="time"
                value={draft.endTime}
                onChange={(event) => updateDraft({ endTime: event.target.value })}
              />
            </label>
          </div>

          {ceremonyCountError ? (
            <p className={styles.fieldError} id="daily-schedule-ceremony-count-error" role="alert">
              {ceremonyCountError}
            </p>
          ) : null}
          {startTimeError ? (
            <p className={styles.fieldError} id="daily-schedule-start-time-error" role="alert">
              {startTimeError}
            </p>
          ) : null}
          {endTimeError ? (
            <p className={styles.fieldError} id="daily-schedule-end-time-error" role="alert">
              {endTimeError}
            </p>
          ) : null}

          <div
            aria-describedby={assignmentsError ? 'daily-schedule-assignments-error' : undefined}
            aria-label="포지션별 배정"
            role="group"
          >
            <ScheduleAssignmentTable
              isEditing={isEditing}
              positions={draft.positions}
              selectedDate={viewModel.date}
              workers={workers}
              onAddPerson={addPerson}
              onRemovePerson={removePerson}
              onToggleTraining={toggleTraining}
              onUpdateWorker={updateWorker}
            />
          </div>

          {assignmentsError ? (
            <p className={styles.fieldError} id="daily-schedule-assignments-error" role="alert">
              {assignmentsError}
            </p>
          ) : null}
          {updateState ? (
            <div
              className={updateState.ok ? styles.saveMessage : styles.errorMessage}
              role={updateState.ok ? 'status' : 'alert'}
            >
              <p>{updateState.message}</p>
              {!updateState.ok && updateState.code === 'STALE_SHIFT' ? (
                <Button variant="secondary" onClick={() => router.refresh()}>
                  최신 상태 다시 불러오기
                </Button>
              ) : null}
            </div>
          ) : null}

          {isEditing ? (
            <div className={layout.wrap}>
              <Button disabled={!structureDirty || isUpdating} type="submit">
                {isUpdating ? (
                  <>
                    저장 중<LoadingDots />
                  </>
                ) : (
                  '수정 저장'
                )}
              </Button>
              <Button
                disabled={isUpdating}
                variant="secondary"
                onClick={() => {
                  setDraft(initialDraft)
                  setIsEditing(false)
                  setUpdateRequestId(crypto.randomUUID())
                }}
              >
                수정 취소
              </Button>
            </div>
          ) : null}
        </form>

        {!scheduleCancelled && viewModel.canEditStructure && !isEditing ? (
          <Button variant="secondary" onClick={() => setIsCancelling(true)}>
            일정 취소
          </Button>
        ) : null}
      </ContentCard>

      {isCancelling ? (
        <ContentCard>
          <form
            action={cancelAction}
            className={layout.stack}
            aria-busy={isCancelPending}
            noValidate
          >
            <input name="payload" type="hidden" value={JSON.stringify(cancelPayload)} />
            <h2>이 일정을 취소할까요?</h2>
            <p className={styles.meta}>일정과 배정은 삭제하지 않고 취소 이력으로 보존됩니다.</p>
            <label className={styles.fieldLabel}>
              <span>취소 사유</span>
              <textarea
                required
                aria-describedby={cancellationError ? 'daily-schedule-cancel-error' : undefined}
                aria-invalid={cancellationError ? true : undefined}
                className={styles.textArea}
                disabled={isCancelPending}
                maxLength={500}
                value={cancellationReason}
                onChange={(event) => {
                  setCancellationReason(event.target.value)
                  setCancelRequestId(crypto.randomUUID())
                }}
              />
            </label>
            {cancellationError ? (
              <p className={styles.fieldError} id="daily-schedule-cancel-error" role="alert">
                {cancellationError}
              </p>
            ) : null}
            {cancelState ? (
              <div
                className={cancelState.ok ? styles.saveMessage : styles.errorMessage}
                role={cancelState.ok ? 'status' : 'alert'}
              >
                <p>{cancelState.message}</p>
                {!cancelState.ok && cancelState.code === 'STALE_SHIFT' ? (
                  <Button variant="secondary" onClick={() => router.refresh()}>
                    최신 상태 다시 불러오기
                  </Button>
                ) : null}
              </div>
            ) : null}
            <div className={layout.wrap}>
              <Button
                disabled={cancellationReason.trim().length < 2 || isCancelPending}
                type="submit"
              >
                {isCancelPending ? '취소 중…' : '일정 취소 확정'}
              </Button>
              <Button
                disabled={isCancelPending}
                variant="secondary"
                onClick={() => {
                  setIsCancelling(false)
                  setCancellationReason('')
                }}
              >
                돌아가기
              </Button>
            </div>
          </form>
        </ContentCard>
      ) : null}
    </div>
  )
}
