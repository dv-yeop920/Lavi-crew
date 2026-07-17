import type { ReactNode } from 'react'

import { AuthGuard } from '@/shared/auth/auth-guard'
import { LogoutButton } from '@/shared/auth/logout-button'
import { AppShell } from '@/shared/ui/app-shell/app-shell'

const navigationItems = [
  { href: '/admin', icon: 'home' as const, label: '홈', match: 'exact' as const },
  { href: '/admin/schedules', icon: 'schedule' as const, label: '일정' },
  { href: '/admin/more', icon: 'management' as const, label: '관리' },
]

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AuthGuard role="admin">
      <AppShell headerAction={<LogoutButton />} navigationItems={navigationItems}>
        {children}
      </AppShell>
    </AuthGuard>
  )
}
