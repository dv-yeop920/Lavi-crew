'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

import {
  getCleanSentinelTransition,
  getDirtyHistoryPopstateMode,
  shouldCollapseSentinelOnMount,
  shouldConfirmDirtyNavigation,
} from '../lib/draft-reconciliation'

const DIRTY_HISTORY_SENTINEL = '__laviCrewScheduleDirtyGuard'

type DirtyNavigationGuardOptions = {
  confirmationMessage: string
  isDirty: boolean
}

export function useDirtyNavigationGuard({
  confirmationMessage,
  isDirty,
}: DirtyNavigationGuardOptions) {
  const router = useRouter()
  const hasHistorySentinelRef = useRef(false)
  const isBypassingHistorySentinelRef = useRef(false)
  const isCollapsingHistorySentinelRef = useRef(false)
  const pendingDestinationRef = useRef<string | null>(null)

  const navigate = useCallback(
    (destination: string, skipConfirmation = false) => {
      if (isDirty && !skipConfirmation && !window.confirm(confirmationMessage)) return false

      pendingDestinationRef.current = destination
      if (hasHistorySentinelRef.current) {
        if (!isCollapsingHistorySentinelRef.current) {
          isCollapsingHistorySentinelRef.current = true
          window.history.back()
        }
        return true
      }

      pendingDestinationRef.current = null
      router.push(destination)
      return true
    },
    [confirmationMessage, isDirty, router],
  )

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return
      event.preventDefault()
    }

    function confirmLinkNavigation(event: MouseEvent) {
      if (
        !isDirty ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.target === '_blank') return
      const destination = new URL(anchor.href, window.location.href)
      if (
        destination.origin !== window.location.origin ||
        !shouldConfirmDirtyNavigation(isDirty, destination.href, window.location.href)
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      navigate(`${destination.pathname}${destination.search}${destination.hash}`)
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    document.addEventListener('click', confirmLinkNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload)
      document.removeEventListener('click', confirmLinkNavigation, true)
    }
  }, [isDirty, navigate])

  useEffect(() => {
    const historyState =
      window.history.state && typeof window.history.state === 'object'
        ? (window.history.state as Record<string, unknown>)
        : {}

    if (isDirty && historyState[DIRTY_HISTORY_SENTINEL] !== true) {
      window.history.pushState(
        { ...historyState, [DIRTY_HISTORY_SENTINEL]: true },
        '',
        window.location.href,
      )
      hasHistorySentinelRef.current = true
    } else if (isDirty) {
      hasHistorySentinelRef.current = true
    } else if (
      shouldCollapseSentinelOnMount({
        hasMarker: historyState[DIRTY_HISTORY_SENTINEL] === true,
        isDirty,
      }) &&
      !isCollapsingHistorySentinelRef.current
    ) {
      hasHistorySentinelRef.current = true
      isCollapsingHistorySentinelRef.current = true
      window.history.back()
    }

    function confirmPopstateNavigation(event: PopStateEvent) {
      const targetState =
        event.state && typeof event.state === 'object'
          ? (event.state as Record<string, unknown>)
          : {}
      if (isCollapsingHistorySentinelRef.current) {
        event.stopImmediatePropagation()
        isCollapsingHistorySentinelRef.current = false
        hasHistorySentinelRef.current = false
        const destination = pendingDestinationRef.current
        pendingDestinationRef.current = null
        if (destination) queueMicrotask(() => router.push(destination))
        return
      }

      const cleanTransition = getCleanSentinelTransition({
        hasActiveSentinel: hasHistorySentinelRef.current,
        isDirty,
        isTargetSentinel: targetState[DIRTY_HISTORY_SENTINEL] === true,
      })
      if (cleanTransition === 'skip-stale-forward') {
        event.stopImmediatePropagation()
        isCollapsingHistorySentinelRef.current = true
        window.history.back()
        return
      }
      const mode = getDirtyHistoryPopstateMode({
        isBypassing: isBypassingHistorySentinelRef.current,
        isDirty,
        isTargetSentinel: targetState[DIRTY_HISTORY_SENTINEL] === true,
      })
      if (mode === 'allow') {
        isBypassingHistorySentinelRef.current = false
        return
      }
      if (mode === 'arm-sentinel') {
        hasHistorySentinelRef.current = true
        return
      }

      event.stopImmediatePropagation()
      if (window.confirm(confirmationMessage)) {
        isBypassingHistorySentinelRef.current = true
        hasHistorySentinelRef.current = false
        window.history.back()
        return
      }
      window.history.pushState(
        { ...targetState, [DIRTY_HISTORY_SENTINEL]: true },
        '',
        window.location.href,
      )
      hasHistorySentinelRef.current = true
    }

    window.addEventListener('popstate', confirmPopstateNavigation, true)
    return () => window.removeEventListener('popstate', confirmPopstateNavigation, true)
  }, [confirmationMessage, isDirty, router])

  return { navigate }
}
