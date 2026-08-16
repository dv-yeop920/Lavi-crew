import Link from 'next/link'

import * as styles from './auth-view.css'

export function AuthCallbackErrorView({ flow }: { flow: 'reset-password' | 'verify-email' }) {
  const isReset = flow === 'reset-password'
  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비에벨</span>
          <h1>링크를 확인할 수 없어요</h1>
          <p className={styles.description}>
            링크가 만료되었거나 이미 사용되었습니다. 새 링크를 요청해 주세요.
          </p>
        </header>
        <p className={styles.footer}>
          <Link
            className={styles.link}
            href={isReset ? '/forgot-password' : '/resend-confirmation'}
          >
            {isReset ? '비밀번호 재설정 링크 다시 받기' : '이메일 확인 링크 다시 받기'}
          </Link>
        </p>
        <p className={styles.footer}>
          <Link className={styles.link} href="/">
            로그인으로 이동
          </Link>
        </p>
      </div>
    </main>
  )
}
