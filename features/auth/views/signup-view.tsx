'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { signupAction } from '@/features/auth/actions/auth-actions'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useSelectiveFormRecovery } from '@/shared/forms/use-selective-form-recovery'
import { Button } from '@/shared/ui/button/button'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './auth-view.css'

export function SignupView() {
  const [state, formAction, isPending] = useActionState(signupAction, null)
  const { captureSubmission, formRef } = useSelectiveFormRecovery(state)
  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비크루</span>
          <h1>크루로 시작하기</h1>
          <p className={styles.description}>
            라비에벨 구성원만 가입할 수 있어요. 전달받은 전용 코드를 준비해 주세요.
          </p>
        </header>
        <form
          action={formAction}
          className={styles.form}
          noValidate
          onSubmitCapture={captureSubmission}
          ref={formRef}
        >
          <TextField
            autoComplete="name"
            error={getFirstFieldError(state?.fieldErrors, 'name')}
            label="이름"
            name="name"
            required
          />
          <TextField
            error={getFirstFieldError(state?.fieldErrors, 'hiredAt')}
            label="입사 년월일"
            name="hiredAt"
            required
            type="date"
          />
          <TextField
            autoComplete="email"
            error={getFirstFieldError(state?.fieldErrors, 'email')}
            inputMode="email"
            label="이메일"
            name="email"
            required
            type="email"
          />
          <TextField
            autoComplete="tel"
            error={getFirstFieldError(state?.fieldErrors, 'phone')}
            inputMode="numeric"
            label="휴대폰 번호"
            name="phone"
            required
          />
          <TextField
            autoComplete="new-password"
            error={getFirstFieldError(state?.fieldErrors, 'password')}
            hint="8자 이상 입력해 주세요."
            label="비밀번호"
            name="password"
            required
            type="password"
          />
          <TextField
            autoComplete="new-password"
            error={getFirstFieldError(state?.fieldErrors, 'passwordConfirm')}
            label="비밀번호 확인"
            name="passwordConfirm"
            required
            type="password"
          />
          <TextField
            autoCapitalize="characters"
            error={getFirstFieldError(state?.fieldErrors, 'inviteCode')}
            label="라비에벨 전용 코드"
            name="inviteCode"
            required
          />
          <div className={styles.checkboxField}>
            <label className={styles.checkbox}>
              <input
                aria-describedby={
                  getFirstFieldError(state?.fieldErrors, 'kakaoConsent')
                    ? 'signup-kakao-consent-error'
                    : undefined
                }
                aria-invalid={Boolean(getFirstFieldError(state?.fieldErrors, 'kakaoConsent'))}
                className={styles.checkboxInput}
                name="kakaoConsent"
                required
                type="checkbox"
              />
              <span>[필수] 스케줄 확정·변경 알림을 위한 카카오 알림톡 수신에 동의합니다.</span>
            </label>
            {getFirstFieldError(state?.fieldErrors, 'kakaoConsent') ? (
              <span
                aria-live="polite"
                className={styles.fieldError}
                id="signup-kakao-consent-error"
              >
                {getFirstFieldError(state?.fieldErrors, 'kakaoConsent')}
              </span>
            ) : null}
          </div>
          {state?.message && !state.fieldErrors ? (
            <p
              className={state.ok ? styles.message : styles.errorMessage}
              role={state.ok ? 'status' : 'alert'}
            >
              {state.message}
            </p>
          ) : null}
          <Button className={styles.fullButton} disabled={isPending} type="submit">
            {isPending ? '가입 요청 중...' : '회원가입'}
          </Button>
        </form>
        <p className={styles.footer}>
          이미 계정이 있나요?
          <Link className={styles.link} href="/">
            로그인
          </Link>
        </p>
      </div>
    </main>
  )
}
