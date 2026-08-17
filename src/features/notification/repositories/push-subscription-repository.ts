import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

export async function upsertPushSubscriptionRecord(input: {
  endpoint: string
  keyAuth: string
  keyP256dh: string
}) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('upsert_push_subscription', {
    p_endpoint: input.endpoint,
    p_key_auth: input.keyAuth,
    p_key_p256dh: input.keyP256dh,
  })
}

export async function deletePushSubscriptionRecord(endpoint: string) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('delete_push_subscription', { p_endpoint: endpoint })
}
