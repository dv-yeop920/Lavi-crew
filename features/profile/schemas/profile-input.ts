import { z } from 'zod'

import type { FormActionResult } from '@/shared/forms/form-result'

export type ProfileActionResult = FormActionResult

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요.').min(2, '이름은 2자 이상 입력해 주세요.'),
  phone: z
    .string()
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(
      z
        .string()
        .min(1, '휴대폰 번호를 입력해 주세요.')
        .regex(/^01[0-9]{8,9}$/, '휴대폰 번호는 01X로 시작하는 10~11자리 번호여야 합니다.'),
    ),
})

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export function parseProfileUpdate(formData: FormData) {
  return profileUpdateSchema.safeParse({
    name: stringValue(formData, 'name'),
    phone: stringValue(formData, 'phone'),
  })
}
