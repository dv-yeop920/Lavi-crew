'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'

import { saveWorkerMonthlyApplicationsAction } from '@/features/schedule/actions/schedule-actions'
import { useDirtyNavigationGuard } from '@/features/schedule/hooks/use-dirty-navigation-guard'
import type { WorkerMonthApplicationViewModel } from '@/features/schedule/schemas/schedule-view-model'
import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import { getDaysInMonth, getLeadingBlankCount, getWeekendType, isWeekend } from '../lib/calendar'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

type ScheduleApplicationViewProps = {
  requestId: string
  viewModel: WorkerMonthApplicationViewModel
}

function formatMonthValue(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

function formatDateValue(month: string, day: number) {
  return `${month}-${String(day).padStart(2, '0')}`
}

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: 'long',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value))
}

function formatSelectedDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    weekday: 'long',
  }).format(new Date(`${value}T00:00:00Z`))
}

function areSelectionsEqual(first: Set<string>, second: string[]) {
  return first.size === second.length && second.every((date) => first.has(date))
}

export function ScheduleApplicationView({
  requestId: initialRequestId,
  viewModel,
}: ScheduleApplicationViewProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(saveWorkerMonthlyApplicationsAction, null)
  const [selectedDates, setSelectedDates] = useState(() => new Set(viewModel.selectedDates))
  const [savedDates, setSavedDates] = useState(viewModel.selectedDates)
  const [requestId, setRequestId] = useState(initialRequestId)
  const renderedMonthRef = useRef(viewModel.month)
  const [year, monthNumber] = viewModel.month.split('-').map(Number)
  const monthIndex = monthNumber - 1
  const monthLabel = `${year}년 ${monthNumber}월`
  const period = viewModel.period
  const canEdit = period?.status === 'open'
  const isDirty = !areSelectionsEqual(selectedDates, savedDates)
  const { navigate } = useDirtyNavigationGuard({
    confirmationMessage: '저장하지 않은 신청 변경이 있습니다. 이동할까요?',
    isDirty,
  })
  const selectedDateList = [...selectedDates].sort()
  const days = Array.from({ length: getDaysInMonth(year, monthIndex) }, (_, index) => index + 1)
  const firstWeekday = getLeadingBlankCount(year, monthIndex)

  useEffect(() => {
    if (renderedMonthRef.current === viewModel.month) return
    renderedMonthRef.current = viewModel.month
    const nextDates = new Set(viewModel.selectedDates)
    queueMicrotask(() => {
      setSelectedDates(nextDates)
      setSavedDates(viewModel.selectedDates)
      setRequestId(initialRequestId)
    })
  }, [initialRequestId, viewModel.month, viewModel.selectedDates])

  useEffect(() => {
    if (!state?.ok || !state.data) return
    const persistedDates = [...state.data.selectedDates].sort()
    queueMicrotask(() => {
      setSelectedDates(new Set(persistedDates))
      setSavedDates(persistedDates)
      setRequestId(crypto.randomUUID())
    })
  }, [state])

  function updateSelection(update: (next: Set<string>) => void) {
    setSelectedDates((current) => {
      const next = new Set(current)
      update(next)
      return next
    })
    setRequestId(crypto.randomUUID())
  }

  function toggleDate(date: string) {
    if (!canEdit) return
    updateSelection((next) => {
      if (next.has(date)) next.delete(date)
      else next.add(date)
    })
  }

  function moveMonth(offset: number) {
    const nextMonth = new Date(year, monthIndex + offset, 1)
    navigate(
      `/schedule/apply?month=${formatMonthValue(nextMonth.getFullYear(), nextMonth.getMonth())}`,
    )
  }

  const payload =
    period &&
    JSON.stringify({
      expectedPeriodUpdatedAt: period.updatedAt,
      month: viewModel.month,
      periodId: period.id,
      requestId,
      selectedDates: selectedDateList,
    })
  const fieldError = state?.ok ? undefined : state?.fieldErrors?.selectedDates?.[0]
  const statusLabel = !period
    ? '신청 준비 중'
    : period.status === 'open'
      ? '신청 중'
      : period.closedReason === 'manual'
        ? '관리자 마감'
        : '신청 마감'

  return (
    <form action={formAction} className={layout.page} aria-busy={isPending} noValidate>
      {payload ? <input name="payload" type="hidden" value={payload} /> : null}
      <PageHeader
        eyebrow={`${monthNumber}월 일정 신청`}
        title="근무 가능한 날을 선택하세요"
        description="월별 주말 가능일을 선택해 한 번에 저장하고, 마감 전에는 다시 변경할 수 있어요."
      />

      <ContentCard>
        <div className={styles.monthNavigator}>
          <button
            aria-label="이전 달 보기"
            className={styles.monthArrowButton}
            type="button"
            onClick={() => moveMonth(-1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <strong aria-live="polite">{monthLabel}</strong>
          <button
            aria-label="다음 달 보기"
            className={styles.monthArrowButton}
            type="button"
            onClick={() => moveMonth(1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className={layout.row}>
          <span className={styles.meta}>
            {period
              ? `신청 마감 · ${formatDeadline(period.applicationDeadline)}`
              : '신청 기간 미설정'}
          </span>
          <StatusBadge tone={period?.status === 'open' ? 'positive' : 'neutral'}>
            {statusLabel}
          </StatusBadge>
        </div>
        {!period ? (
          <p className={styles.emptyState}>
            관리자가 아직 이 달의 신청 기간을 열지 않았습니다. 기간이 열리면 주말을 선택할 수
            있어요.
          </p>
        ) : null}
        <div
          className={`${styles.calendar} ${styles.applicationCalendar}`}
          aria-label={`${monthLabel} 일정 신청 달력`}
        >
          {weekdays.map((weekday, weekdayIndex) => (
            <span
              className={styles.weekday}
              data-weekday={
                weekdayIndex === 0 ? 'sunday' : weekdayIndex === 6 ? 'saturday' : undefined
              }
              key={weekday}
              aria-hidden="true"
            >
              {weekday}
            </span>
          ))}
          {Array.from({ length: firstWeekday }, (_, index) => (
            <span className={styles.blankDay} key={`blank-${index}`} aria-hidden="true" />
          ))}
          {days.map((day) => {
            const date = formatDateValue(viewModel.month, day)
            const weekend = isWeekend(year, monthIndex, day)
            const selected = selectedDates.has(date)
            const stateLabel = !weekend
              ? ''
              : !period
                ? ' 신청 기간 미설정'
                : !canEdit
                  ? selected
                    ? ' 신청 완료, 변경 불가'
                    : ' 신청 마감'
                  : selected
                    ? ' 신청 취소'
                    : ' 신청'
            return (
              <button
                aria-label={`${monthNumber}월 ${day}일${stateLabel}`}
                aria-pressed={weekend ? selected : undefined}
                className={styles.day}
                data-weekday={getWeekendType(year, monthIndex, day)}
                disabled={!weekend || !canEdit || isPending}
                key={date}
                type="button"
                onClick={() => toggleDate(date)}
              >
                {day}
              </button>
            )
          })}
        </div>
      </ContentCard>

      <ContentCard>
        <div className={layout.row}>
          <strong>신청한 날짜</strong>
          <StatusBadge tone="accent">{selectedDates.size}일</StatusBadge>
        </div>
        {selectedDateList.length > 0 ? (
          <ul className={styles.applicationList} aria-label="신청한 근무 날짜">
            {selectedDateList.map((date) => (
              <li className={styles.applicationItem} key={date}>
                <div className={styles.detail}>
                  <span>{formatSelectedDate(date)}</span>
                </div>
                {canEdit ? (
                  <Button
                    aria-label={`${formatSelectedDate(date)} 신청 취소`}
                    disabled={isPending}
                    variant="secondary"
                    onClick={() => toggleDate(date)}
                  >
                    신청 취소
                  </Button>
                ) : (
                  <StatusBadge tone="neutral">변경 불가</StatusBadge>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>신청한 날짜가 없습니다.</p>
        )}
      </ContentCard>

      {state ? (
        <div
          className={state.ok ? styles.saveMessage : styles.errorMessage}
          role={state.ok ? 'status' : 'alert'}
        >
          <p>{state.message}</p>
          {fieldError ? <p>{fieldError}</p> : null}
          {!state.ok &&
          (state.code === 'STALE_PERIOD' ||
            state.code === 'APPLICATION_PERIOD_CLOSED' ||
            state.code === 'PERIOD_NOT_FOUND') ? (
            <Button variant="secondary" onClick={() => router.refresh()}>
              최신 상태 다시 불러오기
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className={layout.stack} aria-live="polite">
        <p>
          선택한 날짜 <strong>{selectedDates.size}일</strong>
          {isPending
            ? ' · 저장 중입니다.'
            : isDirty
              ? ' · 저장되지 않은 변경이 있습니다.'
              : ' · 저장된 상태입니다.'}
        </p>
        <Button disabled={!period || !canEdit || !isDirty || isPending} type="submit">
          {isPending ? '저장 중…' : isDirty ? '신청 변경 저장' : '신청 변경 없음'}
        </Button>
      </div>
    </form>
  )
}
