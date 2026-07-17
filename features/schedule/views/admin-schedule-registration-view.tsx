'use client'

import { useState } from 'react'

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
import { registeredSchedules } from '../lib/schedule-fixtures'

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
  dates: string[]
  month: string
}

function createDraft(date: string): ScheduleDraft {
  return {
    ceremonyCount: 5,
    date,
    endTime: '18:00',
    isEnabled: false,
    positions: createDefaultPositionAssignments(date),
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

function getDefaultDeadlineDate(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const deadline = new Date(year, monthNumber - 2, 25)
  return `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-25`
}

export function AdminScheduleRegistrationView({
  dates,
  month,
}: AdminScheduleRegistrationViewProps) {
  const [drafts, setDrafts] = useState(() => dates.map(createDraft))
  const [deadlineDate, setDeadlineDate] = useState(() => getDefaultDeadlineDate(month))
  const [deadlineTime, setDeadlineTime] = useState('18:00')
  const [isApplicationClosed, setIsApplicationClosed] = useState(false)
  const [deadlineMessage, setDeadlineMessage] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const monthLabel = formatMonth(month)
  const monthSchedules = registeredSchedules.filter((schedule) => schedule.date.startsWith(month))
  const enabledDrafts = drafts.filter((draft) => draft.isEnabled)

  function updateDraft(date: string, changes: Partial<ScheduleDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.date === date ? { ...draft, ...changes } : draft)),
    )
    setSaveMessage('')
  }

  function updateWorker(date: string, positionId: string, personIndex: number, workerId: string) {
    setDrafts((current) =>
      current.map((draft) => {
        if (draft.date !== date) return draft
        return {
          ...draft,
          positions: draft.positions.map((position) => {
            if (position.id !== positionId) return position
            const assignedWorkerIds = [...position.assignedWorkerIds]
            assignedWorkerIds[personIndex] = workerId
            return { ...position, assignedWorkerIds }
          }),
        }
      }),
    )
    setSaveMessage('')
  }

  function addPerson(date: string, positionId: string) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.date === date
          ? {
              ...draft,
              positions: draft.positions.map((position) =>
                position.id === positionId && position.assignedWorkerIds.length < 3
                  ? {
                      ...position,
                      assignedWorkerIds: [...position.assignedWorkerIds, ''],
                      trainingFlags: [...position.trainingFlags, false],
                    }
                  : position,
              ),
            }
          : draft,
      ),
    )
    setSaveMessage('')
  }

  function removePerson(date: string, positionId: string, personIndex: number) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.date === date
          ? {
              ...draft,
              positions: draft.positions.map((position) =>
                position.id === positionId && personIndex >= position.minimumAssigneeCount
                  ? {
                      ...position,
                      assignedWorkerIds: position.assignedWorkerIds.filter(
                        (_, index) => index !== personIndex,
                      ),
                      trainingFlags: position.trainingFlags.filter(
                        (_, index) => index !== personIndex,
                      ),
                    }
                  : position,
              ),
            }
          : draft,
      ),
    )
    setSaveMessage('')
  }

  function resetDraft(date: string) {
    setDrafts((current) =>
      current.map((draft) => (draft.date === date ? createDraft(date) : draft)),
    )
    setSaveMessage('')
  }

  function toggleTraining(
    date: string,
    positionId: string,
    personIndex: number,
    isTraining: boolean,
  ) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.date === date
          ? {
              ...draft,
              positions: draft.positions.map((position) => {
                if (position.id !== positionId) return position
                const trainingFlags = [...position.trainingFlags]
                trainingFlags[personIndex] = isTraining
                return { ...position, trainingFlags }
              }),
            }
          : draft,
      ),
    )
    setSaveMessage('')
  }

  function saveDeadline() {
    setDeadlineMessage(
      `${monthLabel} 신청 마감일을 ${deadlineDate} ${deadlineTime}으로 설정했습니다.`,
    )
  }

  function toggleApplicationClosed() {
    const nextIsClosed = !isApplicationClosed
    setIsApplicationClosed(nextIsClosed)
    setDeadlineMessage(
      nextIsClosed
        ? `${monthLabel} 스케줄 신청을 지금 마감했습니다.`
        : `${monthLabel} 스케줄 신청을 다시 열었습니다.`,
    )
  }

  function saveSchedules() {
    const hasEmptyAssignment = enabledDrafts.some((draft) =>
      draft.positions.some((position) => position.assignedWorkerIds.some((workerId) => !workerId)),
    )

    setSaveMessage(
      hasEmptyAssignment
        ? '선택되지 않은 배정 인원이 있습니다.'
        : `${enabledDrafts.length}일의 스케줄과 인원 배정을 저장했습니다.`,
    )
  }

  return (
    <div className={layout.page}>
      <PageHeader
        backHref="/admin/schedules"
        backLabel="일정 달력으로 돌아가기"
        eyebrow="월별 스케줄 등록"
        title={`${monthLabel} 일정 등록`}
      />

      <ContentCard>
        <div className={layout.row}>
          <div className={styles.detail}>
            <strong>{monthLabel} 스케줄 신청 마감일</strong>
            <span className={styles.meta}>해당 월 전체 신청에 한 번 적용됩니다.</span>
          </div>
          <StatusBadge tone={isApplicationClosed ? 'neutral' : 'accent'}>
            {isApplicationClosed ? '마감됨' : '월 전체'}
          </StatusBadge>
        </div>
        <div className={styles.deadlineGrid}>
          <label className={styles.fieldLabel}>
            <span>마감 날짜</span>
            <input
              className={styles.compactInput}
              type="date"
              value={deadlineDate}
              onChange={(event) => {
                setDeadlineDate(event.target.value)
                setDeadlineMessage('')
              }}
            />
          </label>
          <label className={styles.fieldLabel}>
            <span>마감 시간</span>
            <input
              className={styles.compactInput}
              type="time"
              value={deadlineTime}
              onChange={(event) => {
                setDeadlineTime(event.target.value)
                setDeadlineMessage('')
              }}
            />
          </label>
          <div className={layout.wrap}>
            <Button onClick={saveDeadline}>마감일 설정</Button>
            <Button variant="secondary" onClick={toggleApplicationClosed}>
              {isApplicationClosed ? '신청 다시 열기' : '지금 마감'}
            </Button>
          </div>
        </div>
        {deadlineMessage ? (
          <p className={styles.saveMessage} role="status">
            {deadlineMessage}
          </p>
        ) : null}
      </ContentCard>

      {monthSchedules.length > 0 ? (
        <section className={layout.stack} aria-labelledby="registered-month-schedules">
          <h2 id="registered-month-schedules">등록된 일정</h2>
          <ul className={layout.list}>
            {monthSchedules.map((schedule) => (
              <li key={schedule.date}>
                <RegisteredScheduleCard
                  assignedCount={schedule.assignedCount}
                  ceremonyCount={schedule.ceremonyCount}
                  date={schedule.date}
                  dateLabel={formatDate(schedule.date)}
                  time={schedule.time}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={layout.stack} aria-labelledby="unregistered-schedule-dates">
        <div className={layout.row}>
          <h2 id="unregistered-schedule-dates">미등록 날짜</h2>
          <StatusBadge tone="neutral">{dates.length}일</StatusBadge>
        </div>

        {drafts.length > 0 ? (
          drafts.map((draft) => (
            <ContentCard key={draft.date}>
              <div className={layout.row}>
                <div className={styles.detail}>
                  <h3>{formatDate(draft.date)}</h3>
                  <span className={styles.meta}>
                    {draft.isEnabled ? '일정 내용을 작성하고 있습니다.' : '등록된 일정이 없습니다.'}
                  </span>
                </div>
                {draft.isEnabled ? (
                  <StatusBadge tone="warning">작성 중</StatusBadge>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => updateDraft(draft.date, { isEnabled: true })}
                  >
                    일정 설정
                  </Button>
                )}
              </div>

              {draft.isEnabled ? (
                <>
                  <div className={styles.scheduleInfoGrid}>
                    <label className={styles.fieldLabel}>
                      <span>예식 개수</span>
                      <input
                        className={styles.compactInput}
                        min="0"
                        type="number"
                        value={draft.ceremonyCount}
                        onChange={(event) =>
                          updateDraft(draft.date, { ceremonyCount: Number(event.target.value) })
                        }
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      <span>근무 시작</span>
                      <input
                        className={styles.compactInput}
                        type="time"
                        value={draft.startTime}
                        onChange={(event) =>
                          updateDraft(draft.date, { startTime: event.target.value })
                        }
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      <span>근무 종료</span>
                      <input
                        className={styles.compactInput}
                        type="time"
                        value={draft.endTime}
                        onChange={(event) =>
                          updateDraft(draft.date, { endTime: event.target.value })
                        }
                      />
                    </label>
                  </div>

                  <p className={styles.meta}>
                    인원 목록에서 지난달 출근 횟수, 포지션별 횟수와 가능한 포지션을 함께 확인할 수
                    있습니다.
                  </p>
                  <ScheduleAssignmentTable
                    positions={draft.positions}
                    onAddPerson={(positionId) => addPerson(draft.date, positionId)}
                    onRemovePerson={(positionId, personIndex) =>
                      removePerson(draft.date, positionId, personIndex)
                    }
                    onToggleTraining={(positionId, personIndex, isTraining) =>
                      toggleTraining(draft.date, positionId, personIndex, isTraining)
                    }
                    onUpdateWorker={(positionId, personIndex, workerId) =>
                      updateWorker(draft.date, positionId, personIndex, workerId)
                    }
                  />
                  <Button variant="secondary" onClick={() => resetDraft(draft.date)}>
                    이 날짜 설정 취소
                  </Button>
                </>
              ) : null}
            </ContentCard>
          ))
        ) : (
          <ContentCard>
            <p className={styles.emptyState}>이 달의 모든 주말 일정이 등록되어 있습니다.</p>
          </ContentCard>
        )}
      </section>

      {drafts.length > 0 ? (
        <div className={layout.stack} aria-live="polite">
          {saveMessage ? <p className={styles.saveMessage}>{saveMessage}</p> : null}
          <Button disabled={enabledDrafts.length === 0} onClick={saveSchedules}>
            설정한 {enabledDrafts.length}일 일정 저장
          </Button>
        </div>
      ) : null}
    </div>
  )
}
