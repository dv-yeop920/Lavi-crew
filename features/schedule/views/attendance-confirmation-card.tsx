'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useId, useState } from 'react'

import { confirmAttendanceAction } from '@/features/schedule/actions/daily-schedule-actions'
import { toKoreanDateTimeInput, toKoreanIso } from '@/features/schedule/lib/daily-schedule-view'
import type { DailyScheduleViewModel } from '@/features/schedule/schemas/daily-schedule-view-model'
import { POSITION_CATALOG } from '@/shared/domain/positions'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useActionSuccessEffect } from '@/shared/forms/use-action-success-effect'
import { Button } from '@/shared/ui/button/button'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

type ReadyDailySchedule = Extract<DailyScheduleViewModel, { state: 'ready' }>
type Assignment = ReadyDailySchedule['assignments'][number]

type AttendanceConfirmationCardProps = {
  assignment: Assignment
  date: string
  initialRequestId: string
  isScheduleActive: boolean
  onDirtyChange: (assignmentId: string, isDirty: boolean) => void
  shiftEndTime: string
  shiftStartTime: string
  workerName: string
}

export function AttendanceConfirmationCard({
  assignment,
  date,
  initialRequestId,
  isScheduleActive,
  onDirtyChange,
  shiftEndTime,
  shiftStartTime,
  workerName,
}: AttendanceConfirmationCardProps) {
  const router = useRouter()
  const fieldId = useId()
  const attendance = assignment.attendance
  const initialStatus = attendance?.status ?? 'pending'
  const initialStartedAt =
    toKoreanDateTimeInput(attendance?.actualStartedAt ?? null) || `${date}T${shiftStartTime}`
  const initialEndedAt =
    toKoreanDateTimeInput(attendance?.actualEndedAt ?? null) || `${date}T${shiftEndTime}`
  const [status, setStatus] = useState(initialStatus)
  const [actualStartedAt, setActualStartedAt] = useState(initialStartedAt)
  const [actualEndedAt, setActualEndedAt] = useState(initialEndedAt)
  const [correctionReason, setCorrectionReason] = useState('')
  const [requestId, setRequestId] = useState(initialRequestId)
  const [state, formAction, isPending] = useActionState(confirmAttendanceAction, null)
  const isConfirmed = Boolean(attendance?.confirmedAt)
  const hasAttendanceChange =
    status !== initialStatus ||
    (status === 'present' &&
      (actualStartedAt !== initialStartedAt || actualEndedAt !== initialEndedAt))
  const isDirty = hasAttendanceChange || correctionReason.trim().length > 0

  useEffect(() => {
    onDirtyChange(assignment.id, isDirty && !state?.ok)
    return () => onDirtyChange(assignment.id, false)
  }, [assignment.id, isDirty, onDirtyChange, state?.ok])

  useActionSuccessEffect(state, () => {
    queueMicrotask(() => {
      setCorrectionReason('')
      setRequestId(crypto.randomUUID())
      router.refresh()
    })
  })

  function updateDraft(update: () => void) {
    update()
    setRequestId(crypto.randomUUID())
  }

  if (!attendance) {
    return (
      <li className={styles.attendanceItem}>
        <div className={layout.row}>
          <strong>{workerName}</strong>
          <StatusBadge tone="neutral">기록 없음</StatusBadge>
        </div>
        <p className={styles.meta}>이 배정에는 출석 기록이 없어 확정할 수 없습니다.</p>
      </li>
    )
  }

  const payload = {
    actualEndedAt: status === 'present' ? toKoreanIso(actualEndedAt) : null,
    actualStartedAt: status === 'present' ? toKoreanIso(actualStartedAt) : null,
    attendanceId: attendance.id,
    correctionReason: isConfirmed ? correctionReason.trim() || null : null,
    expectedAttendanceUpdatedAt: attendance.updatedAt,
    requestId,
    status: status === 'absent' ? ('absent' as const) : ('present' as const),
  }
  const statusLabel =
    attendance.status === 'present' ? '출석' : attendance.status === 'absent' ? '결근' : '확인 대기'
  const statusTone =
    attendance.status === 'present'
      ? ('positive' as const)
      : attendance.status === 'absent'
        ? ('neutral' as const)
        : ('warning' as const)
  const positionName =
    POSITION_CATALOG.find((position) => position.id === assignment.positionId)?.name ??
    assignment.positionId
  const startTimeError = getFirstFieldError(state?.fieldErrors, 'actualStartedAt')
  const endTimeError = getFirstFieldError(state?.fieldErrors, 'actualEndedAt')
  const correctionError = getFirstFieldError(state?.fieldErrors, 'correctionReason')

  return (
    <li className={styles.attendanceItem}>
      <div className={layout.row}>
        <div className={styles.detail}>
          <strong>{workerName}</strong>
          <span className={styles.meta}>
            {positionName}
            {assignment.isTraining ? ' · 교육' : ''}
          </span>
        </div>
        <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
      </div>
      {!isScheduleActive ? (
        <p className={styles.meta}>게시 중인 일정이 아니어서 출석을 변경할 수 없습니다.</p>
      ) : (
        <form action={formAction} className={layout.stack} aria-busy={isPending} noValidate>
          <input name="payload" type="hidden" value={JSON.stringify(payload)} />
          <label className={styles.fieldLabel} htmlFor={`${fieldId}-status`}>
            <span>출석 상태</span>
            <select
              className={styles.compactInput}
              disabled={isPending}
              id={`${fieldId}-status`}
              value={status}
              onChange={(event) =>
                updateDraft(() => setStatus(event.target.value as 'absent' | 'pending' | 'present'))
              }
            >
              <option disabled value="pending">
                출석 또는 결근을 선택하세요
              </option>
              <option value="present">출석</option>
              <option value="absent">결근</option>
            </select>
          </label>
          {status === 'present' ? (
            <div className={styles.attendanceTimeGrid}>
              <label className={styles.fieldLabel}>
                <span>실제 출근</span>
                <input
                  required
                  aria-describedby={startTimeError ? `${fieldId}-start-error` : undefined}
                  aria-invalid={startTimeError ? true : undefined}
                  className={styles.compactInput}
                  disabled={isPending}
                  type="datetime-local"
                  value={actualStartedAt}
                  onChange={(event) => updateDraft(() => setActualStartedAt(event.target.value))}
                />
              </label>
              <label className={styles.fieldLabel}>
                <span>실제 퇴근</span>
                <input
                  required
                  aria-describedby={endTimeError ? `${fieldId}-end-error` : undefined}
                  aria-invalid={endTimeError ? true : undefined}
                  className={styles.compactInput}
                  disabled={isPending}
                  type="datetime-local"
                  value={actualEndedAt}
                  onChange={(event) => updateDraft(() => setActualEndedAt(event.target.value))}
                />
              </label>
            </div>
          ) : null}
          {startTimeError ? (
            <p className={styles.fieldError} id={`${fieldId}-start-error`} role="alert">
              {startTimeError}
            </p>
          ) : null}
          {endTimeError ? (
            <p className={styles.fieldError} id={`${fieldId}-end-error`} role="alert">
              {endTimeError}
            </p>
          ) : null}
          {isConfirmed ? (
            <label className={styles.fieldLabel}>
              <span>정정 사유</span>
              <textarea
                required
                aria-describedby={correctionError ? `${fieldId}-correction-error` : undefined}
                aria-invalid={correctionError ? true : undefined}
                className={styles.textArea}
                disabled={isPending}
                maxLength={500}
                value={correctionReason}
                onChange={(event) => updateDraft(() => setCorrectionReason(event.target.value))}
              />
              <span className={styles.meta}>확정된 출석을 변경하려면 사유가 필요합니다.</span>
            </label>
          ) : null}
          {attendance.correctionReason ? (
            <p className={styles.meta}>최근 정정 사유 · {attendance.correctionReason}</p>
          ) : null}
          {correctionError ? (
            <p className={styles.fieldError} id={`${fieldId}-correction-error`} role="alert">
              {correctionError}
            </p>
          ) : null}
          {state ? (
            <div
              className={state.ok ? styles.saveMessage : styles.errorMessage}
              role={state.ok ? 'status' : 'alert'}
            >
              <p>{state.message}</p>
              {!state.ok &&
              (state.code === 'STALE_ATTENDANCE' || state.code === 'ATTENDANCE_NOT_CONFIRMABLE') ? (
                <Button variant="secondary" onClick={() => router.refresh()}>
                  최신 상태 다시 불러오기
                </Button>
              ) : null}
            </div>
          ) : null}
          <Button
            disabled={
              isPending ||
              !hasAttendanceChange ||
              status === 'pending' ||
              (isConfirmed && correctionReason.trim().length < 2)
            }
            type="submit"
          >
            {isPending ? '저장 중…' : isConfirmed ? '출석 정정 저장' : '출석 확정'}
          </Button>
        </form>
      )}
    </li>
  )
}
