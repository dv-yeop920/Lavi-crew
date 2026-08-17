import { Spinner } from '@/shared/ui/spinner/spinner'

import * as styles from '../spinner/spinner.css'

export function RouteLoading() {
  return (
    <div className={styles.container} role="status">
      <Spinner />
    </div>
  )
}
