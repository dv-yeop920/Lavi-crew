import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

export async function getOwnProfileRecord(userId: string) {
  const supabase = await createServerSupabaseClient()
  const result = await supabase
    .from('profiles')
    .select('id, email, name, phone, hourly_wage, is_active')
    .eq('id', userId)
    .maybeSingle()
  if (result.error) throw new Error('프로필을 조회하지 못했습니다.')
  return result.data
}

export async function updateOwnProfileRecord(input: { name: string; phone: string }) {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('update_own_profile', {
    candidate_name: input.name,
    candidate_phone: input.phone,
  })
}

export async function deactivateOwnProfileRecord() {
  const supabase = await createServerSupabaseClient()
  return supabase.rpc('deactivate_own_profile')
}

export async function signOutProfileSession() {
  return (await createServerSupabaseClient()).auth.signOut()
}
