export type AuthResult = { code?: string; message?: string; ok: boolean }
export type LoginInput = { email: string; password: string }
export type SignupInput = {
  email: string
  inviteCode: string
  kakaoConsent: boolean
  name: string
  password: string
  passwordConfirm: string
  phone: string
}
export type OnboardingInput = {
  inviteCode: string
  kakaoConsent: boolean
  name: string
  phone: string
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const isEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value)
export function parseLoginInput(input: unknown): LoginInput | null {
  if (!input || typeof input !== 'object') return null
  const value = input as Record<string, unknown>
  const email = text(value.email).toLowerCase()
  const password = text(value.password)
  return isEmail(email) && password.length >= 8 ? { email, password } : null
}
export function parseSignupInput(input: unknown): SignupInput | null {
  if (!input || typeof input !== 'object') return null
  const value = input as Record<string, unknown>
  const name = text(value.name)
  const email = text(value.email).toLowerCase()
  const phone = text(value.phone).replace(/\D/g, '')
  const password = text(value.password)
  const passwordConfirm = text(value.passwordConfirm)
  const inviteCode = text(value.inviteCode).toUpperCase()
  if (
    name.length < 2 ||
    !isEmail(email) ||
    !/^01[0-9]{8,9}$/.test(phone) ||
    password.length < 8 ||
    password !== passwordConfirm ||
    inviteCode.length < 6 ||
    value.kakaoConsent !== true
  )
    return null
  return { email, inviteCode, kakaoConsent: true, name, password, passwordConfirm, phone }
}
export function parseOnboardingInput(input: unknown): OnboardingInput | null {
  if (!input || typeof input !== 'object') return null
  const value = input as Record<string, unknown>
  const name = text(value.name)
  const phone = text(value.phone).replace(/\D/g, '')
  const inviteCode = text(value.inviteCode).toUpperCase()
  if (
    name.length < 2 ||
    !/^01[0-9]{8,9}$/.test(phone) ||
    inviteCode.length < 6 ||
    value.kakaoConsent !== true
  )
    return null
  return { inviteCode, kakaoConsent: true, name, phone }
}
export function parseNewPassword(input: unknown) {
  if (!input || typeof input !== 'object') return null
  const value = input as Record<string, unknown>
  const password = text(value.password)
  const passwordConfirm = text(value.passwordConfirm)
  return password.length >= 8 && password === passwordConfirm ? password : null
}
