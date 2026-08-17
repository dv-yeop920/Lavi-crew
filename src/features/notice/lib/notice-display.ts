export function formatNoticeDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return '날짜 확인 필요'

  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(date)
}
