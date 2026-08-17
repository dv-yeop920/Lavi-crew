'use client'

import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react'

import {
  readScheduleRegistrationDraft,
  writeScheduleRegistrationDraft,
} from '../../api/schedule-registration-draft-storage'
import {
  getScheduleRegistrationDraftForMonth,
  mergeRestoredScheduleRegistrationDrafts,
  removeScheduleRegistrationDraftMonth,
  type ScheduleRegistrationDraftEntry,
  upsertScheduleRegistrationDraftMonth,
} from '../../model/schedule-registration-draft'

type ScheduleDraftLike = ScheduleRegistrationDraftEntry & { date: string }

type UseScheduleRegistrationDraftOptions<Draft extends ScheduleDraftLike> = {
  month: string
  setDrafts: Dispatch<SetStateAction<Draft[]>>
}

/**
 * 관리자 일정 등록 화면에서 아직 최종 저장하지 않은 초안을 브라우저 로컬스토리지에
 * 임시 저장하고, 같은 달로 돌아왔을 때 복원한다. `saveMonthDrafts`는 호출 시점에
 * 화면에 있는 활성화된 날짜 전체를 그 달 단위로 통째로 덮어쓴다(날짜별 부분 저장 아님).
 */
export function useScheduleRegistrationDraft<Draft extends ScheduleDraftLike>({
  month,
  setDrafts,
}: UseScheduleRegistrationDraftOptions<Draft>) {
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    queueMicrotask(() => {
      if (isCancelled) return
      const record = getScheduleRegistrationDraftForMonth(
        readScheduleRegistrationDraft(window.localStorage),
        month,
      )
      setLastSavedAt(record?.savedAt ?? null)
      if (!record) return
      setDrafts((current) => mergeRestoredScheduleRegistrationDrafts(current, record.drafts))
    })
    return () => {
      isCancelled = true
    }
  }, [month, setDrafts])

  function saveMonthDrafts(drafts: Draft[]) {
    const enabledDrafts = drafts.filter((draft) => draft.isEnabled)
    const current = readScheduleRegistrationDraft(window.localStorage)
    const next = enabledDrafts.length
      ? upsertScheduleRegistrationDraftMonth(
          current,
          month,
          enabledDrafts,
          new Date().toISOString(),
        )
      : removeScheduleRegistrationDraftMonth(current, month)
    const result = writeScheduleRegistrationDraft(window.localStorage, next)
    if (!result.ok) {
      return result
    }
    const savedAt = next.monthDrafts[month]?.savedAt ?? null
    setLastSavedAt(savedAt)
    return {
      message: savedAt ? '임시 저장했습니다.' : '임시 저장한 내용이 없어 지웠습니다.',
      ok: true as const,
    }
  }

  const clearDraft = useCallback(() => {
    const current = readScheduleRegistrationDraft(window.localStorage)
    writeScheduleRegistrationDraft(
      window.localStorage,
      removeScheduleRegistrationDraftMonth(current, month),
    )
    setLastSavedAt(null)
  }, [month])

  return { clearDraft, lastSavedAt, saveMonthDrafts }
}
