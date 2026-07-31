import 'server-only'

import { headers } from 'next/headers'

import { getAuthenticatedProfile } from '@/shared/auth/session'

import {
  mapPasswordUpdateFailure,
  mapSignupFailure,
  mapSignupIdentityAvailability,
  repeatedSignupFailure,
} from '../domain/auth-error'
import {
  checkSignupIdentity,
  resendSignupConfirmation,
  sendPasswordReset,
  signInWithPassword,
  signOut,
  signUpWorker,
  updatePassword,
} from '../repositories/auth-repository'
import type { AuthResult, LoginInput, SignupInput } from '../schemas/auth-input'

async function appOrigin() {
  return (
    (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  )
}
export async function loginController(
  input: LoginInput,
): Promise<AuthResult & { role?: 'admin' | 'worker' }> {
  const { error } = await signInWithPassword(input)
  if (error)
    return {
      code: 'INVALID_CREDENTIALS',
      message: '이메일 또는 비밀번호를 다시 확인해 주세요.',
      ok: false,
    }
  const profile = await getAuthenticatedProfile()
  if (profile) return { message: '로그인했습니다.', ok: true, role: profile.role }
  await signOut()
  return {
    code: 'ACCOUNT_UNAVAILABLE',
    message: '이메일 확인 또는 계정 활성 상태를 관리자에게 확인해 주세요.',
    ok: false,
  }
}
export async function signupController(input: SignupInput): Promise<AuthResult> {
  const { data: availability, error: availabilityError } = await checkSignupIdentity(input)
  if (availabilityError || !availability)
    return {
      code: 'SIGNUP_VALIDATION_FAILED',
      message: '가입 정보를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      ok: false,
    }

  const identityFailure = mapSignupIdentityAvailability(availability)
  if (identityFailure) return identityFailure

  const { data, error } = await signUpWorker(
    input,
    `${await appOrigin()}/auth/callback?next=/verify-email`,
  )
  if (error) {
    if (error.message.includes('Database error saving new user')) {
      const { data: latestAvailability } = await checkSignupIdentity(input)
      if (latestAvailability) {
        const raceFailure = mapSignupIdentityAvailability(latestAvailability)
        if (raceFailure) return raceFailure
      }
    }
    return mapSignupFailure(error)
  }
  if (data.user?.identities?.length === 0) return repeatedSignupFailure()
  return { message: '가입 이메일로 확인 링크를 보냈습니다.', ok: true }
}
export async function passwordResetController(email: string): Promise<AuthResult> {
  const { error } = await sendPasswordReset(
    email,
    `${await appOrigin()}/auth/callback?next=/reset-password`,
  )
  return error
    ? {
        code: 'RESET_FAILED',
        message: '재설정 링크를 보낼 수 없습니다. 잠시 후 다시 시도해 주세요.',
        ok: false,
      }
    : { message: '입력한 이메일로 재설정 링크를 보냈습니다.', ok: true }
}
export async function resendConfirmationController(email: string): Promise<AuthResult> {
  const { error } = await resendSignupConfirmation(
    email,
    `${await appOrigin()}/auth/callback?next=/verify-email`,
  )
  return error
    ? {
        code: 'CONFIRMATION_RESEND_FAILED',
        message: '확인 링크를 보낼 수 없습니다. 잠시 후 다시 시도해 주세요.',
        ok: false,
      }
    : { message: '입력한 이메일로 새 확인 링크를 보냈습니다.', ok: true }
}
export async function logoutController() {
  await signOut()
}
export async function updatePasswordController(password: string): Promise<AuthResult> {
  const { error } = await updatePassword(password)
  return error
    ? mapPasswordUpdateFailure(error)
    : { message: '비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.', ok: true }
}
