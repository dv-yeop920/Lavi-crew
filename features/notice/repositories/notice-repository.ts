import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

export async function getWorkerNoticeRecords() {
  const result = await (
    await createServerSupabaseClient()
  )
    .from('notices')
    .select('id, title, content, is_pinned, created_at, updated_at, notice_reads(worker_id)')
    .eq('status', 'published')
  if (result.error) throw new Error('공지 목록을 조회하지 못했습니다.')
  return result.data ?? []
}

export async function getAdminNoticeRecords() {
  const supabase = await createServerSupabaseClient()
  const [notices, workers] = await Promise.all([
    supabase
      .from('notices')
      .select('id, title, content, is_pinned, created_at, updated_at, notice_reads(worker_id)')
      .eq('status', 'published'),
    supabase.from('profiles').select('id').eq('role', 'worker').eq('is_active', true),
  ])
  if (notices.error || workers.error) throw new Error('공지 관리 데이터를 조회하지 못했습니다.')
  return { notices: notices.data ?? [], workers: workers.data ?? [] }
}

export async function createNoticeRecord(input: {
  content: string
  isPinned: boolean
  requestId: string
  title: string
}) {
  return (await createServerSupabaseClient()).rpc('create_notice', {
    p_content: input.content,
    p_is_pinned: input.isPinned,
    p_request_id: input.requestId,
    p_title: input.title,
  })
}

export async function updateNoticeRecord(input: {
  content: string
  expectedUpdatedAt: string
  isPinned: boolean
  noticeId: string
  requestId: string
  title: string
}) {
  return (await createServerSupabaseClient()).rpc('update_notice', {
    p_content: input.content,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_is_pinned: input.isPinned,
    p_notice_id: input.noticeId,
    p_request_id: input.requestId,
    p_title: input.title,
  })
}

export async function deleteNoticeRecord(input: {
  expectedUpdatedAt: string
  noticeId: string
  requestId: string
}) {
  return (await createServerSupabaseClient()).rpc('delete_notice', {
    p_expected_updated_at: input.expectedUpdatedAt,
    p_notice_id: input.noticeId,
    p_request_id: input.requestId,
  })
}

export async function markNoticeReadRecord(input: { noticeId: string; requestId: string }) {
  return (await createServerSupabaseClient()).rpc('mark_notice_read', {
    p_notice_id: input.noticeId,
    p_request_id: input.requestId,
  })
}
