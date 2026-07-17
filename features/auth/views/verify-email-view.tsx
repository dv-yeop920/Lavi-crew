import Link from 'next/link'

import * as styles from './auth-view.css'

export function VerifyEmailView() {
  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비크루</span>
          <h1>이메일을 확인해 주세요</h1>
          <p className={styles.description}>
            가입 이메일의 확인 링크를 완료한 뒤 로그인할 수 있습니다. 데모 가입은 확인 절차 없이
            바로 로그인됩니다.
          </p>
        </header>
        <p className={styles.footer}>
          <Link className={styles.link} href="/">
            로그인으로 이동
          </Link>
        </p>
      </div>
    </main>
  )
}
