import type { NextRequest } from 'next/server'

import { exchangeAuthCallback } from '@/features/auth'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const requestedNext = requestUrl.searchParams.get('next')
  const allowedNext = new Set(['/onboarding', '/reset-password', '/verify-email'])
  const next = requestedNext && allowedNext.has(requestedNext) ? requestedNext : '/'
  return exchangeAuthCallback(request, next)
}
