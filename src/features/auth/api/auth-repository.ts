import 'server-only'

import { createServerSupabaseClient } from '@/shared/supabase/server'

import type { LoginInput, SignupInput } from '../schema/auth-input'

export async function checkSignupIdentity(input: SignupInput) {
  return (await createServerSupabaseClient())
    .rpc('check_signup_identity', {
      candidate_invite_code: input.inviteCode,
      candidate_name: input.name,
      candidate_phone: input.phone,
    })
    .single()
}

export async function signInWithPassword(input: LoginInput) {
  return (await createServerSupabaseClient()).auth.signInWithPassword(input)
}
export async function signUpWorker(input: SignupInput, emailRedirectTo: string) {
  return (await createServerSupabaseClient()).auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        hired_at: input.hiredAt,
        invite_code: input.inviteCode,
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
export async function resendSignupConfirmation(email: string, emailRedirectTo: string) {
  return (await createServerSupabaseClient()).auth.resend({
    email,
    options: { emailRedirectTo },
    type: 'signup',
  })
}
export async function signOut() {
  return (await createServerSupabaseClient()).auth.signOut()
}
export async function updatePassword(password: string) {
  return (await createServerSupabaseClient()).auth.updateUser({ password })
}
