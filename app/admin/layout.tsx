import type { ReactNode } from 'react'

import { AppShell } from '@/shared/ui/app-shell/app-shell'

const navigationItems = [
  { href: '/admin', label: '홈', match: 'exact' as const },
  { href: '/admin/schedules', label: '일정' },
  { href: '/admin/assignments', label: '배정' },
  { href: '/admin/attendance', label: '출석' },
  { href: '/admin/more', label: '관리' },
]

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AppShell navigationItems={navigationItems} roleLabel="관리자">
      {children}
    </AppShell>
  )
}
