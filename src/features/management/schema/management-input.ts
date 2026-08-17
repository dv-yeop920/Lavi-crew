import { z } from 'zod'

import type { FormActionResult } from '@/shared/forms/form-result'

export type ManagementActionResult = FormActionResult

const positionIdSchema = z.string().regex(/^[a-z-]{3,24}$/, '가능한 포지션 값이 올바르지 않습니다.')

function getKoreanDate(asOf: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(asOf)
}

function isCalendarDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

function workerUpdateSchema(asOf: Date) {
  return z.object({
    hiredAt: z
      .string()
      .trim()
      .min(1, '입사일을 입력해 주세요.')
      .regex(/^\d{4}-\d{2}-\d{2}$/, '입사일 형식이 올바르지 않습니다.')
      .refine(isCalendarDate, '존재하는 날짜를 입력해 주세요.')
      .refine((value) => value <= getKoreanDate(asOf), '입사일은 오늘 이전 날짜여야 합니다.'),
    hourlyWage: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN),
      z
        .number({ error: '개인 시급을 숫자로 입력해 주세요.' })
        .int('개인 시급은 원 단위의 정수로 입력해 주세요.')
        .positive('개인 시급은 0원보다 커야 합니다.'),
    ),
    name: z
      .string()
      .trim()
      .min(1, '이름을 입력해 주세요.')
      .min(2, '이름은 2자 이상 입력해 주세요.'),
    positionIds: z.array(positionIdSchema).transform((values) => [...new Set(values)]),
  })
}

function inviteCreateSchema(asOf: Date) {
  return z
    .object({
      expiresAt: z
        .string()
        .trim()
        .min(1, '만료일을 선택해 주세요.')
        .regex(/^\d{4}-\d{2}-\d{2}$/, '만료일 형식이 올바르지 않습니다.')
        .refine(isCalendarDate, '존재하는 날짜를 선택해 주세요.')
        .refine(
          (value) => value >= getKoreanDate(asOf),
          '만료일은 오늘 또는 이후 날짜여야 합니다.',
        ),
      label: z
        .string()
        .trim()
        .min(1, '코드 설명을 입력해 주세요.')
        .max(60, '코드 설명은 60자 이하로 입력해 주세요.'),
      maxUses: z.preprocess(
        (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN),
        z
          .number({ error: '사용 가능 횟수를 숫자로 입력해 주세요.' })
          .int('사용 가능 횟수는 정수로 입력해 주세요.')
          .positive('사용 가능 횟수는 1회 이상이어야 합니다.'),
      ),
    })
    .transform((value) => ({
      ...value,
      expiresAt: `${value.expiresAt}T23:59:59+09:00`,
    }))
}

const uuidSchema = z.string().uuid()

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export function parseWorkerUpdate(formData: FormData, asOf = new Date()) {
  return workerUpdateSchema(asOf).safeParse({
    hiredAt: stringValue(formData, 'hiredAt'),
    hourlyWage: stringValue(formData, 'hourlyWage'),
    name: stringValue(formData, 'name'),
    positionIds: formData
      .getAll('positionIds')
      .filter((value): value is string => typeof value === 'string'),
  })
}

export function parseInviteCreate(formData: FormData, asOf = new Date()) {
  return inviteCreateSchema(asOf).safeParse({
    expiresAt: stringValue(formData, 'expiresAt'),
    label: stringValue(formData, 'label'),
    maxUses: stringValue(formData, 'maxUses'),
  })
}

export function parseUuid(value: unknown) {
  return uuidSchema.safeParse(value)
}
