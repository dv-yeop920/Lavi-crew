import Link from 'next/link'

import * as styles from './auth-view.css'

export function VerifyEmailView() {
  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비에벨</span>
          <h1>이메일 확인을 완료했어요</h1>
          <p className={styles.description}>
            라비크루 계정이 활성화되었습니다. 이제 가입한 이메일과 비밀번호로 로그인해 주세요.
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
