'use client'

import { useState } from 'react'

import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import { getLeadingBlankCount, isWeekend } from '../lib/calendar'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']
const days = Array.from({ length: 31 }, (_, index) => index + 1)
const year = 2026
const monthIndex = 6
const firstWeekday = getLeadingBlankCount(year, monthIndex)

export function ScheduleApplicationView() {
  const [selectedDays, setSelectedDays] = useState(() => new Set([4, 11, 19]))
  const [isSaved, setIsSaved] = useState(false)

  function toggleDay(day: number) {
    setSelectedDays((current) => {
      const next = new Set(current)
      if (next.has(day)) {
        next.delete(day)
      } else {
        next.add(day)
      }
      return next
    })
    setIsSaved(false)
  }

  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="7월 일정 신청"
        title="근무 가능한 날을 선택하세요"
        description="주말만 신청할 수 있으며 관리자가 마감하기 전까지 취소할 수 있어요."
      />

      <ContentCard>
        <div className={layout.row}>
          <strong>2026년 7월</strong>
          <StatusBadge tone="positive">신청 중</StatusBadge>
        </div>
        <p className={styles.meta}>관리자 마감 예정 · 6월 25일 18:00</p>
        <div className={styles.calendar} aria-label="2026년 7월 일정 신청 달력">
          {weekdays.map((weekday) => (
            <span className={styles.weekday} key={weekday} aria-hidden="true">
              {weekday}
            </span>
          ))}
          {Array.from({ length: firstWeekday }, (_, index) => (
            <span className={styles.blankDay} key={`blank-${index}`} aria-hidden="true" />
          ))}
          {days.map((day) => {
            const canApply = isWeekend(year, monthIndex, day)
            const isSelected = selectedDays.has(day)
            return (
              <button
                className={styles.day}
                type="button"
                disabled={!canApply}
                aria-label={`${7}월 ${day}일${canApply ? (isSelected ? ' 신청 취소' : ' 신청') : ''}`}
                aria-pressed={canApply ? isSelected : undefined}
                onClick={() => toggleDay(day)}
                key={day}
              >
                {day}
              </button>
            )
          })}
        </div>
      </ContentCard>

      <div className={layout.stack} aria-live="polite">
        <p>
          선택한 날짜 <strong>{selectedDays.size}일</strong>
          {isSaved ? ' · 저장되었습니다.' : ''}
        </p>
        <Button onClick={() => setIsSaved(true)}>신청 저장</Button>
      </div>
    </div>
  )
}
