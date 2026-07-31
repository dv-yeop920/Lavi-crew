import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import type { Database } from '@/shared/supabase/database.types'
import { getSupabasePublicEnv } from '@/shared/supabase/env'

export async function exchangeAuthCallback(request: NextRequest, next: string) {
  const requestUrl = new URL(request.url)
  const errorUrl = new URL('/auth/error', requestUrl.origin)
  errorUrl.searchParams.set('flow', next === '/reset-password' ? 'reset-password' : 'verify-email')
  const response = NextResponse.redirect(new URL(next, requestUrl.origin))
  const { publishableKey, url } = getSupabasePublicEnv()
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) =>
        values.forEach(({ name, options, value }) => response.cookies.set(name, value, options)),
    },
  })
  const code = requestUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(errorUrl)
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(errorUrl)
  return response
}
