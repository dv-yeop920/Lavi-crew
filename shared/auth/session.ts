import 'server-only'

import { redirect } from 'next/navigation'

import { createServerSupabaseClient } from '@/shared/supabase/server'

export type AuthRole = 'admin' | 'worker'
export type AuthenticatedProfile = { id: string; isActive: boolean; name: string; role: AuthRole }

export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
  const supabase = await createServerSupabaseClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims.sub
  if (typeof userId !== 'string' || !claimsData?.claims.email_confirmed_at) return null
  const { data } = await supabase
    .from('profiles')
    .select('id, name, role, is_active')
    .eq('id', userId)
    .maybeSingle()
  if (!data || !data.is_active || (data.role !== 'admin' && data.role !== 'worker')) return null
  return { id: data.id, isActive: data.is_active, name: data.name, role: data.role }
}

export async function requireRole(role: AuthRole) {
  const profile = await getAuthenticatedProfile()
  if (!profile) redirect('/')
  if (profile.role !== role) redirect(profile.role === 'admin' ? '/admin' : '/home')
  return profile
}
