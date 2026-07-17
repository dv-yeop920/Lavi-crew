import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

import type { LoginInput, OnboardingInput, SignupInput } from '../schemas/auth-input'

export async function signInWithPassword(input: LoginInput) {
  return (await createServerSupabaseClient()).auth.signInWithPassword(input)
}
export async function signUpWorker(input: SignupInput, emailRedirectTo: string) {
  return (await createServerSupabaseClient()).auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        invite_code: input.inviteCode,
        kakao_consent: input.kakaoConsent,
        name: input.name,
        phone: input.phone,
      },
      emailRedirectTo,
    },
  })
}
export async function sendPasswordReset(email: string, redirectTo: string) {
  return (await createServerSupabaseClient()).auth.resetPasswordForEmail(email, { redirectTo })
}
export async function signOut() {
  return (await createServerSupabaseClient()).auth.signOut()
}
export async function completeWorkerOnboarding(input: OnboardingInput) {
  return (await createServerSupabaseClient()).rpc('complete_worker_onboarding', {
    candidate_invite_code: input.inviteCode,
    candidate_name: input.name,
    candidate_phone: input.phone,
    consent: input.kakaoConsent,
  })
}
export async function updatePassword(password: string) {
  return (await createServerSupabaseClient()).auth.updateUser({ password })
}
