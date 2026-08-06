'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'

import { shouldConfirmDirtyNavigation } from '../lib/draft-reconciliation'

type DirtyNavigationGuardOptions = {
  confirmationMessage: string
  isDirty: boolean
}

/**
 * 작성 중인 내용이 있을 때 링크 클릭·탭 닫기를 확인 없이 벗어나지 않도록 막는다.
 * 브라우저 뒤로가기/앞으로가기 버튼은 history API로 가로챌 수 없어 이 훅의 보호 대상이
 * 아니다(next/navigation의 router와 표준 DOM 이벤트만 사용한다).
 */
export function useDirtyNavigationGuard({
  confirmationMessage,
  isDirty,
}: DirtyNavigationGuardOptions) {
  const router = useRouter()

  const navigate = useCallback(
    (destination: string, skipConfirmation = false) => {
      if (isDirty && !skipConfirmation && !window.confirm(confirmationMessage)) return false
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

  return { navigate }
}
