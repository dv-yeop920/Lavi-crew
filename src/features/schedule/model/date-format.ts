export function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date(`${date}T00:00:00`))
}

export function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return `${year}년 ${monthNumber}월`
}
