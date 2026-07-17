import type { ReactNode } from 'react'

import { BottomNavigation, type NavigationItem } from './bottom-navigation'

import * as styles from './app-shell.css'

type AppShellProps = {
  children: ReactNode
  headerAction?: ReactNode
  navigationItems: NavigationItem[]
}

export function AppShell({ children, headerAction, navigationItems }: AppShellProps) {
  return (
    <div className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.topNavigation}>
          <strong className={styles.brand}>라비크루</strong>
          <div className={styles.headerActions}>{headerAction}</div>
        </header>
        <main className={styles.content}>{children}</main>
        <BottomNavigation items={navigationItems} />
      </div>
    </div>
  )
}
