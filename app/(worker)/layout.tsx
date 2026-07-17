import type { ReactNode } from 'react'

import { LogoutButton } from '@/features/auth/components/logout-button'
import { requireRole } from '@/shared/auth/session'
import { AppShell } from '@/shared/ui/app-shell/app-shell'

const navigationItems = [
  { href: '/home', icon: 'home' as const, label: '홈', match: 'exact' as const },
  { href: '/schedule/apply', icon: 'apply' as const, label: '신청' },
  { href: '/schedule', icon: 'calendar' as const, label: '내 일정', match: 'exact' as const },
  { href: '/payroll', icon: 'wallet' as const, label: '급여' },
  { href: '/profile', icon: 'profile' as const, label: 'MY' },
]

export default async function WorkerLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireRole('worker')
  return (
    <AppShell headerAction={<LogoutButton />} navigationItems={navigationItems}>
      {children}
    </AppShell>
  )
}
