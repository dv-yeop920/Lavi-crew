export function reconcileDateDrafts<T extends { date: string }>(
  current: T[],
  nextDates: string[],
  createDraft: (date: string) => T,
) {
  const currentByDate = new Map(current.map((draft) => [draft.date, draft]))
  const next = nextDates.map((date) => currentByDate.get(date) ?? createDraft(date))
  const isUnchanged =
    next.length === current.length && next.every((draft, index) => draft === current[index])
  return isUnchanged ? current : next
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
