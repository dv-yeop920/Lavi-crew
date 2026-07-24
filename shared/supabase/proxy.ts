import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import type { Database } from './database.types'
import { getSupabasePublicEnv } from './env'

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { publishableKey, url } = getSupabasePublicEnv()
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        values.forEach(({ name, options, value }) => response.cookies.set(name, value, options))
      },
    },
  })
  await supabase.auth.getClaims()
  return response
}
