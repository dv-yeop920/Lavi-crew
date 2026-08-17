import type { ComponentPropsWithoutRef } from 'react'

import * as styles from './content-card.css'

export function ContentCard(props: ComponentPropsWithoutRef<'article'>) {
  return <article className={styles.card} {...props} />
}
