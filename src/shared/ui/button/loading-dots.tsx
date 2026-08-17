'use client'

import * as styles from './loading-dots.css'

export function LoadingDots() {
  return (
    <span aria-hidden="true" className={styles.dots}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </span>
  )
}
