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

function sanitizeMonthRecord(value: unknown): ScheduleRegistrationDraftMonthRecord | null {
  if (!isRecord(value)) return null
  if (
    !Array.isArray(value.drafts) ||
    typeof value.savedAt !== 'string' ||
    Number.isNaN(Date.parse(value.savedAt))
  ) {
    return null
  }
  const drafts = value.drafts.filter(isDraftEntry)
  if (drafts.length === 0) return null
  return { drafts, savedAt: value.savedAt }
}

/**
 * 월 하나 또는 날짜 하나의 데이터가 깨져도 다른 달·다른 날짜의 임시 저장 내용까지
 * 함께 사라지지 않도록, 유효하지 않은 항목만 걸러내고 나머지는 그대로 복원한다.
 */
export function parseScheduleRegistrationDraft(
  value: unknown,
): ScheduleRegistrationDraftDocument | null {
  if (!isRecord(value) || value.version !== SCHEDULE_REGISTRATION_DRAFT_VERSION) return null
  if (!isRecord(value.monthDrafts)) return null
  const monthDrafts: Record<string, ScheduleRegistrationDraftMonthRecord> = {}
  for (const [month, record] of Object.entries(value.monthDrafts)) {
    if (!monthPattern.test(month)) continue
    const sanitized = sanitizeMonthRecord(record)
    if (sanitized) monthDrafts[month] = sanitized
  }
  return { monthDrafts, version: SCHEDULE_REGISTRATION_DRAFT_VERSION }
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
    monthDrafts: {
      ...document.monthDrafts,
      [month]: { drafts: drafts.filter(isDraftEntry), savedAt },
    },
    version: SCHEDULE_REGISTRATION_DRAFT_VERSION,
  }
}

export type ScheduleRegistrationDraftOverlaySchedule = {
  assignedCount: number
  cancellationReason: null
  ceremonyCount: number
  date: string
  isDraft: true
  status: 'published'
  time: string
}

/**
 * 관리자 일정 달력 개요에 등록된 일정과 함께 보여줄 브라우저 임시 저장 일정을 계산한다.
 * 카드에는 확정 일정과 구분 없이 표시하되, 아직 DB에 행이 없으므로 카드 링크는
 * 상세 화면이 아니라 그 달의 등록 화면으로 보낸다. 이미 Supabase에 등록된 날짜는
 * excludedDates로 제외한다.
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

/**
 * 화면에 이미 표시 중인 초안 목록(current)에 로컬스토리지에서 복원한 임시 저장 항목
 * (stored)을 합친다. 날짜가 이미 current에 있으면 저장된 값으로 덮어쓰고, current에는
 * 없지만 저장돼 있던 날짜(예: 서버가 이번 방문에는 미등록 주말로 계산하지 않은 날짜)는
 * 새 항목으로 추가한다 — 조회 시점의 목록에 없다는 이유로 임시 저장한 내용을 조용히
 * 버리지 않기 위함이다. stored는 ScheduleRegistrationDraftEntry이고 T는 이를 확장하는
 * 타입이므로, current에 없던 날짜에는 그 값을 T로 취급해도 구조적으로 안전하다.
 */
export function mergeRestoredScheduleRegistrationDrafts<T extends ScheduleRegistrationDraftEntry>(
  current: T[],
  stored: ScheduleRegistrationDraftEntry[],
): T[] {
  const byDate = new Map(current.map((draft) => [draft.date, draft]))
  for (const entry of stored) {
    const existing = byDate.get(entry.date)
    byDate.set(entry.date, existing ? { ...existing, ...entry } : (entry as T))
  }
  return Array.from(byDate.values()).sort((left, right) => left.date.localeCompare(right.date))
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
