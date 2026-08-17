'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { loginAction } from '@/features/auth/api/auth-actions'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useSelectiveFormRecovery } from '@/shared/forms/use-selective-form-recovery'
import { Button } from '@/shared/ui/button/button'
import { LoadingDots } from '@/shared/ui/button/loading-dots'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './auth-view.css'

export function LoginView() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const { captureSubmission, formRef } = useSelectiveFormRecovery(state)
  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비에벨</span>
          <h1>반가워요</h1>
          <p className={styles.description}>근무 일정과 급여를 확인하려면 로그인해 주세요.</p>
        </header>
        <form
          action={formAction}
          className={styles.form}
          noValidate
          onSubmitCapture={captureSubmission}
          ref={formRef}
        >
          <TextField
            autoComplete="email"
            inputMode="email"
            label="이메일"
            name="email"
            error={getFirstFieldError(state?.fieldErrors, 'email')}
            placeholder="crew@example.com"
            required
            type="email"
          />
          <TextField
            autoComplete="current-password"
            label="비밀번호"
            name="password"
            error={getFirstFieldError(state?.fieldErrors, 'password')}
            required
            type="password"
          />
          {state?.message && !state.fieldErrors ? (
            <p className={state.ok ? styles.message : styles.errorMessage} role="alert">
              {state.message}
            </p>
          ) : null}
          <Button className={styles.fullButton} disabled={isPending} type="submit">
            {isPending ? (
              <>
                로그인 중<LoadingDots />
              </>
            ) : (
              '로그인'
            )}
          </Button>
          <Link className={styles.resetLink} href="/forgot-password">
            비밀번호를 잊으셨나요?
          </Link>
        </form>
        <p className={styles.footer}>
          아직 라비에벨 계정이 없나요?
          <Link className={styles.link} href="/signup">
            회원가입
          </Link>
        </p>
      </div>
    </main>
  )
}
