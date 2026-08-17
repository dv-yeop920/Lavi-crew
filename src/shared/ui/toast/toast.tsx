'use client'

import type { ToastEntry } from './use-toast'

import * as styles from './toast.css'

type ToastViewportProps = {
  onDismiss?: (id: string) => void
  toasts: ToastEntry[]
}

export function ToastViewport({ onDismiss, toasts }: ToastViewportProps) {
  if (toasts.length === 0) return null

  return (
    <div className={styles.viewport}>
      {toasts.map((toast) => (
        <div
          className={styles.toast[toast.tone]}
          key={toast.id}
          aria-live={toast.tone === 'negative' ? 'assertive' : 'polite'}
          role={toast.tone === 'negative' ? 'alert' : 'status'}
        >
          <p className={styles.message}>{toast.message}</p>
          {onDismiss ? (
            <button
              aria-label="알림 닫기"
              className={styles.dismissButton}
              type="button"
              onClick={() => onDismiss(toast.id)}
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
