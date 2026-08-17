import { timingSafeEqual } from 'node:crypto'

import { processNotificationsAction } from '@/features/notification/api/process-notifications-action'

export const runtime = 'nodejs'

function safeJson(body: Record<string, boolean | number | string>, status: number) {
  return Response.json(body, {
    headers: { 'Cache-Control': 'no-store' },
    status,
  })
}

function isValidToken(provided: string | null, secret: string) {
  if (!provided) return false
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(secret)
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  )
}

function isValidCronAuthorization(authorization: string | null, secret: string) {
  if (!authorization?.startsWith('Bearer ')) return false
  return isValidToken(authorization.slice('Bearer '.length), secret)
}

async function runProcessor() {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || cronSecret.length < 32)
    return safeJson({ code: 'PROCESSOR_NOT_CONFIGURED', ok: false }, 503)
  const result = await processNotificationsAction()
  if (!result.ok) {
    const status = result.code === 'PROCESSOR_NOT_CONFIGURED' ? 503 : 500
    return safeJson({ code: result.code, ok: false }, status)
  }
  return safeJson({ ...result.summary, ok: true }, 200)
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || cronSecret.length < 32)
    return safeJson({ code: 'PROCESSOR_NOT_CONFIGURED', ok: false }, 503)
  if (!isValidCronAuthorization(request.headers.get('authorization'), cronSecret))
    return safeJson({ code: 'UNAUTHORIZED', ok: false }, 401)
  return runProcessor()
}

// Vercel Cron only issues GET requests and authenticates them with the
// `x-vercel-cron-auth` header instead of a Bearer Authorization header.
// See: https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || cronSecret.length < 32)
    return safeJson({ code: 'PROCESSOR_NOT_CONFIGURED', ok: false }, 503)
  if (!isValidToken(request.headers.get('x-vercel-cron-auth'), cronSecret))
    return safeJson({ code: 'UNAUTHORIZED', ok: false }, 401)
  return runProcessor()
}
