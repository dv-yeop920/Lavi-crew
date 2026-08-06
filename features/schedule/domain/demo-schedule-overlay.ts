import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'

export const DEMO_SCHEDULE_OVERLAY_VERSION = 1 as const

export type DemoScheduleOverlayAssignment = {
  isTraining: boolean
  positionId: PositionId
  positionName: string
  slotIndex: number
  workerId: string
  workerName: string
}

export type DemoScheduleOverlayEntry = {
  assignments: DemoScheduleOverlayAssignment[]
  ceremonyCount: number
  date: string
  endTime: string
  savedAt: string
  startTime: string
}

export type DemoScheduleOverlayDocument = {
  schedules: DemoScheduleOverlayEntry[]
  version: typeof DEMO_SCHEDULE_OVERLAY_VERSION
}

const positionIds = new Set<string>(POSITION_CATALOG.map((position) => position.id))
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAssignment(value: unknown): value is DemoScheduleOverlayAssignment {
  if (!isRecord(value)) return false
  return (
    typeof value.isTraining === 'boolean' &&
    typeof value.positionId === 'string' &&
    positionIds.has(value.positionId) &&
    typeof value.positionName === 'string' &&
    Number.isInteger(value.slotIndex) &&
    Number(value.slotIndex) >= 0 &&
    typeof value.workerId === 'string' &&
    value.workerId.length > 0 &&
    typeof value.workerName === 'string' &&
    value.workerName.length > 0
  )
}

function isEntry(value: unknown): value is DemoScheduleOverlayEntry {
  if (!isRecord(value)) return false
  return (
    Array.isArray(value.assignments) &&
    value.assignments.every(isAssignment) &&
    Number.isInteger(value.ceremonyCount) &&
    Number(value.ceremonyCount) >= 1 &&
    typeof value.date === 'string' &&
    datePattern.test(value.date) &&
    typeof value.startTime === 'string' &&
    timePattern.test(value.startTime) &&
    typeof value.endTime === 'string' &&
    timePattern.test(value.endTime) &&
    value.endTime > value.startTime &&
    typeof value.savedAt === 'string' &&
    !Number.isNaN(Date.parse(value.savedAt))
  )
}

export function parseDemoScheduleOverlay(value: unknown): DemoScheduleOverlayDocument | null {
  if (!isRecord(value) || value.version !== DEMO_SCHEDULE_OVERLAY_VERSION) return null
  if (!Array.isArray(value.schedules) || !value.schedules.every(isEntry)) return null
  return { schedules: value.schedules, version: DEMO_SCHEDULE_OVERLAY_VERSION }
}

export function upsertDemoScheduleOverlay(
  document: DemoScheduleOverlayDocument,
  entries: DemoScheduleOverlayEntry[],
): DemoScheduleOverlayDocument {
  const nextByDate = new Map(document.schedules.map((schedule) => [schedule.date, schedule]))
  for (const entry of entries) nextByDate.set(entry.date, entry)
  return {
    schedules: Array.from(nextByDate.values()).sort((left, right) =>
      left.date.localeCompare(right.date),
    ),
    version: DEMO_SCHEDULE_OVERLAY_VERSION,
  }
}

export function getDemoSchedulesForMonth(
  document: DemoScheduleOverlayDocument,
  month: string,
  databaseDates: Iterable<string>,
) {
  const databaseDateSet = new Set(databaseDates)
  return document.schedules.filter(
    (schedule) => schedule.date.startsWith(`${month}-`) && !databaseDateSet.has(schedule.date),
  )
}

export type DemoScheduleOverlaySchedulePayload = {
  assignments: {
    isTraining: boolean
    positionId: PositionId
    slotIndex: number
    workerId: string
  }[]
  ceremonyCount: number
  endTime: string
  startTime: string
  workDate: string
}

export function hasUnassignedDemoSchedulePosition(
  schedules: DemoScheduleOverlaySchedulePayload[],
): boolean {
  return schedules.some((schedule) => schedule.assignments.some(({ workerId }) => !workerId))
}

export function buildDemoScheduleOverlayEntries(
  schedules: DemoScheduleOverlaySchedulePayload[],
  workerNamesById: ReadonlyMap<string, string>,
  savedAt: string,
): DemoScheduleOverlayEntry[] {
  const positionById = new Map(POSITION_CATALOG.map((position) => [position.id, position]))
  return schedules.map((schedule) => ({
    assignments: schedule.assignments.map((assignment) => ({
      isTraining: assignment.isTraining,
      positionId: assignment.positionId,
      positionName: positionById.get(assignment.positionId)?.name ?? assignment.positionId,
      slotIndex: assignment.slotIndex,
      workerId: assignment.workerId,
      workerName: workerNamesById.get(assignment.workerId) ?? '알 수 없는 인원',
    })),
    ceremonyCount: schedule.ceremonyCount,
    date: schedule.workDate,
    endTime: schedule.endTime,
    savedAt,
    startTime: schedule.startTime,
  }))
}

export function getDemoWorkerShifts(
  document: DemoScheduleOverlayDocument,
  input: { databaseDates: Iterable<string>; end: string; start: string; workerId: string },
) {
  const databaseDateSet = new Set(input.databaseDates)
  return document.schedules
    .filter(
      (schedule) =>
        schedule.date >= input.start &&
        schedule.date <= input.end &&
        !databaseDateSet.has(schedule.date),
    )
    .flatMap((schedule) =>
      schedule.assignments
        .filter((assignment) => assignment.workerId === input.workerId)
        .map((assignment) => ({
          assignmentId: `demo-overlay:${schedule.date}:${assignment.positionId}:${assignment.slotIndex}`,
          date: schedule.date,
          endTime: schedule.endTime,
          isDemo: true as const,
          isTraining: assignment.isTraining,
          positionId: assignment.positionId,
          positionName: assignment.positionName,
          shiftId: `demo-overlay:${schedule.date}`,
          startTime: schedule.startTime,
        })),
    )
}
