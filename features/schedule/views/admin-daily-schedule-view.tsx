'use client'

import { useState } from 'react'

import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import {
  createDefaultPositionAssignments,
  type PositionAssignment,
  ScheduleAssignmentTable,
} from '../components/schedule-assignment-table'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

type DailyScheduleDraft = {
  ceremonyCount: number
  endTime: string
  positions: PositionAssignment[]
  startTime: string
}

function createDailyScheduleDraft(date: string): DailyScheduleDraft {
  return {
    ceremonyCount: 5,
    endTime: '18:00',
    positions: createDefaultPositionAssignments(date),
    startTime: '09:00',
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export function AdminDailyScheduleView({ date }: { date: string }) {
  const [schedule, setSchedule] = useState(() => createDailyScheduleDraft(date))
  const [isEditingSchedule, setIsEditingSchedule] = useState(false)
  const [isCancellingSchedule, setIsCancellingSchedule] = useState(false)
  const [isScheduleCancelled, setIsScheduleCancelled] = useState(false)
  const [scheduleMessage, setScheduleMessage] = useState('')

  function updateSchedule(changes: Partial<DailyScheduleDraft>) {
    setSchedule((current) => ({ ...current, ...changes }))
    setScheduleMessage('')
  }

  function updateWorker(positionId: string, personIndex: number, workerId: string) {
    setSchedule((current) => ({
      ...current,
      positions: current.positions.map((position) => {
        if (position.id !== positionId) return position
        const assignedWorkerIds = [...position.assignedWorkerIds]
        assignedWorkerIds[personIndex] = workerId
        return { ...position, assignedWorkerIds }
      }),
    }))
    setScheduleMessage('')
  }

  function addPerson(positionId: string) {
    setSchedule((current) => ({
      ...current,
      positions: current.positions.map((position) =>
        position.id === positionId && position.assignedWorkerIds.length < 3
          ? {
              ...position,
              assignedWorkerIds: [...position.assignedWorkerIds, ''],
              trainingFlags: [...position.trainingFlags, false],
            }
          : position,
      ),
    }))
    setScheduleMessage('')
  }

  function removePerson(positionId: string, personIndex: number) {
    setSchedule((current) => ({
      ...current,
      positions: current.positions.map((position) =>
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
    }))
    setScheduleMessage('')
  }

  function toggleTraining(positionId: string, personIndex: number, isTraining: boolean) {
    setSchedule((current) => ({
      ...current,
      positions: current.positions.map((position) => {
        if (position.id !== positionId) return position
        const trainingFlags = [...position.trainingFlags]
        trainingFlags[personIndex] = isTraining
        return { ...position, trainingFlags }
      }),
    }))
    setScheduleMessage('')
  }

  function saveSchedule() {
    const hasEmptyAssignment = schedule.positions.some((position) =>
      position.assignedWorkerIds.some((workerId) => !workerId),
    )

    if (hasEmptyAssignment) {
      setScheduleMessage('선택되지 않은 배정 인원이 있습니다.')
      return
    }

    setIsEditingSchedule(false)
    setScheduleMessage('일정과 인원 배정을 수정했습니다.')
  }

  function cancelScheduleEdit() {
    setSchedule(createDailyScheduleDraft(date))
    setIsEditingSchedule(false)
    setScheduleMessage('')
  }

  function cancelSchedule() {
    setIsScheduleCancelled(true)
    setIsCancellingSchedule(false)
    setScheduleMessage('일정을 취소했습니다. 현재는 클라이언트 데모입니다.')
  }

  return (
    <div className={layout.page}>
      <PageHeader
        backHref="/admin/schedules"
        backLabel="일정으로 돌아가기"
        eyebrow="일별 일정 관리"
        title={formatDate(date)}
        description="등록한 스케줄과 배정 내용을 조회하고 수정합니다."
      />

      <ContentCard>
        <div className={layout.row}>
          <div className={styles.detail}>
            <strong>등록 스케줄</strong>
            <span className={styles.meta}>배정된 포지션과 인원을 확인하세요.</span>
          </div>
          {isScheduleCancelled ? (
            <StatusBadge tone="neutral">취소됨</StatusBadge>
          ) : isEditingSchedule ? (
            <StatusBadge tone="warning">수정 중</StatusBadge>
          ) : (
            <Button variant="secondary" onClick={() => setIsEditingSchedule(true)}>
              수정
            </Button>
          )}
        </div>

        <div className={styles.scheduleInfoGrid}>
          <label className={styles.fieldLabel}>
            <span>예식 개수</span>
            <input
              className={styles.compactInput}
              min="0"
              readOnly={!isEditingSchedule}
              type="number"
              value={schedule.ceremonyCount}
              onChange={(event) => updateSchedule({ ceremonyCount: Number(event.target.value) })}
            />
          </label>
          <label className={styles.fieldLabel}>
            <span>근무 시작</span>
            <input
              className={styles.compactInput}
              readOnly={!isEditingSchedule}
              type="time"
              value={schedule.startTime}
              onChange={(event) => updateSchedule({ startTime: event.target.value })}
            />
          </label>
          <label className={styles.fieldLabel}>
            <span>근무 종료</span>
            <input
              className={styles.compactInput}
              readOnly={!isEditingSchedule}
              type="time"
              value={schedule.endTime}
              onChange={(event) => updateSchedule({ endTime: event.target.value })}
            />
          </label>
        </div>

        <ScheduleAssignmentTable
          isEditing={isEditingSchedule}
          positions={schedule.positions}
          onAddPerson={addPerson}
          onRemovePerson={removePerson}
          onToggleTraining={toggleTraining}
          onUpdateWorker={updateWorker}
        />

        {isScheduleCancelled ? null : isEditingSchedule ? (
          <div className={layout.wrap}>
            <Button onClick={saveSchedule}>수정 저장</Button>
            <Button variant="secondary" onClick={cancelScheduleEdit}>
              취소
            </Button>
          </div>
        ) : (
          <div className={layout.wrap}>
            <Button variant="secondary" onClick={() => setIsCancellingSchedule(true)}>
              일정 취소
            </Button>
          </div>
        )}
        {scheduleMessage ? (
          <p className={styles.saveMessage} role="status">
            {scheduleMessage}
          </p>
        ) : null}
      </ContentCard>
      {isCancellingSchedule ? (
        <section className={styles.confirmation} aria-labelledby="cancel-schedule-title">
          <strong id="cancel-schedule-title">이 일정을 취소할까요?</strong>
          <p>확정 배정은 삭제하지 않고 취소 상태로 보존되며 대상 알바에게 알림이 필요합니다.</p>
          <div className={layout.wrap}>
            <Button onClick={cancelSchedule}>일정 취소 확인</Button>
            <Button variant="secondary" onClick={() => setIsCancellingSchedule(false)}>
              돌아가기
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
