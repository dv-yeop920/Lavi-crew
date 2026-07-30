import { timingSafeEqual } from 'node:crypto'

import {
  isNotificationConfigurationError,
  processNotificationsController,
} from '@/features/notification'

export const runtime = 'nodejs'

function safeJson(body: Record<string, boolean | number | string>, status: number) {
  return Response.json(body, {
    headers: { 'Cache-Control': 'no-store' },
    status,
  })
}

function isValidCronAuthorization(authorization: string | null, secret: string) {
  if (!authorization?.startsWith('Bearer ')) return false
  const provided = Buffer.from(authorization.slice('Bearer '.length))
  const expected = Buffer.from(secret)
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || cronSecret.length < 32)
    return safeJson({ code: 'PROCESSOR_NOT_CONFIGURED', ok: false }, 503)
  if (!isValidCronAuthorization(request.headers.get('authorization'), cronSecret))
    return safeJson({ code: 'UNAUTHORIZED', ok: false }, 401)
  try {
    const summary = await processNotificationsController()
    return safeJson({ ...summary, ok: true }, 200)
  } catch (error) {
    if (isNotificationConfigurationError(error))
      return safeJson({ code: 'PROCESSOR_NOT_CONFIGURED', ok: false }, 503)
    return safeJson({ code: 'PROCESSOR_FAILED', ok: false }, 500)
  }
}
