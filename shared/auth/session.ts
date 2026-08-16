import 'server-only'

import { redirect } from 'next/navigation'
import { cache } from 'react'

import { getVerifiedUserId } from '@/shared/auth/claims'
import { createServerSupabaseClient } from '@/shared/supabase/server'

export type AuthRole = 'admin' | 'worker'
export type AuthenticatedProfile = { id: string; isActive: boolean; name: string; role: AuthRole }

export const getAuthenticatedProfile = cache(
  async function getAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
    const supabase = await createServerSupabaseClient()
    const { data: claimsData } = await supabase.auth.getClaims()
    const userId = getVerifiedUserId(claimsData?.claims)
    if (!userId) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, is_active')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw new Error('인증된 사용자 프로필을 조회하지 못했습니다.')
    if (!data || !data.is_active || (data.role !== 'admin' && data.role !== 'worker')) return null
    return { id: data.id, isActive: data.is_active, name: data.name, role: data.role }
  },
)

export const getSessionUserId = cache(async function getSessionUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  return getVerifiedUserId(claimsData?.claims)
})

export async function requireRole(role: AuthRole) {
  const profile = await getAuthenticatedProfile()
  if (!profile) redirect('/')
  if (profile.role !== role) redirect(profile.role === 'admin' ? '/admin' : '/home')
  return profile
}
