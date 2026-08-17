import { z } from 'zod'

import type { FormActionResult } from '@/shared/forms/form-result'

const requestSchema = z.object({
  requestId: z.uuid(),
})
const noticeIdSchema = z.object({
  noticeId: z.uuid(),
})
const versionSchema = z.object({
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
})
const noticeContentSchema = z.object({
  content: z.string().trim().min(1, '공지 내용을 입력해 주세요.').max(10000),
  isPinned: z.boolean(),
  title: z.string().trim().min(1, '공지 제목을 입력해 주세요.').max(120),
})

export const createNoticeSchema = requestSchema.extend(noticeContentSchema.shape)
export const updateNoticeSchema = requestSchema
  .extend(noticeIdSchema.shape)
  .extend(versionSchema.shape)
  .extend(noticeContentSchema.shape)
export const deleteNoticeSchema = requestSchema
  .extend(noticeIdSchema.shape)
  .extend(versionSchema.shape)
export const markNoticeReadSchema = requestSchema.extend(noticeIdSchema.shape)

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>
export type DeleteNoticeInput = z.infer<typeof deleteNoticeSchema>
export type MarkNoticeReadInput = z.infer<typeof markNoticeReadSchema>
export type NoticeActionResult = FormActionResult & { data?: Record<string, unknown> }

export function parseNoticeFormData<T extends z.ZodType>(formData: FormData, schema: T) {
  const payload = formData.get('payload')
  if (typeof payload !== 'string') return schema.safeParse(null)
  try {
    return schema.safeParse(JSON.parse(payload) as unknown)
  } catch {
    return schema.safeParse(null)
  }
}
