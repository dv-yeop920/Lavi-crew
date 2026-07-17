'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/shared/ui/button/button'

import { clearDemoSession } from './demo-session'

export function LogoutButton() {
  const router = useRouter()

  function handleLogout() {
    clearDemoSession()
    router.replace('/')
  }

  return (
    <Button variant="secondary" onClick={handleLogout}>
      로그아웃
    </Button>
  )
}
