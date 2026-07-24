export type ManagementActionResult = {
  code?: string
  message: string
  ok: boolean
}

function text(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

export function parseWorkerUpdate(formData: FormData) {
  const name = text(formData.get('name'))
  const hourlyWage = Number(text(formData.get('hourlyWage')))
  const selectedPositionIds = formData
    .getAll('positionIds')
    .filter((value): value is string => typeof value === 'string')
  if (
    name.length < 2 ||
    !Number.isSafeInteger(hourlyWage) ||
    hourlyWage <= 0 ||
    selectedPositionIds.some((positionId) => !/^[a-z-]{3,24}$/.test(positionId))
  ) {
    return null
  }
  return {
    hourlyWage,
    name,
    positionIds: [...new Set(selectedPositionIds)],
  }
}

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

export function parseInviteCreate(formData: FormData, asOf = new Date()) {
  const label = text(formData.get('label'))
  const expiresAt = text(formData.get('expiresAt'))
  const maxUses = Number(text(formData.get('maxUses')))
  if (
    label.length < 1 ||
    label.length > 60 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(expiresAt) ||
    !isCalendarDate(expiresAt) ||
    expiresAt < getKoreanDate(asOf) ||
    !Number.isSafeInteger(maxUses) ||
    maxUses <= 0
  ) {
    return null
  }
  return { expiresAt: `${expiresAt}T23:59:59+09:00`, label, maxUses }
}

export function parseUuid(value: unknown) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null
}
