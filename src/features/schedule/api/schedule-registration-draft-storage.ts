import {
  parseScheduleRegistrationDraft,
  SCHEDULE_REGISTRATION_DRAFT_VERSION,
  type ScheduleRegistrationDraftDocument,
} from '../model/schedule-registration-draft'

export const SCHEDULE_REGISTRATION_DRAFT_STORAGE_KEY = 'lavi-crew:schedule-registration-draft:v1'

export const EMPTY_SCHEDULE_REGISTRATION_DRAFT: ScheduleRegistrationDraftDocument = {
  monthDrafts: {},
  version: SCHEDULE_REGISTRATION_DRAFT_VERSION,
}

export function readScheduleRegistrationDraft(storage: Pick<Storage, 'getItem'>) {
  try {
    const raw = storage.getItem(SCHEDULE_REGISTRATION_DRAFT_STORAGE_KEY)
    if (!raw) return EMPTY_SCHEDULE_REGISTRATION_DRAFT
    return (
      parseScheduleRegistrationDraft(JSON.parse(raw) as unknown) ??
      EMPTY_SCHEDULE_REGISTRATION_DRAFT
    )
  } catch {
    return EMPTY_SCHEDULE_REGISTRATION_DRAFT
  }
}

export function writeScheduleRegistrationDraft(
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
  document: ScheduleRegistrationDraftDocument,
) {
  try {
    if (Object.keys(document.monthDrafts).length === 0) {
      storage.removeItem(SCHEDULE_REGISTRATION_DRAFT_STORAGE_KEY)
    } else {
      storage.setItem(SCHEDULE_REGISTRATION_DRAFT_STORAGE_KEY, JSON.stringify(document))
    }
    return { ok: true as const }
  } catch {
    return {
      message: '브라우저 저장 공간에 임시 저장 내용을 저장하지 못했습니다.',
      ok: false as const,
    }
  }
}
