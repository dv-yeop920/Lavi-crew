'use client'

import { useEffect, useRef, useState } from 'react'

export type ToastTone = 'negative' | 'neutral' | 'positive'

export type ToastEntry = {
  id: string
  message: string
  tone: ToastTone
}

const DEFAULT_DURATION_MS = 3000

export function useToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const timeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
      timeouts.clear()
    }
  }, [])

  function dismissToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }

  function showToast(
    message: string,
    tone: ToastTone = 'positive',
    durationMs = DEFAULT_DURATION_MS,
  ) {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, message, tone }])
    timeoutsRef.current.set(
      id,
      setTimeout(() => dismissToast(id), durationMs),
    )
  }

  return { dismissToast, showToast, toasts }
}
