import * as styles from './spinner.css'

type SpinnerProps = {
  label?: string
  size?: 'medium' | 'small'
}

export function Spinner({ label = '불러오는 중', size = 'medium' }: SpinnerProps) {
  return <span aria-label={label} className={styles.spinner[size]} role="status" />
}
