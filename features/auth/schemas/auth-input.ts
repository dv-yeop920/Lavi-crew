import { z } from 'zod'

import type { FormActionResult } from '@/shared/forms/form-result'

const emailSchema = z
  .string()
  .trim()
  .min(1, '이메일을 입력해 주세요.')
  .email('이메일 형식이 올바르지 않습니다.')
  .transform((value) => value.toLowerCase())

const passwordSchema = z
  .string()
  .min(1, '비밀번호를 입력해 주세요.')
  .min(8, '비밀번호는 8자 이상 입력해 주세요.')

const nameSchema = z
  .string()
  .trim()
  .min(1, '이름을 입력해 주세요.')
  .min(2, '이름은 2자 이상 입력해 주세요.')

const phoneSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(
    z
      .string()
      .min(1, '휴대폰 번호를 입력해 주세요.')
      .regex(/^01[0-9]{8,9}$/, '휴대폰 번호는 01X로 시작하는 10~11자리 번호여야 합니다.'),
  )

const inviteCodeSchema = z
  .string()
  .trim()
  .min(1, '라비에벨 전용 코드를 입력해 주세요.')
  .min(6, '라비에벨 전용 코드는 6자 이상이어야 합니다.')
  .transform((value) => value.toUpperCase())

const kakaoConsentSchema = z.literal(true, {
  error: '카카오 알림톡 수신에 동의해 주세요.',
})

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const signupSchema = z
  .object({
    email: emailSchema,
    inviteCode: inviteCodeSchema,
    kakaoConsent: kakaoConsentSchema,
    name: nameSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해 주세요.'),
    phone: phoneSchema,
  })
  .superRefine((value, context) => {
    if (value.password !== value.passwordConfirm) {
      context.addIssue({
        code: 'custom',
        message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
        path: ['passwordConfirm'],
      })
    }
  })

export const passwordResetRequestSchema = z.object({ email: emailSchema })

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string().min(1, '새 비밀번호 확인을 입력해 주세요.'),
  })
  .superRefine((value, context) => {
    if (value.password !== value.passwordConfirm) {
      context.addIssue({
        code: 'custom',
        message: '새 비밀번호와 비밀번호 확인이 일치하지 않습니다.',
        path: ['passwordConfirm'],
      })
    }
  })

export type AuthResult = FormActionResult
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export function parseLoginInput(formData: FormData) {
  return loginSchema.safeParse({
    email: stringValue(formData, 'email'),
    password: stringValue(formData, 'password'),
  })
}

export function parseSignupInput(formData: FormData) {
  return signupSchema.safeParse({
    email: stringValue(formData, 'email'),
    inviteCode: stringValue(formData, 'inviteCode'),
    kakaoConsent: formData.get('kakaoConsent') === 'on',
    name: stringValue(formData, 'name'),
    password: stringValue(formData, 'password'),
    passwordConfirm: stringValue(formData, 'passwordConfirm'),
    phone: stringValue(formData, 'phone'),
  })
}

export function parsePasswordResetRequest(formData: FormData) {
  return passwordResetRequestSchema.safeParse({
    email: stringValue(formData, 'email'),
  })
}

export function parseNewPassword(formData: FormData) {
  return newPasswordSchema.safeParse({
    password: stringValue(formData, 'password'),
    passwordConfirm: stringValue(formData, 'passwordConfirm'),
  })
}
