'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'

import {
  cancelScheduleApplicationPeriodAction,
  saveScheduleApplicationPeriodAction,
  setScheduleApplicationPeriodStatusAction,
} from '@/features/schedule/actions/schedule-actions'
import type { MonthRegistrationViewModel } from '@/features/schedule/schemas/schedule-view-model'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useActionSuccessEffect } from '@/shared/forms/use-action-success-effect'
import { Button } from '@/shared/ui/button/button'
import { LoadingDots } from '@/shared/ui/button/loading-dots'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

type ScheduleApplicationPeriodCardProps = {
  hasScheduleHistory: boolean
  month: string
  period: MonthRegistrationViewModel['period']
  requestId: string
  selectedDates: string[]
}

function getDeadlineInputs(month: string, value: string | null) {
  if (value) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Seoul',
      year: 'numeric',
    })
      .formatToParts(new Date(value))
      .reduce<Record<string, string>>((result, part) => {
        result[part.type] = part.value
        return result
      }, {})
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      time: `${parts.hour}:${parts.minute}`,
    }
  }

  const [year, monthNumber] = month.split('-').map(Number)
  const candidate = new Date(Date.UTC(year, monthNumber - 2, 25))

  const todayParts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value
      return result
    }, {})
  const earliestAllowed = new Date(
    Date.UTC(Number(todayParts.year), Number(todayParts.month) - 1, Number(todayParts.day) + 1),
  )
  const effectiveCandidate =
    candidate.getTime() > earliestAllowed.getTime() ? candidate : earliestAllowed

  return {
    date: effectiveCandidate.toISOString().slice(0, 10),
    time: '18:00',
  }
}

function toDeadlineIso(date: string, time: string) {
  const deadline = new Date(`${date}T${time}:00+09:00`)
  return Number.isNaN(deadline.valueOf()) ? '' : deadline.toISOString()
}

