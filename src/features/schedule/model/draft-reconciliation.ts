export function reconcileDateDrafts<T extends { date: string; isEnabled: boolean }>(
  current: T[],
  nextDates: string[],
  createDraft: (date: string) => T,
) {
  const currentByDate = new Map(current.map((draft) => [draft.date, draft]))
  const nextDateSet = new Set(nextDates)
  const next = nextDates.map((date) => currentByDate.get(date) ?? createDraft(date))
  // nextDates에서 빠졌더라도 이미 작성을 시작한(isEnabled) 초안은 조용히 지우지 않고 남긴다.
  // 손대지 않은 기본 상태의 초안만 nextDates 기준으로 정리 대상이 된다.
  const inProgressOutsideNextDates = current.filter(
    (draft) => draft.isEnabled && !nextDateSet.has(draft.date),
  )
  const merged = [...next, ...inProgressOutsideNextDates].sort((left, right) =>
    left.date.localeCompare(right.date),
  )
  const isUnchanged =
    merged.length === current.length && merged.every((draft, index) => draft === current[index])
  return isUnchanged ? current : merged
}

export function shouldConfirmDirtyNavigation(
  isDirty: boolean,
  targetHref: string,
  currentHref: string,
) {
  if (!isDirty) return false
  const target = new URL(targetHref, 'https://lavi.local')
  const current = new URL(currentHref, 'https://lavi.local')
  return (
    `${target.pathname}${target.search}${target.hash}` !==
    `${current.pathname}${current.search}${current.hash}`
  )
}
