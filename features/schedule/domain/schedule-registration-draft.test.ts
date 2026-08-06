import { describe, expect, it } from 'vitest'

import {
  getScheduleRegistrationDraftForMonth,
  getScheduleRegistrationDraftOverlayForMonth,
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
    expect(parseScheduleRegistrationDraft(document)).not.toBeNull()
    expect(parseScheduleRegistrationDraft({ ...document, version: 2 })).toBeNull()
    expect(
      parseScheduleRegistrationDraft({
        monthDrafts: {
          '2099-02': {
            drafts: [{ ...entry, endTime: 'invalid' }],
            savedAt: document.monthDrafts['2099-02'].savedAt,
          },
        },
        version: 1,
      }),
    ).toBeNull()
    expect(parseScheduleRegistrationDraft(null)).toBeNull()
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

  it('returns the same document when removing a month that was never saved', () => {
    const empty = { monthDrafts: {}, version: SCHEDULE_REGISTRATION_DRAFT_VERSION }
    expect(removeScheduleRegistrationDraftMonth(empty, '2099-02')).toBe(empty)
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
