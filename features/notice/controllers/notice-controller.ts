import 'server-only'

import { requireRole } from '@/shared/auth/session'

import { getNoticeMutationError } from '../domain/notice-mutation-error'
import { countActiveNoticeReads, sortNoticesPinnedFirst } from '../domain/notice-read-models'
import {
  createNoticeRecord,
  deleteNoticeRecord,
  getAdminNoticeRecords,
  getWorkerNoticeRecords,
  markNoticeReadRecord,
  updateNoticeRecord,
} from '../repositories/notice-repository'
import type {
  CreateNoticeInput,
  DeleteNoticeInput,
  MarkNoticeReadInput,
  NoticeActionResult,
  UpdateNoticeInput,
} from '../schemas/notice-input'
import type { AdminNoticeViewModel, WorkerNoticeViewModel } from '../schemas/notice-view-model'

function mapMutationError(error: { message: string } | null): NoticeActionResult | null {
  if (!error) return null
  const mapped = getNoticeMutationError(error.message)
  return {
    code: mapped.code,
    message: mapped.message,
    ok: false,
  }
}

export async function getWorkerNoticesController(): Promise<WorkerNoticeViewModel> {
  const worker = await requireRole('worker')
  const records = await getWorkerNoticeRecords()
  return {
    notices: sortNoticesPinnedFirst(
      records.map((notice) => ({
        content: notice.content,
        createdAt: notice.created_at,
        id: notice.id,
        isPinned: notice.is_pinned,
        isRead: notice.notice_reads.some((read) => read.worker_id === worker.id),
        title: notice.title,
        updatedAt: notice.updated_at,
      })),
    ),
  }
}

export async function getAdminNoticesController(): Promise<AdminNoticeViewModel> {
  await requireRole('admin')
  const records = await getAdminNoticeRecords()
  const activeWorkerIds = new Set(records.workers.map((worker) => worker.id))
  const activeWorkerCount = activeWorkerIds.size
  return {
    activeWorkerCount,
    notices: sortNoticesPinnedFirst(
      records.notices.map((notice) => ({
        activeWorkerCount,
        content: notice.content,
        createdAt: notice.created_at,
        id: notice.id,
        isPinned: notice.is_pinned,
        readCount: countActiveNoticeReads(
          notice.notice_reads.map((read) => read.worker_id),
          activeWorkerIds,
        ),
        title: notice.title,
        updatedAt: notice.updated_at,
      })),
    ),
  }
}

export async function createNoticeController(
  input: CreateNoticeInput,
): Promise<NoticeActionResult> {
  await requireRole('admin')
  const result = await createNoticeRecord(input)
  return (
    mapMutationError(result.error) ?? {
      data: result.data as Record<string, unknown>,
      message: '공지를 등록했습니다.',
      ok: true,
    }
  )
}

export async function updateNoticeController(
  input: UpdateNoticeInput,
): Promise<NoticeActionResult> {
  await requireRole('admin')
  const result = await updateNoticeRecord(input)
  return (
    mapMutationError(result.error) ?? {
      data: result.data as Record<string, unknown>,
      message: '공지를 수정했습니다.',
      ok: true,
    }
  )
}

export async function deleteNoticeController(
  input: DeleteNoticeInput,
): Promise<NoticeActionResult> {
  await requireRole('admin')
  const result = await deleteNoticeRecord(input)
  return (
    mapMutationError(result.error) ?? {
      data: result.data as Record<string, unknown>,
      message: '공지를 삭제했습니다.',
      ok: true,
    }
  )
}

export async function markNoticeReadController(
  input: MarkNoticeReadInput,
): Promise<NoticeActionResult> {
  await requireRole('worker')
  const result = await markNoticeReadRecord(input)
  return (
    mapMutationError(result.error) ?? {
      data: result.data as Record<string, unknown>,
      message: '공지 읽음을 기록했습니다.',
      ok: true,
    }
  )
}
