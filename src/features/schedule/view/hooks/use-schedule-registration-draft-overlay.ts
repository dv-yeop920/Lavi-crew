'use client'

import { useEffect, useState } from 'react'

import {
  EMPTY_SCHEDULE_REGISTRATION_DRAFT,
  readScheduleRegistrationDraft,
} from '../../api/schedule-registration-draft-storage'
import { getScheduleRegistrationDraftOverlayForMonth } from '../../model/schedule-registration-draft'

type UseScheduleRegistrationDraftOverlayOptions = {
  excludedDates: Iterable<string>
  month: string
}

/**
 * 관리자 일정 달력 개요 화면에서 아직 최종 저장하지 않은 브라우저 임시 저장 초안을
 * 등록된 일정과 같은 카드로 함께 보여주기 위해 로컬스토리지에서 읽어온다.
 * 이미 Supabase에 등록된 날짜는 excludedDates로 제외한다.
 */
export function useScheduleRegistrationDraftOverlay({
  excludedDates,
  month,
}: UseScheduleRegistrationDraftOverlayOptions) {
  const [document, setDocument] = useState(EMPTY_SCHEDULE_REGISTRATION_DRAFT)

  useEffect(() => {
    let isCancelled = false
    queueMicrotask(() => {
      if (isCancelled) return
      setDocument(readScheduleRegistrationDraft(window.localStorage))
    })
    return () => {
      isCancelled = true
    }
  }, [month])

  const draftSchedules = getScheduleRegistrationDraftOverlayForMonth(document, month, excludedDates)

  return { draftSchedules }
}
