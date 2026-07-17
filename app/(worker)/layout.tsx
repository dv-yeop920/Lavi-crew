import type { ReactNode } from 'react'

import { AuthGuard } from '@/shared/auth/auth-guard'
import { LogoutButton } from '@/shared/auth/logout-button'
import { AppShell } from '@/shared/ui/app-shell/app-shell'

const navigationItems = [
  { href: '/home', icon: 'home' as const, label: '홈', match: 'exact' as const },
  { href: '/schedule/apply', icon: 'apply' as const, label: '신청' },
  { href: '/schedule', icon: 'calendar' as const, label: '내 일정', match: 'exact' as const },
  { href: '/payroll', icon: 'wallet' as const, label: '급여' },
  { href: '/profile', icon: 'profile' as const, label: 'MY' },
]

export default function WorkerLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AuthGuard role="worker">
      <AppShell headerAction={<LogoutButton />} navigationItems={navigationItems}>
        {children}
      </AppShell>
    </AuthGuard>
  )
}
