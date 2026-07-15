import type { ReactNode } from 'react'

import { AppShell } from '@/shared/ui/app-shell/app-shell'

const navigationItems = [
  { href: '/', label: '홈', match: 'exact' as const },
  { href: '/schedule/apply', label: '신청' },
  { href: '/schedule', label: '내 일정', match: 'exact' as const },
  { href: '/payroll', label: '급여' },
  { href: '/profile', label: 'MY' },
]

export default function WorkerLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AppShell navigationItems={navigationItems} roleLabel="알바">
      {children}
    </AppShell>
  )
}