export function ScheduleApplicationPeriodCard({
  hasScheduleHistory,
  month,
  period,
  requestId: initialRequestId,
  selectedDates,
}: ScheduleApplicationPeriodCardProps) {
  const router = useRouter()
  const initialDeadline = getDeadlineInputs(month, period.applicationDeadline)
  const [deadlineDate, setDeadlineDate] = useState(initialDeadline.date)
  const [deadlineTime, setDeadlineTime] = useState(initialDeadline.time)
  const [deadlineRequestId, setDeadlineRequestId] = useState(initialRequestId)
  const [statusRequestId, setStatusRequestId] = useState(initialRequestId)
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [cancelRequestId, setCancelRequestId] = useState(initialRequestId)
  const closeConfirmationRef = useRef<HTMLElement>(null)
  const cancelConfirmationRef = useRef<HTMLElement>(null)
  const closeTriggerRef = useRef<HTMLButtonElement>(null)
  const cancelTriggerRef = useRef<HTMLButtonElement>(null)
  const [periodState, periodAction, isSavingPeriod] = useActionState(
    saveScheduleApplicationPeriodAction,
    null,
  )
  const [statusState, statusAction, isSavingStatus] = useActionState(
    setScheduleApplicationPeriodStatusAction,
    null,
  )
  const [cancelState, cancelAction, isCancelling] = useActionState(
    cancelScheduleApplicationPeriodAction,
    null,
  )
  const isBusy = isSavingPeriod || isSavingStatus || isCancelling

  useActionSuccessEffect(periodState, () => {
    if (!period.id && selectedDates.length > 0) {
      router.push(`/admin/schedules/new?month=${month}&dates=${selectedDates.join(',')}`)
    } else {
      router.refresh()
    }
  })
  useActionSuccessEffect(statusState, () => router.refresh())
  useActionSuccessEffect(cancelState, () => router.refresh())

  useEffect(() => {
    queueMicrotask(() => {
      setDeadlineRequestId(initialRequestId)
      setStatusRequestId(initialRequestId)
      setCancelRequestId(initialRequestId)
    })
  }, [initialRequestId])

  useEffect(() => {
    if (isConfirmingClose) closeConfirmationRef.current?.focus()
  }, [isConfirmingClose])

  useEffect(() => {
    if (isConfirmingCancel) cancelConfirmationRef.current?.focus()
  }, [isConfirmingCancel])

  function updateDeadline(update: () => void) {
    update()
    setDeadlineRequestId(crypto.randomUUID())
  }

  function prepareStatusMutation() {
    setStatusRequestId(crypto.randomUUID())
  }

  const periodPayload = JSON.stringify({
    applicationDates: selectedDates,
    applicationDeadline: toDeadlineIso(deadlineDate, deadlineTime),
    expectedPeriodUpdatedAt: period.updatedAt,
    month,
    periodId: period.id,
    requestId: deadlineRequestId,
  })
  const statusLabel = !period.id
    ? '미설정'
    : period.status === 'open'
      ? '신청 중'
      : period.closedReason === 'manual'
        ? null
        : '기한 만료'
  const deadlineError = getFirstFieldError(periodState?.fieldErrors, 'applicationDeadline')

  return (
    <ContentCard aria-labelledby="application-period-title">
      <div className={layout.row}>
        <h2 id="application-period-title">신청 기간 운영</h2>
        {statusLabel ? (
          <StatusBadge tone={period.status === 'open' && period.id ? 'positive' : 'neutral'}>
            {statusLabel}
          </StatusBadge>
        ) : null}
      </div>
      <p className={styles.meta}>마감 시각 전까지 구성원이 월별 가능일을 신청할 수 있습니다.</p>

      {hasScheduleHistory ? (
        <div className={layout.stack}>
          <p>
            <strong>신청 마감</strong> {initialDeadline.date} {initialDeadline.time}
          </p>
          <p className={styles.meta}>
            일정이 등록된 월입니다. 신청 마감 시각은 더 이상 변경할 수 없습니다.
          </p>
        </div>
      ) : (
        <form action={periodAction} aria-busy={isSavingPeriod} noValidate>
          <input name="payload" type="hidden" value={periodPayload} />
          <div className={styles.deadlineGrid}>
            <label className={styles.fieldLabel}>
              <span>마감 날짜</span>
              <input
                required
                aria-describedby={deadlineError ? 'application-deadline-error' : undefined}
                aria-invalid={deadlineError ? true : undefined}
                className={styles.compactInput}
                disabled={isBusy}
                type="date"
                value={deadlineDate}
                onChange={(event) => updateDeadline(() => setDeadlineDate(event.target.value))}
              />
            </label>
            <label className={styles.fieldLabel}>
              <span>마감 시간</span>
              <input
                required
                aria-describedby={deadlineError ? 'application-deadline-error' : undefined}
                aria-invalid={deadlineError ? true : undefined}
                className={styles.compactInput}
                disabled={isBusy}
                type="time"
                value={deadlineTime}
                onChange={(event) => updateDeadline(() => setDeadlineTime(event.target.value))}
              />
            </label>
            <Button disabled={isBusy || selectedDates.length === 0} type="submit">
              {isSavingPeriod ? (
                <>
                  저장 중<LoadingDots />
                </>
              ) : period.id ? (
                '마감 시각 변경'
              ) : selectedDates.length > 0 ? (
                '신청 기간 열고 일정 등록'
              ) : (
                '신청 날짜를 선택해 주세요'
              )}
            </Button>
          </div>
          {deadlineError ? (
            <p className={styles.fieldError} id="application-deadline-error" role="alert">
              {deadlineError}
            </p>
          ) : null}
        </form>
      )}

      {periodState ? (
        <div
          className={periodState.ok ? styles.saveMessage : styles.errorMessage}
          role={periodState.ok ? 'status' : 'alert'}
        >
          <p>{periodState.message}</p>
          {!periodState.ok && periodState.code === 'STALE_PERIOD' ? (
            <Button variant="secondary" onClick={() => router.refresh()}>
              최신 상태 다시 불러오기
            </Button>
          ) : null}
        </div>
      ) : null}

      {period.id && period.updatedAt ? (
        <div className={layout.stack}>
          {period.status === 'open' ? (
            isConfirmingClose ? (
              <section
                aria-labelledby="close-period-title"
                className={styles.confirmation}
                ref={closeConfirmationRef}
                tabIndex={-1}
              >
                <h3 id="close-period-title">지금 신청을 마감할까요?</h3>
                <p className={styles.meta}>
                  저장하지 않은 구성원 신청은 반영되지 않으며, 게시 일정이 생기면 다시 열 수
                  없습니다.
                </p>
                <form action={statusAction} noValidate>
                  <input
                    name="payload"
                    type="hidden"
                    value={JSON.stringify({
                      expectedPeriodUpdatedAt: period.updatedAt,
                      nextStatus: 'closed',
                      periodId: period.id,
                      requestId: statusRequestId,
                    })}
                  />
                  <div className={layout.wrap}>
                    <Button disabled={isBusy} type="submit">
                      {isSavingStatus ? '마감 중…' : '신청 마감 확정'}
                    </Button>
                    <Button
                      disabled={isBusy}
                      variant="secondary"
                      onClick={() => {
                        setIsConfirmingClose(false)
                        queueMicrotask(() => closeTriggerRef.current?.focus())
                      }}
                    >
                      계속 신청 받기
                    </Button>
                  </div>
                </form>
              </section>
            ) : (
              <Button
                disabled={isBusy}
                ref={closeTriggerRef}
                variant="secondary"
                onClick={() => {
                  prepareStatusMutation()
                  setIsConfirmingClose(true)
                }}
              >
                신청 수동 마감
              </Button>
            )
          ) : period.canReopen ? (
            <form action={statusAction} noValidate>
              <input
                name="payload"
                type="hidden"
                value={JSON.stringify({
                  expectedPeriodUpdatedAt: period.updatedAt,
                  nextStatus: 'open',
                  periodId: period.id,
                  requestId: statusRequestId,
                })}
              />
              <Button disabled={isBusy} variant="secondary" type="submit">
                {isSavingStatus ? '다시 여는 중…' : '신청 다시 열기'}
              </Button>
            </form>
          ) : period.closedReason === 'manual' ? (
            <p className={styles.meta}>
              마감 시각이 지났거나 이 기간의 일정이 게시되어 다시 열 수 없습니다.
            </p>
          ) : hasScheduleHistory ? (
            <p className={styles.meta}>게시 이력이 있어 신청 기간을 다시 열 수 없습니다.</p>
          ) : (
            <p className={styles.meta}>
              새 미래 마감 시각을 저장하면 신청 기간이 다시 활성화됩니다.
            </p>
          )}

          {statusState ? (
            <div
              className={statusState.ok ? styles.saveMessage : styles.errorMessage}
              role={statusState.ok ? 'status' : 'alert'}
            >
              <p>{statusState.message}</p>
              {!statusState.ok &&
              (statusState.code === 'STALE_PERIOD' ||
                statusState.code === 'PERIOD_CANNOT_BE_REOPENED') ? (
                <Button variant="secondary" onClick={() => router.refresh()}>
                  최신 상태 다시 불러오기
                </Button>
              ) : null}
            </div>
          ) : null}

          {isConfirmingCancel ? (
            <section
              aria-labelledby="cancel-period-title"
              className={styles.confirmation}
              ref={cancelConfirmationRef}
              tabIndex={-1}
            >
              <h3 id="cancel-period-title">
                {hasScheduleHistory
                  ? '등록된 일정과 신청 기간을 모두 취소할까요?'
                  : '신청 기간을 취소할까요?'}
              </h3>
              <p className={styles.meta}>
                {hasScheduleHistory
                  ? '등록된 일정, 배정, 구성원 신청이 모두 삭제되며 되돌릴 수 없습니다.'
                  : '기존 구성원 신청이 모두 삭제되며 되돌릴 수 없습니다.'}
              </p>
              <form action={cancelAction} noValidate>
                <input
                  name="payload"
                  type="hidden"
                  value={JSON.stringify({
                    expectedPeriodUpdatedAt: period.updatedAt,
                    periodId: period.id,
                    requestId: cancelRequestId,
                  })}
                />
                <div className={layout.wrap}>
                  <Button disabled={isBusy} type="submit">
                    {isCancelling ? '취소 중…' : '일정 취소 확정'}
                  </Button>
                  <Button
                    disabled={isBusy}
                    variant="secondary"
                    onClick={() => {
                      setIsConfirmingCancel(false)
                      queueMicrotask(() => cancelTriggerRef.current?.focus())
                    }}
                  >
                    유지하기
                  </Button>
                </div>
              </form>
            </section>
          ) : (
            <Button
              disabled={isBusy}
              ref={cancelTriggerRef}
              variant="secondary"
              onClick={() => {
                setCancelRequestId(crypto.randomUUID())
                setIsConfirmingCancel(true)
              }}
            >
              일정 취소 하기
            </Button>
          )}

          {cancelState ? (
            <div
              className={cancelState.ok ? styles.saveMessage : styles.errorMessage}
              role={cancelState.ok ? 'status' : 'alert'}
            >
              <p>{cancelState.message}</p>
              {!cancelState.ok &&
              (cancelState.code === 'STALE_PERIOD' ||
                cancelState.code === 'PERIOD_HAS_PAYROLL_HISTORY') ? (
                <Button variant="secondary" onClick={() => router.refresh()}>
                  최신 상태 다시 불러오기
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </ContentCard>
  )
}
