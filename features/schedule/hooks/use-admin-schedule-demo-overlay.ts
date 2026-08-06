'use client'

import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react'

import {
  createDefaultPositionAssignments,
  type PositionAssignment,
} from '../components/schedule-assignment-table'
import {
  buildDemoScheduleOverlayEntries,
  getDemoSchedulesForMonth,
  hasUnassignedDemoSchedulePosition,
} from '../domain/demo-schedule-overlay'
import type { MonthlyRegistrationInput } from '../schemas/monthly-registration'
import type { AssignmentWorkerOption } from '../schemas/schedule-view-model'

import { useDemoScheduleOverlay } from './use-demo-schedule-overlay'

export type ScheduleDraft = {
  ceremonyCount: number
  date: string
  endTime: string
  isEnabled: boolean
  positions: PositionAssignment[]
  startTime: string
}

type RegistrationSchedulePayload = Omit<
  MonthlyRegistrationInput['schedules'][number],
  'assignments'
> & {
  assignments: Omit<
    MonthlyRegistrationInput['schedules'][number]['assignments'][number],
    'slotKind'
  >[]
}

type UseAdminScheduleDemoOverlayOptions = {
  demoEnabled: boolean
  editDemoDate?: string
  month: string
  registeredScheduleDates: string[]
  setDrafts: Dispatch<SetStateAction<ScheduleDraft[]>>
  unregisteredWeekendDates: string[]
  workers: AssignmentWorkerOption[]
}

/**
 * 관리자 일정 등록 화면의 브라우저 전용 데모 오버레이(포트폴리오 시연용 로컬스토리지 저장)를
 * 다룬다. 이달의 데모 일정 파생 계산, 편집 대상 날짜로 진입했을 때의 초안 프리필,
 * 데모 일정 저장(handleSaveDemoOverlay에 있던 조립 로직)을 담당한다.
 */
export function useAdminScheduleDemoOverlay({
  demoEnabled,
  editDemoDate,
  month,
  registeredScheduleDates,
  setDrafts,
  unregisteredWeekendDates,
  workers,
}: UseAdminScheduleDemoOverlayOptions) {
  const { document: demoDocument, save: saveDemoSchedules } = useDemoScheduleOverlay(demoEnabled)
  const [demoSaveMessage, setDemoSaveMessage] = useState<string | null>(null)

  const demoSchedules = useMemo(
    () => getDemoSchedulesForMonth(demoDocument, month, registeredScheduleDates),
    [demoDocument, month, registeredScheduleDates],
  )

  const editableWeekendDates = useMemo(() => {
    const demoScheduleDates = new Set(demoSchedules.map((schedule) => schedule.date))
    return unregisteredWeekendDates.filter(
      (date) => !demoScheduleDates.has(date) || date === editDemoDate,
    )
  }, [demoSchedules, editDemoDate, unregisteredWeekendDates])

  useEffect(() => {
    if (!editDemoDate) return
    const schedule = demoSchedules.find((candidate) => candidate.date === editDemoDate)
    if (!schedule) return
    const positions = createDefaultPositionAssignments().map((position) => {
      const assignments = schedule.assignments
        .filter((assignment) => assignment.positionId === position.id)
        .sort((left, right) => left.slotIndex - right.slotIndex)
      return {
        ...position,
        assignedWorkerIds: assignments.map((assignment) => assignment.workerId),
        trainingFlags: assignments.map((assignment) => assignment.isTraining),
      }
    })
    let isCancelled = false
    queueMicrotask(() => {
      if (isCancelled) return
      setDrafts((current) =>
        current.map((draft) =>
          draft.date === editDemoDate
            ? {
                ceremonyCount: schedule.ceremonyCount,
                date: schedule.date,
                endTime: schedule.endTime,
                isEnabled: true,
                positions,
                startTime: schedule.startTime,
              }
            : draft,
        ),
      )
    })
    return () => {
      isCancelled = true
    }
  }, [demoSchedules, editDemoDate, setDrafts])

  function saveDemoOverlay(schedules: RegistrationSchedulePayload[]) {
    if (hasUnassignedDemoSchedulePosition(schedules)) {
      const message = '모든 필수 포지션의 배정 인원을 선택해 주세요.'
      setDemoSaveMessage(message)
      return { message, ok: false as const }
    }
    const workerNamesById = new Map(workers.map((worker) => [worker.id, worker.name]))
    const entries = buildDemoScheduleOverlayEntries(
      schedules,
      workerNamesById,
      new Date().toISOString(),
    )
    const result = saveDemoSchedules(entries)
    if (!result.ok) setDemoSaveMessage(result.message)
    return result
  }

  return {
    demoSaveMessage,
    demoSchedules,
    editableWeekendDates,
    saveDemoOverlay,
  }
}
