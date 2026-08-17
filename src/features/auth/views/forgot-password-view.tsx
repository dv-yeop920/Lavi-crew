'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { passwordResetAction } from '@/features/auth/actions/auth-actions'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useSelectiveFormRecovery } from '@/shared/forms/use-selective-form-recovery'
import { Button } from '@/shared/ui/button/button'
import { LoadingDots } from '@/shared/ui/button/loading-dots'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './auth-view.css'

export function ForgotPasswordView() {
  const [state, formAction, isPending] = useActionState(passwordResetAction, null)
  const { captureSubmission, formRef } = useSelectiveFormRecovery(state)
  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비에벨</span>
          <h1>비밀번호 재설정</h1>
          <p className={styles.description}>가입 이메일로 비밀번호 재설정 링크를 보내드려요.</p>
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
            error={getFirstFieldError(state?.fieldErrors, 'email')}
            inputMode="email"
            label="이메일"
            name="email"
            required
            type="email"
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
            {isPending ? (
              <>
                발송 중<LoadingDots />
              </>
            ) : (
              '재설정 링크 받기'
            )}
          </Button>
        </form>
        <p className={styles.footer}>
          <Link className={styles.link} href="/">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </main>
  )
}
