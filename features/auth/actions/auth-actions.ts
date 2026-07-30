'use server'

import { redirect } from 'next/navigation'

import { getZodFieldErrors } from '@/shared/forms/zod-errors'

import {
  loginController,
  logoutController,
  onboardingController,
  passwordResetController,
  signupController,
  updatePasswordController,
} from '../controllers/auth-controller'
import {
  type AuthResult,
  parseLoginInput,
  parseNewPassword,
  parseOnboardingInput,
  parsePasswordResetRequest,
  parseSignupInput,
} from '../schemas/auth-input'

export async function loginAction(_: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const parsed = parseLoginInput(formData)
  if (!parsed.success)
    return {
      code: 'INVALID_INPUT',
      fieldErrors: getZodFieldErrors(parsed.error),
      message: '로그인 정보를 확인해 주세요.',
      ok: false,
    }
  const result = await loginController(parsed.data)
  if (result.ok) redirect(result.role === 'admin' ? '/admin' : '/home')
  return result
}
export async function signupAction(_: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const parsed = parseSignupInput(formData)
  return parsed.success
    ? signupController(parsed.data)
    : {
        code: 'INVALID_INPUT',
        fieldErrors: getZodFieldErrors(parsed.error),
        message: '입력 항목별 안내를 확인해 주세요.',
        ok: false,
      }
}
export async function passwordResetAction(
  _: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = parsePasswordResetRequest(formData)
  return parsed.success
    ? passwordResetController(parsed.data.email)
    : {
        code: 'INVALID_EMAIL',
        fieldErrors: getZodFieldErrors(parsed.error),
        message: '이메일 주소를 확인해 주세요.',
        ok: false,
      }
}
export async function logoutAction() {
  await logoutController()
  redirect('/')
}
export async function onboardingAction(
  _: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = parseOnboardingInput(formData)
  const result = parsed.success
    ? await onboardingController(parsed.data)
    : {
        code: 'INVALID_INPUT',
        fieldErrors: getZodFieldErrors(parsed.error),
        message: '입력 항목별 안내를 확인해 주세요.',
        ok: false,
      }
  if (result.ok) redirect('/home')
  return result
}
export async function updatePasswordAction(
  _: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = parseNewPassword(formData)
  return parsed.success
    ? updatePasswordController(parsed.data.password)
    : {
        code: 'INVALID_PASSWORD',
        fieldErrors: getZodFieldErrors(parsed.error),
        message: '새 비밀번호 입력 항목을 확인해 주세요.',
        ok: false,
      }
}
