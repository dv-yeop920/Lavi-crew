import { describe, expect, it, vi } from 'vitest'

import { upsertScheduleRegistrationDraftMonth } from '../domain/schedule-registration-draft'

import {
  EMPTY_SCHEDULE_REGISTRATION_DRAFT,
  readScheduleRegistrationDraft,
  writeScheduleRegistrationDraft,
} from './schedule-registration-draft-storage'

describe('schedule registration draft storage adapter', () => {
  it('falls back safely for malformed data and unavailable storage', () => {
    expect(readScheduleRegistrationDraft({ getItem: () => '{broken' })).toEqual(
      EMPTY_SCHEDULE_REGISTRATION_DRAFT,
    )
    expect(
      readScheduleRegistrationDraft({
        getItem: () => {
          throw new Error('blocked')
        },
      }),
    ).toEqual(EMPTY_SCHEDULE_REGISTRATION_DRAFT)
  })

  it('reports quota failures without throwing', () => {
    const setItem = vi.fn(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    const document = upsertScheduleRegistrationDraftMonth(
      EMPTY_SCHEDULE_REGISTRATION_DRAFT,
      '2099-02',
      [],
      '2099-01-01T00:00:00.000Z',
    )
    expect(writeScheduleRegistrationDraft({ removeItem: vi.fn(), setItem }, document).ok).toBe(
      false,
    )
  })

  it('removes the storage entry once every month draft is cleared', () => {
    const removeItem = vi.fn()
    const setItem = vi.fn()
    const result = writeScheduleRegistrationDraft(
      { removeItem, setItem },
      EMPTY_SCHEDULE_REGISTRATION_DRAFT,
    )
    expect(result.ok).toBe(true)
    expect(removeItem).toHaveBeenCalledOnce()
    expect(setItem).not.toHaveBeenCalled()
  })
})
