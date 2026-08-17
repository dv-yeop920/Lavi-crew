import type { ReactNode } from 'react'

import * as styles from './status-badge.css'

type StatusBadgeProps = {
  children: ReactNode
  tone?: keyof typeof styles.badge
}

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={styles.badge[tone]}>{children}</span>
}
