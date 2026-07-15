import * as styles from './page-header.css'

type PageHeaderProps = {
  description?: string
  eyebrow?: string
  title: string
}

export function PageHeader({ description, eyebrow, title }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h1>{title}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
    </header>
  )
}
