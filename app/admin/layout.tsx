import type { ReactNode } from 'react'

import { LogoutButton } from '@/features/auth/components/logout-button'
import { requireRole } from '@/shared/auth/session'
import { AppShell } from '@/shared/ui/app-shell/app-shell'

const navigationItems = [
  { href: '/admin', icon: 'home' as const, label: '홈', match: 'exact' as const },
  { href: '/admin/schedules', icon: 'schedule' as const, label: '일정' },
  { href: '/admin/more', icon: 'management' as const, label: '관리' },
]

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireRole('admin')
  return (
    <AppShell headerAction={<LogoutButton />} navigationItems={navigationItems}>
      {children}
    </AppShell>
  )
}
