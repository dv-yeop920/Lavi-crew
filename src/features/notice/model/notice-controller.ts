import 'server-only'

import { requireRole } from '@/shared/auth/session'

import {
  createNoticeRecord,
  deleteNoticeRecord,
  getAdminNoticeRecords,
  getWorkerNoticeRecords,
  markNoticeReadRecord,
  updateNoticeRecord,
} from '../api/notice-repository'
import type {
  CreateNoticeInput,
  DeleteNoticeInput,
  MarkNoticeReadInput,
  NoticeActionResult,
  UpdateNoticeInput,
} from '../schema/notice-input'
import type { AdminNoticeViewModel, WorkerNoticeViewModel } from '../schema/notice-view-model'

import { getNoticeMutationError } from './notice-mutation-error'
import { countActiveNoticeReads, sortNoticesPinnedFirst } from './notice-read-models'

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
  const [worker, records] = await Promise.all([requireRole('worker'), getWorkerNoticeRecords()])
  const notices: WorkerNoticeViewModel['notices'] = records.map((notice) => ({
    content: notice.content,
    createdAt: notice.created_at,
    id: notice.id,
    isPinned: notice.is_pinned,
    isRead: notice.notice_reads.some((read) => read.worker_id === worker.id),
    title: notice.title,
    updatedAt: notice.updated_at,
  }))
  return {
    notices: sortNoticesPinnedFirst(notices),
  }
}

export async function getAdminNoticesController(): Promise<AdminNoticeViewModel> {
  const [, records] = await Promise.all([requireRole('admin'), getAdminNoticeRecords()])
  const activeWorkerIds = new Set(records.workers.map((worker) => worker.id))
  const activeWorkerCount = activeWorkerIds.size
  const notices: AdminNoticeViewModel['notices'] = records.notices.map((notice) => ({
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
  }))
  return {
    activeWorkerCount,
    notices: sortNoticesPinnedFirst(notices),
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
