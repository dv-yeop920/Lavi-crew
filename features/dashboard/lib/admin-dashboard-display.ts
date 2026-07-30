import type { AdminDashboardViewModel } from '../schemas/admin-dashboard-view-model'

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

export function getAdminDashboardTasks(viewModel: AdminDashboardViewModel): AdminDashboardTask[] {
  const month = viewModel.currentMonth.yearMonth
  const scheduleHref = `/admin/schedules/new?month=${month}`
  const tasks: AdminDashboardTask[] = []

  if (!viewModel.applicationPeriod) {
    tasks.push({
      href: scheduleHref,
      label: `${formatMonth(month)} 신청 기간 설정`,
      status: '미설정',
      tone: 'warning',
    })
  } else if (viewModel.applicationPeriod.requiresClose) {
    tasks.push({
      href: scheduleHref,
      label: `${formatMonth(viewModel.applicationPeriod.yearMonth)} 신청 마감 반영`,
      status: '기한 종료',
      tone: 'warning',
    })
  } else if (viewModel.applicationPeriod.effectiveStatus === 'open') {
    tasks.push({
      href: scheduleHref,
      label: `${formatMonth(viewModel.applicationPeriod.yearMonth)} 신청 마감 예정`,
      status: formatDeadline(viewModel.applicationPeriod.deadline),
      tone: 'accent',
    })
  }

  if (viewModel.currentMonth.unregisteredWeekendCount > 0) {
    tasks.push({
      href: scheduleHref,
      label: `${formatMonth(month)} 스케줄 등록 필요`,
      status: `${viewModel.currentMonth.unregisteredWeekendCount}일`,
      tone: 'accent',
    })
  }

  return tasks
}
