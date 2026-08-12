import { describe, expect, it } from 'vitest'

import {
  getScheduleRegistrationDraftForMonth,
  getScheduleRegistrationDraftOverlayForMonth,
  mergeRestoredScheduleRegistrationDrafts,
  parseScheduleRegistrationDraft,
  removeScheduleRegistrationDraftMonth,
  SCHEDULE_REGISTRATION_DRAFT_VERSION,
  type ScheduleRegistrationDraftEntry,
  upsertScheduleRegistrationDraftMonth,
} from './schedule-registration-draft'

const entry: ScheduleRegistrationDraftEntry = {
  ceremonyCount: 1,
  date: '2099-02-07',
  endTime: '18:00',
  isEnabled: true,
  positions: [
    {
      assignedWorkerIds: ['worker-1'],
      id: 'leader',
      minimumAssigneeCount: 1,
      name: '팀장',
      trainingFlags: [false],
    },
  ],
  startTime: '09:00',
}

describe('schedule registration draft domain', () => {
  it('accepts only the current, structurally valid document version', () => {
    const document = {
      monthDrafts: { '2099-02': { drafts: [entry], savedAt: '2099-01-01T00:00:00.000Z' } },
      version: 1,
    }
    expect(parseScheduleRegistrationDraft(document)).toEqual(document)
    expect(parseScheduleRegistrationDraft({ ...document, version: 2 })).toBeNull()
    expect(parseScheduleRegistrationDraft(null)).toBeNull()
  })

  it('drops only the month with corrupted entries, keeping other months intact', () => {
    const validMonth = { drafts: [entry], savedAt: '2099-01-01T00:00:00.000Z' }
    const invalidMonth = {
      drafts: [{ ...entry, endTime: 'invalid' }],
      savedAt: '2099-01-02T00:00:00.000Z',
    }
    const parsed = parseScheduleRegistrationDraft({
      monthDrafts: { '2099-02': validMonth, '2099-03': invalidMonth },
      version: 1,
    })
    expect(parsed?.monthDrafts['2099-02']).toEqual(validMonth)
    expect(parsed?.monthDrafts['2099-03']).toBeUndefined()
  })

  it('upserts and removes a month, leaving other months untouched', () => {
    const empty = { monthDrafts: {}, version: SCHEDULE_REGISTRATION_DRAFT_VERSION }
    const withFebruary = upsertScheduleRegistrationDraftMonth(
      empty,
      '2099-02',
      [entry],
      '2099-01-01T00:00:00.000Z',
    )
    const withMarch = upsertScheduleRegistrationDraftMonth(
      withFebruary,
      '2099-03',
      [{ ...entry, date: '2099-03-07' }],
      '2099-01-02T00:00:00.000Z',
    )
    expect(getScheduleRegistrationDraftForMonth(withMarch, '2099-02')?.drafts).toEqual([entry])
    expect(getScheduleRegistrationDraftForMonth(withMarch, '2099-03')?.drafts).toHaveLength(1)

    const withoutFebruary = removeScheduleRegistrationDraftMonth(withMarch, '2099-02')
    expect(getScheduleRegistrationDraftForMonth(withoutFebruary, '2099-02')).toBeNull()
    expect(getScheduleRegistrationDraftForMonth(withoutFebruary, '2099-03')).not.toBeNull()
  })

  it('never persists a structurally invalid entry, such as a cleared ceremony count', () => {
    const empty = { monthDrafts: {}, version: SCHEDULE_REGISTRATION_DRAFT_VERSION }
    const withInvalidEntry = upsertScheduleRegistrationDraftMonth(
      empty,
      '2099-02',
      [{ ...entry, ceremonyCount: 0 }],
      '2099-01-01T00:00:00.000Z',
    )
    expect(getScheduleRegistrationDraftForMonth(withInvalidEntry, '2099-02')?.drafts).toEqual([])
  })

  it('returns the same document when removing a month that was never saved', () => {
    const empty = { monthDrafts: {}, version: SCHEDULE_REGISTRATION_DRAFT_VERSION }
    expect(removeScheduleRegistrationDraftMonth(empty, '2099-02')).toBe(empty)
  })

  it('adds a stored draft whose date is missing from the current list instead of dropping it', () => {
    const current = [{ ...entry, date: '2099-02-14', isEnabled: false }]
    const storedOnly: ScheduleRegistrationDraftEntry = { ...entry, date: '2099-02-07' }
    const result = mergeRestoredScheduleRegistrationDrafts(current, [storedOnly])
    expect(result).toEqual([storedOnly, current[0]])
  })

  it('overwrites a matching current entry with the stored values instead of duplicating it', () => {
    const current = [{ ...entry, isEnabled: false }]
    const stored: ScheduleRegistrationDraftEntry = { ...entry, isEnabled: true }
    const result = mergeRestoredScheduleRegistrationDrafts(current, [stored])
    expect(result).toEqual([stored])
  })

  it('maps enabled month drafts to overlay schedules and excludes already-registered dates', () => {
    const secondEntry: ScheduleRegistrationDraftEntry = {
      ...entry,
      date: '2099-02-14',
      positions: [
        {
          assignedWorkerIds: ['worker-1', ''],
          id: 'leader',
          minimumAssigneeCount: 1,
          name: '팀장',
          trainingFlags: [false, false],
        },
      ],
    }
    const document = upsertScheduleRegistrationDraftMonth(
      { monthDrafts: {}, version: SCHEDULE_REGISTRATION_DRAFT_VERSION },
      '2099-02',
      [entry, secondEntry],
      '2099-01-01T00:00:00.000Z',
    )

    expect(getScheduleRegistrationDraftOverlayForMonth(document, '2099-02', [])).toEqual([
      {
        assignedCount: 1,
        cancellationReason: null,
        ceremonyCount: entry.ceremonyCount,
        date: entry.date,
        isDraft: true,
        status: 'published',
        time: `${entry.startTime}–${entry.endTime}`,
      },
      {
        assignedCount: 1,
        cancellationReason: null,
        ceremonyCount: secondEntry.ceremonyCount,
        date: secondEntry.date,
        isDraft: true,
        status: 'published',
        time: `${secondEntry.startTime}–${secondEntry.endTime}`,
      },
    ])
    expect(getScheduleRegistrationDraftOverlayForMonth(document, '2099-02', [entry.date])).toEqual([
      expect.objectContaining({ date: secondEntry.date }),
    ])
    expect(getScheduleRegistrationDraftOverlayForMonth(document, '2099-03', [])).toEqual([])
  })
})
