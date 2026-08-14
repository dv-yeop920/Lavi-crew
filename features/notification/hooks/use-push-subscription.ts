'use client'

import { useCallback, useEffect, useState } from 'react'

import { subscribePushAction, unsubscribePushAction } from '../actions/push-subscription-actions'

type PushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function getInitialPermission(): PushPermissionState {
  if (typeof window === 'undefined') return 'prompt'
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported'
  return Notification.permission as PushPermissionState
}

export function usePushSubscription() {
  const [permission, setPermission] = useState<PushPermissionState>(getInitialPermission)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (permission === 'unsupported') return

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setIsSubscribed(subscription !== null))
      .catch(() => {})
  }, [permission])

  const subscribe = useCallback(async () => {
    if (permission === 'unsupported' || permission === 'denied') return
    setIsPending(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result as PushPermissionState)
      if (result !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) return

      const subscription = await registration.pushManager.subscribe({
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        userVisibleOnly: true,
      })
      const json = subscription.toJSON()
      await subscribePushAction({
        endpoint: json.endpoint!,
        keyAuth: json.keys!.auth!,
        keyP256dh: json.keys!.p256dh!,
      })
      setIsSubscribed(true)
    } finally {
      setIsPending(false)
    }
  }, [permission])

  const unsubscribe = useCallback(async () => {
    setIsPending(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await unsubscribePushAction(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setIsSubscribed(false)
    } finally {
      setIsPending(false)
    }
  }, [])

  return { isPending, isSubscribed, permission, subscribe, unsubscribe }
}
