'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'

import { loginAction } from '@/features/auth/actions/auth-actions'
import { startKakaoOAuth } from '@/features/auth/client/kakao-oauth'
import { Button } from '@/shared/ui/button/button'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './auth-view.css'

export function LoginView() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [oauthError, setOauthError] = useState('')
  async function loginWithKakao() {
    setOauthError('')
    const { error } = await startKakaoOAuth(
      `${window.location.origin}/auth/callback?next=/onboarding`,
    )
    if (error) setOauthError('카카오 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  }
  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비크루</span>
          <h1>반가워요</h1>
          <p className={styles.description}>근무 일정과 급여를 확인하려면 로그인해 주세요.</p>
        </header>
        <form className={styles.form} action={formAction}>
          <TextField
            autoComplete="email"
            inputMode="email"
            label="이메일"
            name="email"
            placeholder="crew@example.com"
            required
            type="email"
          />
          <TextField
            autoComplete="current-password"
            label="비밀번호"
            name="password"
            required
            type="password"
          />
          {state?.message ? (
            <p className={styles.message} role="alert">
              {state.message}
            </p>
          ) : null}
          <Button className={styles.fullButton} disabled={isPending} type="submit">
            {isPending ? '로그인 중...' : '로그인'}
          </Button>
          <Link className={styles.resetLink} href="/forgot-password">
            비밀번호를 잊으셨나요?
          </Link>
        </form>
        <Button className={styles.fullButton} variant="secondary" onClick={loginWithKakao}>
          카카오로 로그인
        </Button>
        {oauthError ? (
          <p className={styles.message} role="alert">
            {oauthError}
          </p>
        ) : null}
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
