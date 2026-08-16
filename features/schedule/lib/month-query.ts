export function getCanonicalMonth(monthQuery: string | undefined) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthQuery ?? '') ? (monthQuery as string) : null
}

export function getCurrentKoreanMonth() {
  return new Intl.DateTimeFormat('en-CA', {
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(new Date())
}
