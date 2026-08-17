'use client'

import { Button } from '@/shared/ui/button/button'
import { LoadingDots } from '@/shared/ui/button/loading-dots'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import { usePushSubscription } from '../hooks/use-push-subscription'

import * as layout from '@/shared/ui/layout/layout.css'

type PushSubscriptionActionProps = ReturnType<typeof usePushSubscription>

function PushSubscriptionAction({
  isPending,
  isSubscribed,
  permission,
  subscribe,
  unsubscribe,
}: PushSubscriptionActionProps) {
  if (permission === 'unsupported') {
    return <span>이 브라우저는 알림을 지원하지 않습니다.</span>
  }

  if (permission === 'denied') {
    return <span>알림이 차단되어 있습니다. 브라우저 설정에서 허용해주세요.</span>
  }

  if (permission === 'granted' && isSubscribed) {
    return (
      <div className={layout.wrap}>
        <StatusBadge tone="positive">알림 수신 중</StatusBadge>
        <Button disabled={isPending} onClick={unsubscribe} variant="secondary">
          {isPending ? (
            <>
              처리 중<LoadingDots />
            </>
          ) : (
            '알림 끄기'
          )}
        </Button>
      </div>
    )
  }

  return (
    <Button disabled={isPending} onClick={subscribe}>
      {isPending ? (
        <>
          처리 중<LoadingDots />
        </>
      ) : (
        '알림 받기'
      )}
    </Button>
  )
}

export function PushSubscriptionToggle() {
  const pushSubscription = usePushSubscription()

  return (
    <div className={layout.row}>
      <strong>알림</strong>
      <PushSubscriptionAction {...pushSubscription} />
    </div>
  )
}
