'use client'

import { useRouter } from 'next/navigation'

import { getDemoSchedulesForMonth } from '@/features/schedule/domain/demo-schedule-overlay'
import { useDemoScheduleOverlay } from '@/features/schedule/hooks/use-demo-schedule-overlay'
import { useScheduleRegistrationDraftOverlay } from '@/features/schedule/hooks/use-schedule-registration-draft-overlay'
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

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date(`${date}T00:00:00`))
}

export function AdminScheduleView({
  demoEnabled,
  requestId,
  viewModel,
}: {
  demoEnabled: boolean
  requestId: string
  viewModel: MonthRegistrationViewModel
}) {
  const router = useRouter()
  const { document } = useDemoScheduleOverlay(demoEnabled)
  const [year, monthNumber] = viewModel.month.split('-').map(Number)
  const monthIndex = monthNumber - 1
  const monthValue = viewModel.month
  const monthLabel = `${year}년 ${monthIndex + 1}월`
  const days = Array.from({ length: getDaysInMonth(year, monthIndex) }, (_, index) => index + 1)
  const firstWeekday = getLeadingBlankCount(year, monthIndex)
  const demoSchedules = getDemoSchedulesForMonth(
    document,
    viewModel.month,
    viewModel.registeredSchedules.map((schedule) => schedule.date),
  ).map((schedule) => ({
    assignedCount: schedule.assignments.length,
    cancellationReason: null,
    ceremonyCount: schedule.ceremonyCount,
    date: schedule.date,
    isDemo: true,
    isDraft: false as const,
    status: 'published' as const,
    time: `${schedule.startTime}–${schedule.endTime}`,
  }))
  const { draftSchedules } = useScheduleRegistrationDraftOverlay({
    excludedDates: [...viewModel.registeredSchedules, ...demoSchedules].map(
      (schedule) => schedule.date,
    ),
    month: viewModel.month,
  })
  const monthSchedules = [
    ...viewModel.registeredSchedules,
    ...demoSchedules,
    ...draftSchedules,
  ].sort((left, right) => left.date.localeCompare(right.date))
  const registeredDays = new Set(monthSchedules.map((schedule) => Number(schedule.date.slice(-2))))

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
        description="월별 일정을 확인하고 해당 월의 스케줄 등록 화면으로 이동하세요."
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
          {days.map((day) => (
            <span
              aria-label={
                registeredDays.has(day)
                  ? `${monthIndex + 1}월 ${day}일 일정 등록됨`
                  : `${monthIndex + 1}월 ${day}일 일정 없음`
              }
              className={styles.adminCalendarDay}
              data-registered={registeredDays.has(day) || undefined}
              data-weekday={getWeekendType(year, monthIndex, day)}
              key={day}
            >
              {day}
            </span>
          ))}
        </div>
      </ContentCard>

      <ScheduleApplicationPeriodCard
        hasScheduleHistory={viewModel.hasScheduleHistory}
        key={monthValue}
        month={monthValue}
        period={viewModel.period}
        requestId={requestId}
      />

      {viewModel.period.id ? (
        <ButtonLink href={`/admin/schedules/new?month=${monthValue}`}>
          {monthLabel} 일정 등록하기
        </ButtonLink>
      ) : (
        <Button disabled variant="secondary">
          먼저 신청 기간을 열어주세요
        </Button>
      )}

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
                  isDemo={schedule.isDemo}
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
