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

export function getDirtyHistoryPopstateMode(input: {
  isBypassing: boolean
  isDirty: boolean
  isTargetSentinel: boolean
}) {
  if (input.isBypassing || !input.isDirty) return 'allow' as const
  if (input.isTargetSentinel) return 'arm-sentinel' as const
  return 'confirm-back' as const
}

export function getCleanSentinelTransition(input: {
  hasActiveSentinel: boolean
  isDirty: boolean
  isTargetSentinel: boolean
}) {
  if (input.isDirty) return 'none' as const
  if (input.hasActiveSentinel && input.isTargetSentinel) return 'collapse-current' as const
  if (!input.hasActiveSentinel && input.isTargetSentinel) return 'skip-stale-forward' as const
  return 'none' as const
}

export function shouldCollapseSentinelOnMount(input: { hasMarker: boolean; isDirty: boolean }) {
  return !input.isDirty && input.hasMarker
}
