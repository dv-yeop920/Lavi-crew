import Link from 'next/link'

import * as styles from './page-header.css'

type PageHeaderProps = {
  backHref?: string
  backLabel?: string
  description?: string
  eyebrow?: string
  title: string
}

export function PageHeader({
  backHref,
  backLabel = '뒤로가기',
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {backHref ? (
        <Link className={styles.backLink} href={backHref}>
          <span aria-hidden="true">←</span>
          {backLabel}
        </Link>
      ) : null}
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h1>{title}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
    </header>
  )
}
