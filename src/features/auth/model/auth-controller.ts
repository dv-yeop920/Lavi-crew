import 'server-only'

import { getAuthenticatedProfile } from '@/shared/auth/session'

import {
  checkSignupIdentity,
  resendSignupConfirmation,
  sendPasswordReset,
  signInWithPassword,
  signOut,
  signUpWorker,
  updatePassword,
} from '../api/auth-repository'
import type { AuthResult, LoginInput, SignupInput } from '../schema/auth-input'

import { getCanonicalAppOrigin } from './app-origin'
import {
  mapPasswordUpdateFailure,
  mapSignupFailure,
  mapSignupIdentityAvailability,
  repeatedSignupFailure,
} from './auth-error'

function appOrigin() {
  return getCanonicalAppOrigin(process.env.NEXT_PUBLIC_APP_URL)
}

async function safeSignOut() {
  try {
    await signOut()
  } catch {
    // Best-effort cleanup: never replace the safe authentication error with a raw provider error.
  }
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
  let profile: Awaited<ReturnType<typeof getAuthenticatedProfile>>
  try {
    profile = await getAuthenticatedProfile()
  } catch {
    await safeSignOut()
    return {
      code: 'PROFILE_LOOKUP_FAILED',
      message: '계정 정보를 확인하지 못했습니다. 잠시 후 다시 로그인해 주세요.',
      ok: false,
    }
  }
  if (profile) return { message: '로그인했습니다.', ok: true, role: profile.role }
  await safeSignOut()
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
    `${appOrigin()}/auth/callback?next=/verify-email`,
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
    `${appOrigin()}/auth/callback?next=/reset-password`,
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
    `${appOrigin()}/auth/callback?next=/verify-email`,
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
  if (error) return mapPasswordUpdateFailure(error)
  const { error: signOutError } = await signOut()
  return signOutError
    ? {
        code: 'SIGN_OUT_FAILED',
        message:
          '비밀번호는 변경했지만 세션을 종료하지 못했습니다. 로그아웃 후 다시 로그인해 주세요.',
        ok: false,
      }
    : { message: '비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.', ok: true }
}
