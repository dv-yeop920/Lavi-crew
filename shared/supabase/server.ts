import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from './database.types'
import { getSupabasePublicEnv } from './env'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const { publishableKey, url } = getSupabasePublicEnv()
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, options, value }) => cookieStore.set(name, value, options))
        } catch {}
      },
    },
  })
}
