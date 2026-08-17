import 'server-only'

import { redirect } from 'next/navigation'

import { getAuthenticatedProfile, getSessionUserId } from '@/shared/auth/session'

import { getWorkerHomeRecords } from '../api/worker-home-repository'
import type { WorkerHomeViewModel } from '../schema/worker-home-view-model'

function kstDate(asOf: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(asOf)
}

export async function getWorkerHomeController(asOf = new Date()): Promise<WorkerHomeViewModel> {
  const userId = await getSessionUserId()
  if (!userId) redirect('/')
  const today = kstDate(asOf)
  const [profile, records] = await Promise.all([
    getAuthenticatedProfile(),
    getWorkerHomeRecords({
      currentMonthStart: `${today.slice(0, 7)}-01`,
      nowIso: asOf.toISOString(),
      today,
      workerId: userId,
    }),
  ])
  if (!profile || profile.role !== 'worker') redirect(profile?.role === 'admin' ? '/admin' : '/')
  const nextAssignment =
    records.nextAssignments.find(
      (assignment) =>
        new Date(`${assignment.shifts.work_date}T${assignment.shifts.start_time}+09:00`) > asOf,
    ) ?? null
  const notices: WorkerHomeViewModel['notices'] = records.notices.map((notice) => ({
    contentPreview: notice.content.slice(0, 120),
    createdAt: notice.created_at,
    id: notice.id,
    isPinned: notice.is_pinned,
    isRead: notice.notice_reads.some((read) => read.worker_id === profile.id),
    title: notice.title,
  }))
  const visibleNotices = notices
    .sort((left, right) => {
      if (left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1
      return right.createdAt.localeCompare(left.createdAt)
    })
    .slice(0, 3)
  return {
    application: records.period
      ? {
          appliedCount: records.applicationCount,
          deadline: records.period.application_deadline,
          periodId: records.period.id,
          yearMonth: records.period.year_month,
        }
      : null,
    name: profile.name,
    nextShift: nextAssignment
      ? {
          assignmentId: nextAssignment.id,
          date: nextAssignment.shifts.work_date,
          endTime: nextAssignment.shifts.end_time.slice(0, 5),
          isTraining: nextAssignment.is_training,
          positionName: nextAssignment.positions.name,
          shiftId: nextAssignment.shifts.id,
          startTime: nextAssignment.shifts.start_time.slice(0, 5),
        }
      : null,
    notices: visibleNotices,
  }
}
