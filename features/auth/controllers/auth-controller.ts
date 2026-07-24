import 'server-only'

import { headers } from 'next/headers'

import { getAuthenticatedProfile } from '@/shared/auth/session'

import {
  completeWorkerOnboarding,
  sendPasswordReset,
  signInWithPassword,
  signOut,
  signUpWorker,
  updatePassword,
} from '../repositories/auth-repository'
import type { AuthResult, LoginInput, OnboardingInput, SignupInput } from '../schemas/auth-input'

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
  if (profile) return { ok: true, role: profile.role }
  await signOut()
  return {
    code: 'ACCOUNT_UNAVAILABLE',
    message: '이메일 확인 또는 계정 활성 상태를 관리자에게 확인해 주세요.',
    ok: false,
  }
}
export async function signupController(input: SignupInput): Promise<AuthResult> {
  const { error } = await signUpWorker(
    input,
    `${await appOrigin()}/auth/callback?next=/verify-email`,
  )
  return error
    ? {
        code: 'SIGNUP_FAILED',
        message: '가입 정보를 확인하거나 관리자에게 초대 코드를 문의해 주세요.',
        ok: false,
      }
    : { message: '가입 이메일로 확인 링크를 보냈습니다.', ok: true }
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
export async function logoutController() {
  await signOut()
}
export async function onboardingController(input: OnboardingInput): Promise<AuthResult> {
  const { error } = await completeWorkerOnboarding(input)
  return error
    ? { code: 'ONBOARDING_FAILED', message: '초대 코드 또는 입력 정보를 확인해 주세요.', ok: false }
    : { message: '크루 정보를 등록했습니다.', ok: true }
}
export async function updatePasswordController(password: string): Promise<AuthResult> {
  const { error } = await updatePassword(password)
  return error
    ? {
        code: 'PASSWORD_UPDATE_FAILED',
        message: '비밀번호를 변경할 수 없습니다. 재설정 링크를 다시 요청해 주세요.',
        ok: false,
      }
    : { message: '비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.', ok: true }
}
