export function maskEmail(email: string | null) {
  if (!email) return '이메일 없음'
  const [localPart, domain] = email.split('@')
  if (!domain) return '이메일 없음'
  const visibleLength = Math.min(2, Math.max(1, localPart.length))
  return `${localPart.slice(0, visibleLength)}${'*'.repeat(Math.max(3, localPart.length - visibleLength))}@${domain}`
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return '연락처 없음'
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${'*'.repeat(digits.length - 7)}`
}
