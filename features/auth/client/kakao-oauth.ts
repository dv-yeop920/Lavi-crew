'use client'

import { createBrowserClient } from '@supabase/ssr'

export function startKakaoOAuth(redirectTo: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) return Promise.resolve({ error: new Error('SUPABASE_ENV_MISSING') })
  return createBrowserClient(url, publishableKey).auth.signInWithOAuth({
    provider: 'kakao',
    options: { redirectTo },
  })
}
