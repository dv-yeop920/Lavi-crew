export type ProfileActionResult = {
  code?: string
  message: string
  ok: boolean
}

function text(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseProfileUpdate(formData: FormData) {
  const name = text(formData.get('name'))
  const phone = text(formData.get('phone')).replace(/\D/g, '')
  if (name.length < 2 || !/^01[0-9]{8,9}$/.test(phone)) return null
  return {
    kakaoConsent: formData.get('kakaoConsent') === 'on',
    name,
    phone,
  }
}
