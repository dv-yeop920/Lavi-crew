import type { ReactNode } from 'react'

import { BottomNavigation, type NavigationItem } from './bottom-navigation'

import * as styles from './app-shell.css'

type AppShellProps = {
  children: ReactNode
  navigationItems: NavigationItem[]
  roleLabel: string
}

export function AppShell({ children, navigationItems, roleLabel }: AppShellProps) {
  return (
    <div className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.topNavigation}>
          <strong className={styles.brand}>라비크루</strong>
          <span className={styles.role}>{roleLabel}</span>
        </header>
        <main className={styles.content}>{children}</main>
        <BottomNavigation items={navigationItems} />
      </div>
    </div>
  )
}
