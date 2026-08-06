import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'

export const SCHEDULE_REGISTRATION_DRAFT_VERSION = 1 as const

export type ScheduleRegistrationDraftPosition = {
  assignedWorkerIds: string[]
  id: PositionId
  minimumAssigneeCount: number
  name: string
  trainingFlags: boolean[]
}

export type ScheduleRegistrationDraftEntry = {
  ceremonyCount: number
  date: string
  endTime: string
  isEnabled: boolean
  positions: ScheduleRegistrationDraftPosition[]
  startTime: string
}

export type ScheduleRegistrationDraftMonthRecord = {
  drafts: ScheduleRegistrationDraftEntry[]
  savedAt: string
}

export type ScheduleRegistrationDraftDocument = {
  monthDrafts: Record<string, ScheduleRegistrationDraftMonthRecord>
  version: typeof SCHEDULE_REGISTRATION_DRAFT_VERSION
}

const positionIds = new Set<string>(POSITION_CATALOG.map((position) => position.id))
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
const monthPattern = /^\d{4}-\d{2}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPosition(value: unknown): value is ScheduleRegistrationDraftPosition {
  if (!isRecord(value)) return false
  return (
    Array.isArray(value.assignedWorkerIds) &&
    value.assignedWorkerIds.every((workerId) => typeof workerId === 'string') &&
    typeof value.id === 'string' &&
    positionIds.has(value.id) &&
    Number.isInteger(value.minimumAssigneeCount) &&
    Number(value.minimumAssigneeCount) >= 0 &&
    typeof value.name === 'string' &&
    Array.isArray(value.trainingFlags) &&
    value.trainingFlags.every((flag) => typeof flag === 'boolean') &&
    value.trainingFlags.length === value.assignedWorkerIds.length
  )
}

function isDraftEntry(value: unknown): value is ScheduleRegistrationDraftEntry {
  if (!isRecord(value)) return false
  return (
    Number.isInteger(value.ceremonyCount) &&
    Number(value.ceremonyCount) >= 1 &&
    typeof value.date === 'string' &&
    datePattern.test(value.date) &&
    typeof value.startTime === 'string' &&
    timePattern.test(value.startTime) &&
    typeof value.endTime === 'string' &&
    timePattern.test(value.endTime) &&
    typeof value.isEnabled === 'boolean' &&
    Array.isArray(value.positions) &&
    value.positions.every(isPosition)
  )
}

function isMonthRecord(value: unknown): value is ScheduleRegistrationDraftMonthRecord {
  if (!isRecord(value)) return false
  return (
    Array.isArray(value.drafts) &&
    value.drafts.every(isDraftEntry) &&
    typeof value.savedAt === 'string' &&
    !Number.isNaN(Date.parse(value.savedAt))
  )
}

export function parseScheduleRegistrationDraft(
  value: unknown,
): ScheduleRegistrationDraftDocument | null {
  if (!isRecord(value) || value.version !== SCHEDULE_REGISTRATION_DRAFT_VERSION) return null
  if (!isRecord(value.monthDrafts)) return null
  const entries = Object.entries(value.monthDrafts)
  if (!entries.every(([month, record]) => monthPattern.test(month) && isMonthRecord(record))) {
    return null
  }
  return {
    monthDrafts: value.monthDrafts as Record<string, ScheduleRegistrationDraftMonthRecord>,
    version: SCHEDULE_REGISTRATION_DRAFT_VERSION,
  }
}

export function getScheduleRegistrationDraftForMonth(
  document: ScheduleRegistrationDraftDocument,
  month: string,
): ScheduleRegistrationDraftMonthRecord | null {
  return document.monthDrafts[month] ?? null
}

export function upsertScheduleRegistrationDraftMonth(
  document: ScheduleRegistrationDraftDocument,
  month: string,
  drafts: ScheduleRegistrationDraftEntry[],
  savedAt: string,
): ScheduleRegistrationDraftDocument {
  return {
    monthDrafts: { ...document.monthDrafts, [month]: { drafts, savedAt } },
    version: SCHEDULE_REGISTRATION_DRAFT_VERSION,
  }
}

export type ScheduleRegistrationDraftOverlaySchedule = {
  assignedCount: number
  cancellationReason: null
  ceremonyCount: number
  date: string
  isDemo?: boolean
  isDraft: true
  status: 'published'
  time: string
}

/**
 * 관리자 일정 달력 개요에 "미확정" 배지로 함께 보여줄 브라우저 임시 저장 일정을 계산한다.
 * 이미 Supabase에 등록됐거나 데모 오버레이로 저장된 날짜는 excludedDates로 제외한다.
 */
export function getScheduleRegistrationDraftOverlayForMonth(
  document: ScheduleRegistrationDraftDocument,
  month: string,
  excludedDates: Iterable<string>,
): ScheduleRegistrationDraftOverlaySchedule[] {
  const record = getScheduleRegistrationDraftForMonth(document, month)
  if (!record) return []
  const excludedDateSet = new Set(excludedDates)
  return record.drafts
    .filter((draft) => !excludedDateSet.has(draft.date))
    .map((draft) => ({
      assignedCount: draft.positions.flatMap((position) =>
        position.assignedWorkerIds.filter(Boolean),
      ).length,
      cancellationReason: null,
      ceremonyCount: draft.ceremonyCount,
      date: draft.date,
      isDraft: true as const,
      status: 'published' as const,
      time: `${draft.startTime}–${draft.endTime}`,
    }))
}

export function removeScheduleRegistrationDraftMonth(
  document: ScheduleRegistrationDraftDocument,
  month: string,
): ScheduleRegistrationDraftDocument {
  if (!(month in document.monthDrafts)) return document
  const monthDrafts = { ...document.monthDrafts }
  delete monthDrafts[month]
  return { monthDrafts, version: SCHEDULE_REGISTRATION_DRAFT_VERSION }
}
