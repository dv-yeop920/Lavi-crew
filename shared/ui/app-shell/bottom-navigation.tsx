'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NavigationIcon, type NavigationIconName } from './navigation-icon'

import * as styles from './app-shell.css'

export type NavigationItem = {
  href: string
  icon: NavigationIconName
  label: string
  match?: 'exact' | 'prefix'
}

type BottomNavigationProps = {
  items: NavigationItem[]
}

export function BottomNavigation({ items }: BottomNavigationProps) {
  const pathname = usePathname()
  const columnClassName =
    items.length === 3 ? styles.bottomNavigationColumns.three : styles.bottomNavigationColumns.five

  return (
    <nav className={styles.bottomNavigation} aria-label="주요 메뉴">
      <div className={`${styles.bottomNavigationInner} ${columnClassName}`}>
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
              <NavigationIcon className={styles.navigationIcon} name={item.icon} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
