'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { resendConfirmationAction } from '@/features/auth/actions/auth-actions'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useSelectiveFormRecovery } from '@/shared/forms/use-selective-form-recovery'
import { Button } from '@/shared/ui/button/button'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './auth-view.css'

export function ResendConfirmationView() {
  const [state, formAction, isPending] = useActionState(resendConfirmationAction, null)
  const { captureSubmission, formRef } = useSelectiveFormRecovery(state)

  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비크루</span>
          <h1>이메일 확인 링크 재발송</h1>
          <p className={styles.description}>가입할 때 사용한 이메일로 새 확인 링크를 보내드려요.</p>
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
            {isPending ? '발송 중...' : '확인 링크 다시 받기'}
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
