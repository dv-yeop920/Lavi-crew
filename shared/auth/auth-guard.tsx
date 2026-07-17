'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'

import { type AuthRole, readDemoSession } from './demo-session'

import * as styles from './auth.css'

type AuthGuardProps = {
  children: ReactNode
  role: AuthRole
}

export function AuthGuard({ children, role }: AuthGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const session = readDemoSession()

      if (!session || session.role !== role) {
        router.replace('/')
        return
      }

      setIsAuthorized(true)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [role, router])

  if (!isAuthorized) {
    return (
      <main className={styles.guard} aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        <p>로그인 정보를 확인하고 있어요.</p>
      </main>
    )
  }

  return children
}
