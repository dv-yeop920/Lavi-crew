'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useRef, useState } from 'react'

import { saveMonthlyScheduleRegistrationAction } from '@/features/schedule/actions/schedule-actions'
import { createRegistrationSummary } from '@/features/schedule/domain/monthly-registration'
import { useDirtyNavigationGuard } from '@/features/schedule/hooks/use-dirty-navigation-guard'
import {
  canPublishMonthlySchedule,
  getStoredApplicationDeadline,
} from '@/features/schedule/lib/application-period'
import { reconcileDateDrafts } from '@/features/schedule/lib/draft-reconciliation'
import type {
  AssignmentWorkerOption,
  MonthRegistrationViewModel,
} from '@/features/schedule/schemas/schedule-view-model'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import { RegisteredScheduleCard } from '../components/registered-schedule-card'
import {
  createDefaultPositionAssignments,
  type PositionAssignment,
  ScheduleAssignmentTable,
} from '../components/schedule-assignment-table'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

type ScheduleDraft = {
  ceremonyCount: number
  date: string
  endTime: string
  isEnabled: boolean
  positions: PositionAssignment[]
  startTime: string
}

type AdminScheduleRegistrationViewProps = {
  requestId: string
  viewModel: MonthRegistrationViewModel
}

function createDraft(date: string): ScheduleDraft {
  return {
    ceremonyCount: 1,
    date,
    endTime: '18:00',
    isEnabled: false,
    positions: createDefaultPositionAssignments(),
    startTime: '09:00',
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date(`${date}T00:00:00`))
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return `${year}년 ${monthNumber}월`
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return '신청 기간이 설정되지 않았습니다.'
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
    hour12: false,
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(deadline))
}

