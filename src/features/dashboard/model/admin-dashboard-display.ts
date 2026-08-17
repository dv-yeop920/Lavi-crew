import type {
  AdminDashboardMonth,
  AdminDashboardViewModel,
} from '../schema/admin-dashboard-view-model'

export type AdminDashboardTask = {
  href: string
  label: string
  status: string
  tone: 'accent' | 'warning'
}

function formatMonth(value: string) {
  const [year, month] = value.slice(0, 7).split('-')
  return `${year}년 ${Number(month)}월`
}

function formatDeadline(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return '마감일 확인 필요'
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'long',
    timeZone: 'Asia/Seoul',
  }).format(date)
}

function getMonthTasks(month: AdminDashboardMonth): AdminDashboardTask[] {
  const periodHref = `/admin/schedules?month=${month.yearMonth}`
  const monthLabel = formatMonth(month.yearMonth)
  const tasks: AdminDashboardTask[] = []

  if (!month.applicationPeriod) {
    tasks.push({
      href: periodHref,
      label: `${monthLabel} 신청 기간 설정`,
      status: '미설정',
      tone: 'warning',
    })
  } else if (month.applicationPeriod.requiresClose) {
    tasks.push({
      href: periodHref,
      label: `${monthLabel} 신청 마감 반영`,
      status: '기한 종료',
      tone: 'warning',
    })
  } else if (month.applicationPeriod.effectiveStatus === 'open') {
    tasks.push({
      href: periodHref,
      label: `${monthLabel} 신청 마감 예정`,
      status: formatDeadline(month.applicationPeriod.deadline),
      tone: 'accent',
    })
  }

  return tasks
}

export function getAdminDashboardTasks(viewModel: AdminDashboardViewModel): AdminDashboardTask[] {
  return viewModel.months.flatMap(getMonthTasks)
}
