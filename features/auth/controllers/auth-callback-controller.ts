import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { getSupabasePublicEnv } from '@/shared/supabase/env'

export async function exchangeAuthCallback(request: NextRequest, next: string) {
  const requestUrl = new URL(request.url)
  const response = NextResponse.redirect(new URL(next, requestUrl.origin))
  const { publishableKey, url } = getSupabasePublicEnv()
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) =>
        values.forEach(({ name, options, value }) => response.cookies.set(name, value, options)),
    },
  })
  const code = requestUrl.searchParams.get('code')
  if (code) await supabase.auth.exchangeCodeForSession(code)
  return response
}