export function AdminScheduleRegistrationView({
  requestId,
  viewModel,
}: AdminScheduleRegistrationViewProps) {
  const router = useRouter()
  const { month, period, registeredSchedules, unregisteredWeekendDates, workers } = viewModel
  const storedDeadline = getStoredApplicationDeadline(period.applicationDeadline)
  const [drafts, setDrafts] = useState(() => unregisteredWeekendDates.map(createDraft))
  const [isConfirming, setIsConfirming] = useState(false)
  const [state, formAction, isPending] = useActionState(saveMonthlyScheduleRegistrationAction, null)
  const confirmationTitleRef = useRef<HTMLHeadingElement>(null)
  const reviewButtonRef = useRef<HTMLButtonElement>(null)
  const monthLabel = formatMonth(month)
  const enabledDrafts = drafts.filter((draft) => draft.isEnabled)
  const isDirty = enabledDrafts.length > 0
  const canPublish = canPublishMonthlySchedule(period)
  const { navigate } = useDirtyNavigationGuard({
    confirmationMessage: '작성 중인 일정이 있습니다. 저장하지 않고 이동할까요?',
    isDirty: isDirty && !state?.ok,
  })

  useEffect(() => {
    if (!state?.ok) return
    navigate(`/admin/schedules?month=${month}`, true)
  }, [month, navigate, state?.ok])

  useEffect(() => {
    if (isConfirming) confirmationTitleRef.current?.focus()
  }, [isConfirming])

  useEffect(() => {
    let isCancelled = false
    queueMicrotask(() => {
      if (isCancelled) return
      setDrafts((current) => reconcileDateDrafts(current, unregisteredWeekendDates, createDraft))
    })
    return () => {
      isCancelled = true
    }
  }, [unregisteredWeekendDates])

  function updateDraft(date: string, changes: Partial<ScheduleDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.date === date ? { ...draft, ...changes } : draft)),
    )
  }

  function updatePositions(
    date: string,
    positionId: string,
    update: (position: PositionAssignment) => PositionAssignment,
  ) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.date === date
          ? {
              ...draft,
              positions: draft.positions.map((position) =>
                position.id === positionId ? update(position) : position,
              ),
            }
          : draft,
      ),
    )
  }

  function updateWorker(date: string, positionId: string, index: number, workerId: string) {
    updatePositions(date, positionId, (position) => {
      const assignedWorkerIds = [...position.assignedWorkerIds]
      assignedWorkerIds[index] = workerId
      return { ...position, assignedWorkerIds }
    })
  }

  function toggleTraining(date: string, positionId: string, index: number, value: boolean) {
    updatePositions(date, positionId, (position) => {
      const trainingFlags = [...position.trainingFlags]
      trainingFlags[index] = value
      return { ...position, trainingFlags }
    })
  }

  function addTrainingWorker(date: string, positionId: string) {
    updatePositions(date, positionId, (position) =>
      position.assignedWorkerIds.length < position.minimumAssigneeCount + 1
        ? {
            ...position,
            assignedWorkerIds: [...position.assignedWorkerIds, ''],
            trainingFlags: [...position.trainingFlags, true],
          }
        : position,
    )
  }

  function removeTrainingWorker(date: string, positionId: string, index: number) {
    updatePositions(date, positionId, (position) =>
      index >= position.minimumAssigneeCount
        ? {
            ...position,
            assignedWorkerIds: position.assignedWorkerIds.filter(
              (_, personIndex) => personIndex !== index,
            ),
            trainingFlags: position.trainingFlags.filter((_, personIndex) => personIndex !== index),
          }
        : position,
    )
  }

  const payload = {
    applicationDeadlineDate: storedDeadline.date,
    applicationDeadlineTime: storedDeadline.time,
    expectedPeriodUpdatedAt: period.updatedAt,
    month,
    requestId,
    schedules: enabledDrafts.map((draft) => ({
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
      startTime: draft.startTime,
      workDate: draft.date,
    })),
  }
  const summary = createRegistrationSummary(payload.schedules)
  const fieldErrors = state?.ok ? undefined : state?.fieldErrors
  const errorEntries = Object.entries(fieldErrors ?? {}).flatMap(([path, messages]) =>
    (messages ?? []).map((message) => ({ message, path })),
  )

  return (
    <form action={formAction} className={layout.page} aria-busy={isPending} noValidate>
      <input name="payload" type="hidden" value={JSON.stringify(payload)} />
      <PageHeader
        backHref="/admin/schedules"
        backLabel="일정 달력으로 돌아가기"
        eyebrow="월별 스케줄 등록"
        title={`${monthLabel} 일정 등록`}
      />

      <ContentCard>
        <div className={layout.row}>
          <strong>{monthLabel} 스케줄 신청 마감일</strong>
          <StatusBadge tone={period.status === 'closed' ? 'neutral' : 'accent'}>
            {period.status === 'closed' ? '마감됨' : '신청 중'}
          </StatusBadge>
        </div>
        <p>
          <strong>{formatDeadline(period.applicationDeadline)}</strong>
        </p>
        {canPublish ? (
          <p className={styles.meta}>저장된 마감 정보입니다. 일정 등록에서는 변경할 수 없습니다.</p>
        ) : (
          <div className={styles.errorMessage} role="status">
            <p>
              {period.id
                ? '신청 기간을 마감한 뒤 일정을 등록할 수 있습니다.'
                : '먼저 신청 기간과 마감 시각을 설정해 주세요.'}
            </p>
            <Button variant="secondary" onClick={() => navigate(`/admin/schedules?month=${month}`)}>
              신청 기간 운영으로 이동
            </Button>
          </div>
        )}
      </ContentCard>

      {registeredSchedules.length > 0 ? (
        <section className={layout.stack} aria-labelledby="registered-month-schedules">
          <h2 id="registered-month-schedules">등록된 일정</h2>
          <ul className={layout.list}>
            {registeredSchedules.map((schedule) => (
              <li key={schedule.date}>
                <RegisteredScheduleCard {...schedule} dateLabel={formatDate(schedule.date)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={layout.stack} aria-labelledby="unregistered-schedule-dates">
        <div className={layout.row}>
          <h2 id="unregistered-schedule-dates">미등록 날짜</h2>
          <StatusBadge tone="neutral">{unregisteredWeekendDates.length}일</StatusBadge>
        </div>
        {drafts.length ? (
          drafts.map((draft) => {
            const schedulePath = `dates.${draft.date}`
            const ceremonyError = getFirstFieldError(fieldErrors, `${schedulePath}.ceremonyCount`)
            const startTimeError = getFirstFieldError(fieldErrors, `${schedulePath}.startTime`)
            const endTimeError = getFirstFieldError(fieldErrors, `${schedulePath}.endTime`)
            const dateError = getFirstFieldError(fieldErrors, `${schedulePath}.workDate`)
            return (
              <ContentCard key={draft.date}>
                <section aria-labelledby={`schedule-${draft.date}`}>
                  <div className={layout.row}>
                    <h3 id={`schedule-${draft.date}`}>{formatDate(draft.date)}</h3>
                    {draft.isEnabled ? (
                      <StatusBadge tone="warning">작성 중</StatusBadge>
                    ) : (
                      <Button
                        disabled={!canPublish}
                        variant="secondary"
                        onClick={() => updateDraft(draft.date, { isEnabled: true })}
                      >
                        일정 설정
                      </Button>
                    )}
                  </div>
                  {dateError ? (
                    <p className={styles.fieldError} role="alert">
                      {dateError}
                    </p>
                  ) : null}
                  {draft.isEnabled ? (
                    <>
                      <div className={styles.scheduleInfoGrid}>
                        <label className={styles.fieldLabel}>
                          <span>예식 개수</span>
                          <input
                            required
                            aria-describedby={
                              ceremonyError ? `${draft.date}-ceremony-error` : undefined
                            }
                            aria-invalid={ceremonyError ? true : undefined}
                            className={styles.compactInput}
                            min="1"
                            type="number"
                            value={draft.ceremonyCount}
                            onChange={(event) =>
                              updateDraft(draft.date, {
                                ceremonyCount: Number(event.target.value),
                              })
                            }
                          />
                          {ceremonyError ? (
                            <span className={styles.fieldError} id={`${draft.date}-ceremony-error`}>
                              {ceremonyError}
                            </span>
                          ) : null}
                        </label>
                        <label className={styles.fieldLabel}>
                          <span>근무 시작</span>
                          <input
                            required
                            aria-describedby={
                              startTimeError ? `${draft.date}-start-time-error` : undefined
                            }
                            aria-invalid={startTimeError ? true : undefined}
                            className={styles.compactInput}
                            type="time"
                            value={draft.startTime}
                            onChange={(event) =>
                              updateDraft(draft.date, { startTime: event.target.value })
                            }
                          />
                          {startTimeError ? (
                            <span
                              className={styles.fieldError}
                              id={`${draft.date}-start-time-error`}
                            >
                              {startTimeError}
                            </span>
                          ) : null}
                        </label>
                        <label className={styles.fieldLabel}>
                          <span>근무 종료</span>
                          <input
                            required
                            aria-describedby={
                              endTimeError ? `${draft.date}-end-time-error` : undefined
                            }
                            aria-invalid={endTimeError ? true : undefined}
                            className={styles.compactInput}
                            type="time"
                            value={draft.endTime}
                            onChange={(event) =>
                              updateDraft(draft.date, { endTime: event.target.value })
                            }
                          />
                          {endTimeError ? (
                            <span className={styles.fieldError} id={`${draft.date}-end-time-error`}>
                              {endTimeError}
                            </span>
                          ) : null}
                        </label>
                      </div>
                      <ScheduleAssignmentTable
                        getWorkerError={(positionId, personIndex) => {
                          return (
                            getFirstFieldError(
                              fieldErrors,
                              `${schedulePath}.positions.${positionId}.slots.${personIndex}.workerId`,
                            ) ??
                            getFirstFieldError(
                              fieldErrors,
                              `${schedulePath}.positions.${positionId}`,
                            )
                          )
                        }}
                        positions={draft.positions}
                        selectedDate={draft.date}
                        workers={workers satisfies AssignmentWorkerOption[]}
                        onAddPerson={(positionId) => addTrainingWorker(draft.date, positionId)}
                        onRemovePerson={(positionId, index) =>
                          removeTrainingWorker(draft.date, positionId, index)
                        }
                        onToggleTraining={(positionId, index, value) =>
                          toggleTraining(draft.date, positionId, index, value)
                        }
                        onUpdateWorker={(positionId, index, workerId) =>
                          updateWorker(draft.date, positionId, index, workerId)
                        }
                      />
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setDrafts((current) =>
                            current.map((item) =>
                              item.date === draft.date ? createDraft(draft.date) : item,
                            ),
                          )
                        }
                      >
                        이 날짜 설정 취소
                      </Button>
                    </>
                  ) : null}
                </section>
              </ContentCard>
            )
          })
        ) : (
          <ContentCard>
            <p className={styles.emptyState}>이 달의 모든 주말 일정이 등록되어 있습니다.</p>
          </ContentCard>
        )}
      </section>

      {state ? (
        <div
          className={state.ok ? styles.saveMessage : styles.errorMessage}
          role={state.ok ? 'status' : 'alert'}
        >
          <p>{state.message}</p>
          {errorEntries.length > 0 ? (
            <ul>
              {errorEntries.map((error, index) => (
                <li key={`${error.path}-${index}`}>{error.message}</li>
              ))}
            </ul>
          ) : null}
          {!state.ok &&
          (state.code === 'STALE_PERIOD' ||
            state.code === 'DATE_ALREADY_REGISTERED' ||
            state.code === 'PERIOD_DEADLINE_MISMATCH' ||
            state.code === 'APPLICATION_PERIOD_OPEN') ? (
            <Button variant="secondary" onClick={() => router.refresh()}>
              최신 상태 다시 불러오기
            </Button>
          ) : null}
        </div>
      ) : null}
      {drafts.length > 0 && !isConfirming ? (
        <Button
          ref={reviewButtonRef}
          disabled={!canPublish || enabledDrafts.length === 0 || isPending}
          onClick={() => setIsConfirming(true)}
        >
          최종 저장 내용 확인
        </Button>
      ) : null}
      {isConfirming ? (
        <section className={styles.confirmation} aria-labelledby="registration-confirmation-title">
          <h2 id="registration-confirmation-title" ref={confirmationTitleRef} tabIndex={-1}>
            일정과 배정을 확정할까요?
          </h2>
          <p>
            {summary.dateCount}일 · 총 {summary.assignmentCount}명 · 교육 {summary.trainingCount}명
          </p>
          <p className={styles.meta}>저장 즉시 일정이 게시되고 배정이 확정됩니다.</p>
          <div className={layout.wrap}>
            <Button disabled={!canPublish || isPending} type="submit">
              {isPending ? '확정 중…' : `${summary.dateCount}일 일정 등록·배정 확정`}
            </Button>
            <Button
              disabled={isPending}
              variant="secondary"
              onClick={() => {
                setIsConfirming(false)
                requestAnimationFrame(() => reviewButtonRef.current?.focus())
              }}
            >
              취소
            </Button>
          </div>
        </section>
      ) : null}
    </form>
  )
}
