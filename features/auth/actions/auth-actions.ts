'use server'

import { redirect } from 'next/navigation'

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
  parseSignupInput,
} from '../schemas/auth-input'

export async function loginAction(_: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const input = parseLoginInput(Object.fromEntries(formData))
  if (!input)
    return {
      code: 'INVALID_INPUT',
      message: '이메일과 8자 이상 비밀번호를 확인해 주세요.',
      ok: false,
    }
  const result = await loginController(input)
  if (result.ok) redirect(result.role === 'admin' ? '/admin' : '/home')
  return result
}
export async function signupAction(_: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const input = parseSignupInput({
    ...Object.fromEntries(formData),
    kakaoConsent: formData.get('kakaoConsent') === 'on',
  })
  return input
    ? signupController(input)
    : { code: 'INVALID_INPUT', message: '입력한 가입 정보를 다시 확인해 주세요.', ok: false }
}
export async function passwordResetAction(
  _: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const email =
    typeof formData.get('email') === 'string'
      ? String(formData.get('email')).trim().toLowerCase()
      : ''
  return /^\S+@\S+\.\S+$/.test(email)
    ? passwordResetController(email)
    : { code: 'INVALID_EMAIL', message: '이메일 주소를 확인해 주세요.', ok: false }
}
export async function logoutAction() {
  await logoutController()
  redirect('/')
}
export async function onboardingAction(
  _: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const input = parseOnboardingInput({
    ...Object.fromEntries(formData),
    kakaoConsent: formData.get('kakaoConsent') === 'on',
  })
  const result = input
    ? await onboardingController(input)
    : { code: 'INVALID_INPUT', message: '입력한 정보를 다시 확인해 주세요.', ok: false }
  if (result.ok) redirect('/home')
  return result
}
export async function updatePasswordAction(
  _: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const password = parseNewPassword(Object.fromEntries(formData))
  return password
    ? updatePasswordController(password)
    : {
        code: 'INVALID_PASSWORD',
        message: '비밀번호와 확인 값이 일치하는지 확인해 주세요.',
        ok: false,
      }
}
