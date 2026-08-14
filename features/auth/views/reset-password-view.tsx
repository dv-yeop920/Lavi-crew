'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { updatePasswordAction } from '@/features/auth/actions/auth-actions'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useSelectiveFormRecovery } from '@/shared/forms/use-selective-form-recovery'
import { Button } from '@/shared/ui/button/button'
import { LoadingDots } from '@/shared/ui/button/loading-dots'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './auth-view.css'

export function ResetPasswordView() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, null)
  const { captureSubmission, formRef } = useSelectiveFormRecovery(state)
  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비크루</span>
          <h1>새 비밀번호 설정</h1>
          <p className={styles.description}>8자 이상인 새 비밀번호를 입력해 주세요.</p>
        </header>
        <form
          action={formAction}
          className={styles.form}
          noValidate
          onSubmitCapture={captureSubmission}
          ref={formRef}
        >
          <TextField
            autoComplete="new-password"
            error={getFirstFieldError(state?.fieldErrors, 'password')}
            label="새 비밀번호"
            name="password"
            required
            type="password"
          />
          <TextField
            autoComplete="new-password"
            error={getFirstFieldError(state?.fieldErrors, 'passwordConfirm')}
            label="새 비밀번호 확인"
            name="passwordConfirm"
            required
            type="password"
          />
          {state?.message && !state.fieldErrors ? (
            <p
              className={state.ok ? styles.message : styles.errorMessage}
              role={state.ok ? 'status' : 'alert'}
            >
              {state.message}
            </p>
          ) : null}
          <Button className={styles.fullButton} disabled={isPending} type="submit">
            {isPending ? <>변경 중<LoadingDots /></> : '비밀번호 변경'}
          </Button>
        </form>
        {state?.ok ? (
          <p className={styles.footer}>
            <Link className={styles.link} href="/">
              로그인으로 이동
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  )
}
