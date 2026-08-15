'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useScheduleRegistrationDraftOverlay } from '@/features/schedule/hooks/use-schedule-registration-draft-overlay'
import { formatDateLabel } from '@/features/schedule/lib/date-format'
import type { MonthRegistrationViewModel } from '@/features/schedule/schemas/schedule-view-model'
import { Button, ButtonLink } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'

import { RegisteredScheduleCard } from '../components/registered-schedule-card'
import { getDaysInMonth, getLeadingBlankCount, getWeekendType } from '../lib/calendar'

import { ScheduleApplicationPeriodCard } from './schedule-application-period-card'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

function formatMonthValue(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

export function AdminScheduleView({
  requestId,
  viewModel,
}: {
  requestId: string
  viewModel: MonthRegistrationViewModel
}) {
  const router = useRouter()
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [year, monthNumber] = viewModel.month.split('-').map(Number)
  const monthIndex = monthNumber - 1
  const monthValue = viewModel.month
  const monthLabel = `${year}년 ${monthIndex + 1}월`
  const days = Array.from({ length: getDaysInMonth(year, monthIndex) }, (_, index) => index + 1)
  const firstWeekday = getLeadingBlankCount(year, monthIndex)
  const { draftSchedules } = useScheduleRegistrationDraftOverlay({
    excludedDates: viewModel.registeredSchedules.map((schedule) => schedule.date),
    month: viewModel.month,
  })
  const monthSchedules = [...viewModel.registeredSchedules, ...draftSchedules].sort((left, right) =>
    left.date.localeCompare(right.date),
  )
  const registeredDays = new Set(monthSchedules.map((schedule) => Number(schedule.date.slice(-2))))
  const [selectedMonth, setSelectedMonth] = useState(viewModel.month)
  if (selectedMonth !== viewModel.month) {
    setSelectedMonth(viewModel.month)
    setSelectedDates(new Set())
  }

  function moveMonth(offset: number) {
    const nextMonth = new Date(year, monthIndex + offset, 1)
    router.push(
      `/admin/schedules?month=${formatMonthValue(nextMonth.getFullYear(), nextMonth.getMonth())}`,
    )
  }

  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="일정 관리"
        title="일정 달력"
        description="날짜를 선택한 뒤 일정을 등록하세요."
      />

      <ContentCard>
        <div className={styles.monthNavigator}>
          <button
            aria-label="이전 달 보기"
            className={styles.monthArrowButton}
            type="button"
            onClick={() => moveMonth(-1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <strong aria-live="polite">{monthLabel}</strong>
          <button
            aria-label="다음 달 보기"
            className={styles.monthArrowButton}
            type="button"
            onClick={() => moveMonth(1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div aria-label={`${monthLabel} 관리자 일정 달력`} className={styles.calendar} role="group">
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
            <span
              aria-hidden="true"
              className={styles.blankDay}
              key={`blank-${index}`}
              role="presentation"
            />
          ))}
          {days.map((day) => {
            const dateValue = `${monthValue}-${String(day).padStart(2, '0')}`
            const isRegistered = registeredDays.has(day)
            const isSelected = selectedDates.has(dateValue)
            if (isRegistered) {
              return (
                <span
                  aria-label={`${monthNumber}월 ${day}일 일정 등록됨`}
                  className={styles.adminCalendarDay}
                  data-registered
                  data-weekday={getWeekendType(year, monthIndex, day)}
                  key={day}
                >
                  {day}
                </span>
              )
            }
            return (
              <button
                aria-label={`${monthNumber}월 ${day}일${isSelected ? ' 선택됨' : ''}`}
                aria-pressed={isSelected}
                className={styles.day}
                data-weekday={getWeekendType(year, monthIndex, day)}
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDates((prev) => {
                    const next = new Set(prev)
                    if (next.has(dateValue)) {
                      next.delete(dateValue)
                    } else {
                      next.add(dateValue)
                    }
                    return next
                  })
                }}
              >
                {day}
              </button>
            )
          })}
        </div>
      </ContentCard>

      {selectedDates.size > 0 ? (
        <div className={layout.row}>
          <p className={styles.meta}>{selectedDates.size}일 선택됨</p>
          <Button variant="secondary" onClick={() => setSelectedDates(new Set())}>
            선택 해제
          </Button>
        </div>
      ) : (
        <p className={styles.meta}>등록할 날짜를 달력에서 선택하세요.</p>
      )}

      <ScheduleApplicationPeriodCard
        hasScheduleHistory={viewModel.hasScheduleHistory}
        key={monthValue}
        month={monthValue}
        period={viewModel.period}
        requestId={requestId}
        selectedDates={[...selectedDates].sort()}
      />

      {selectedDates.size > 0 && viewModel.period.id ? (
        <ButtonLink
          href={`/admin/schedules/new?month=${monthValue}&dates=${[...selectedDates].sort().join(',')}`}
        >
          {selectedDates.size}일 일정 등록하기
        </ButtonLink>
      ) : null}

      <section className={layout.stack} aria-labelledby="registered-schedule-title">
        <h2 id="registered-schedule-title">{monthLabel} 등록된 일정</h2>
        {monthSchedules.length > 0 ? (
          <ul className={layout.list}>
            {monthSchedules.map((schedule) => (
              <li key={schedule.date}>
                <RegisteredScheduleCard
                  assignedCount={schedule.assignedCount}
                  cancellationReason={schedule.cancellationReason}
                  ceremonyCount={schedule.ceremonyCount}
                  date={schedule.date}
                  dateLabel={formatDateLabel(schedule.date)}
                  isDraft={schedule.isDraft}
                  time={schedule.time}
                  status={schedule.status}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ContentCard>
            <p className={styles.emptyState}>이 달에 등록된 일정이 없습니다.</p>
          </ContentCard>
        )}
      </section>
    </div>
  )
}
