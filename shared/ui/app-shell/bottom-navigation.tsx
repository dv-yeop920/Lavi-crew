'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import * as styles from './app-shell.css'

export type NavigationItem = {
  href: string
  label: string
  match?: 'exact' | 'prefix'
}

type BottomNavigationProps = {
  items: NavigationItem[]
}

export function BottomNavigation({ items }: BottomNavigationProps) {
  const pathname = usePathname()

  return (
    <nav className={styles.bottomNavigation} aria-label="주요 메뉴">
      <div className={styles.bottomNavigationInner}>
        {items.map((item) => {
          const isCurrent =
            item.match === 'exact'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              className={styles.navigationItem}
              href={item.href}
              aria-current={isCurrent ? 'page' : undefined}
              key={item.href}
            >
              <span className={styles.navigationMark} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
