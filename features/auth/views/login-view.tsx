'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'

import { authenticateDemoAccount, demoAccounts, readDemoSession } from '@/shared/auth/demo-session'
import { Button } from '@/shared/ui/button/button'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './auth-view.css'

export function LoginView() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const session = readDemoSession()

    if (session) {
      router.replace(session.role === 'admin' ? '/admin' : '/home')
    }
  }, [router])

  function fillDemoAccount(accountIndex: number) {
    const account = demoAccounts[accountIndex]
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    const session = authenticateDemoAccount(email, password)

    if (!session) {
      setError('이메일 또는 비밀번호를 다시 확인해 주세요.')
      setIsSubmitting(false)
      return
    }

    router.replace(session.role === 'admin' ? '/admin' : '/home')
  }

  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비크루</span>
          <h1>반가워요</h1>
          <p className={styles.description}>근무 일정과 급여를 확인하려면 로그인해 주세요.</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            autoComplete="email"
            inputMode="email"
            label="이메일"
            name="email"
            placeholder="crew@example.com"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            autoComplete="current-password"
            label="비밀번호"
            name="password"
            placeholder="비밀번호를 입력해 주세요"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error ? (
            <p className={styles.message} role="alert">
              {error}
            </p>
          ) : null}

          <Button className={styles.fullButton} disabled={isSubmitting} type="submit">
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
          <Link className={styles.resetLink} href="/forgot-password">
            비밀번호를 잊으셨나요?
          </Link>
        </form>

        <section className={styles.demoSection} aria-labelledby="demo-account-title">
          <strong className={styles.demoTitle} id="demo-account-title">
            데모 계정으로 바로 채우기
          </strong>
          <div className={styles.demoGrid}>
            {demoAccounts.map((account, index) => (
              <button
                className={styles.demoButton}
                key={account.role}
                type="button"
                onClick={() => fillDemoAccount(index)}
              >
                <strong>{account.role === 'admin' ? '관리자' : '알바'}</strong>
                <span className={styles.demoMeta}>{account.email}</span>
              </button>
            ))}
          </div>
        </section>

        <p className={styles.footer}>
          아직 라비크루 계정이 없나요?
          <Link className={styles.link} href="/signup">
            회원가입
          </Link>
        </p>
      </div>
    </main>
  )
}
