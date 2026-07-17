'use client'

import { useState } from 'react'

import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import { getLeadingBlankCount, getWeekendType, isWeekend } from '../lib/calendar'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']
const days = Array.from({ length: 31 }, (_, index) => index + 1)
const year = 2026
const monthIndex = 6
const firstWeekday = getLeadingBlankCount(year, monthIndex)
const applicationScheduleDays = [19, 25, 26] as const
const isApplicationClosed = false

export function ScheduleApplicationView() {
  const [selectedDays, setSelectedDays] = useState(() => new Set([19, 25]))
  const [isSaved, setIsSaved] = useState(true)

  const selectedDayList = [...selectedDays].sort((first, second) => first - second)

  function toggleDay(day: number) {
    if (
      isApplicationClosed ||
      !applicationScheduleDays.some((scheduleDay) => scheduleDay === day)
    ) {
      return
    }

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
          <StatusBadge tone={isApplicationClosed ? 'neutral' : 'positive'}>
            {isApplicationClosed ? '신청 마감' : '신청 중'}
          </StatusBadge>
        </div>
        <p className={styles.meta}>7월 전체 신청 마감 · 6월 25일 18:00</p>
        <div className={styles.calendar} aria-label="2026년 7월 일정 신청 달력">
          {weekdays.map((weekday, weekdayIndex) => (
            <span
              className={styles.weekday}
              data-weekday={
                weekdayIndex === 0 ? 'sunday' : weekdayIndex === 6 ? 'saturday' : undefined
              }
              key={weekday}
              aria-hidden="true"
            >
              {weekday}
            </span>
          ))}
          {Array.from({ length: firstWeekday }, (_, index) => (
            <span className={styles.blankDay} key={`blank-${index}`} aria-hidden="true" />
          ))}
          {days.map((day) => {
            const isWeekendDay = isWeekend(year, monthIndex, day)
            const hasSchedule = applicationScheduleDays.some((scheduleDay) => scheduleDay === day)
            const canApply = hasSchedule && !isApplicationClosed
            const isSelected = selectedDays.has(day)
            const stateLabel = hasSchedule
              ? isApplicationClosed
                ? ` ${isSelected ? '신청 완료, 월 신청 마감됨' : '월 신청 마감됨'}`
                : isSelected
                  ? ' 신청 취소'
                  : ' 신청'
              : isWeekendDay
                ? ' 등록된 근무 없음'
                : ''
            return (
              <button
                className={styles.day}
                type="button"
                disabled={!canApply}
                aria-label={`7월 ${day}일${stateLabel}`}
                aria-pressed={hasSchedule ? isSelected : undefined}
                data-weekday={getWeekendType(year, monthIndex, day)}
                onClick={() => toggleDay(day)}
                key={day}
              >
                {day}
              </button>
            )
          })}
        </div>
      </ContentCard>

      <ContentCard>
        <div className={layout.row}>
          <strong>신청한 날짜</strong>
          <StatusBadge tone="accent">{selectedDays.size}일</StatusBadge>
        </div>
        {selectedDayList.length > 0 ? (
          <ul className={styles.applicationList} aria-label="신청한 근무 날짜">
            {selectedDayList.map((day) => (
              <li className={styles.applicationItem} key={day}>
                <div className={styles.detail}>
                  <span>7월 {day}일</span>
                  <span className={styles.meta}>7월 전체 신청에 포함</span>
                </div>
                {isApplicationClosed ? (
                  <StatusBadge tone="neutral">변경 불가</StatusBadge>
                ) : (
                  <Button
                    aria-label={`7월 ${day}일 신청 취소`}
                    onClick={() => toggleDay(day)}
                    variant="secondary"
                  >
                    신청 취소
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>신청한 날짜가 없습니다.</p>
        )}
      </ContentCard>

      <div className={layout.stack} aria-live="polite">
        <p>
          선택한 날짜 <strong>{selectedDays.size}일</strong>
          {isSaved ? ' · 저장되었습니다.' : ' · 저장되지 않은 변경이 있습니다.'}
        </p>
        <Button disabled={isSaved} onClick={() => setIsSaved(true)}>
          {isSaved ? '신청 변경 없음' : '신청 변경 저장'}
        </Button>
      </div>
    </div>
  )
}
