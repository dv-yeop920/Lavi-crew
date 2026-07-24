const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const KOREA_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'numeric',
  timeZone: 'Asia/Seoul',
  year: 'numeric',
})

type Tenure = {
  years: number
  months: number
  days: number
}

function toUtcDate(dateValue: string | Date) {
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-').map(Number)

    return new Date(Date.UTC(year, month - 1, day))
  }

  const parsedDate = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
  const dateParts = Object.fromEntries(
    KOREA_DATE_FORMATTER.formatToParts(parsedDate).map((part) => [part.type, part.value]),
  )

  return new Date(
    Date.UTC(Number(dateParts.year), Number(dateParts.month) - 1, Number(dateParts.day)),
  )
}

function createClampedUtcDate(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  return new Date(Date.UTC(year, month, Math.min(day, lastDay)))
}

function addCalendarYears(date: Date, years: number) {
  return createClampedUtcDate(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate())
}

function addCalendarMonths(date: Date, months: number) {
  const totalMonths = date.getUTCFullYear() * 12 + date.getUTCMonth() + months
  const year = Math.floor(totalMonths / 12)
  const month = totalMonths - year * 12

  return createClampedUtcDate(year, month, date.getUTCDate())
}

export function getTenure(joinedAt: string, asOf = new Date()): Tenure {
  const joinedDate = toUtcDate(joinedAt)
  const asOfDate = toUtcDate(asOf)

  if (joinedDate > asOfDate) {
    return { days: 0, months: 0, years: 0 }
  }

  let years = asOfDate.getUTCFullYear() - joinedDate.getUTCFullYear()
  let yearAnchor = addCalendarYears(joinedDate, years)

  if (yearAnchor > asOfDate) {
    years -= 1
    yearAnchor = addCalendarYears(joinedDate, years)
  }

  let months =
    (asOfDate.getUTCFullYear() - yearAnchor.getUTCFullYear()) * 12 +
    asOfDate.getUTCMonth() -
    yearAnchor.getUTCMonth()
  let monthAnchor = addCalendarMonths(yearAnchor, months)

  if (monthAnchor > asOfDate) {
    months -= 1
    monthAnchor = addCalendarMonths(yearAnchor, months)
  }

  const days = Math.floor((asOfDate.getTime() - monthAnchor.getTime()) / MILLISECONDS_PER_DAY)

  return { days, months, years }
}

export function formatTenure(joinedAt: string, asOf = new Date()) {
  const { years, months, days } = getTenure(joinedAt, asOf)

  return `${years}년 ${months}개월 ${days}일`
}

export function formatJoinedAt(joinedAt: string) {
  const joinedDate = toUtcDate(joinedAt)

  return [
    joinedDate.getUTCFullYear(),
    String(joinedDate.getUTCMonth() + 1).padStart(2, '0'),
    String(joinedDate.getUTCDate()).padStart(2, '0'),
  ].join('.')
}
