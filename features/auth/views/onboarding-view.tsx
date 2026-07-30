'use client'

import { useActionState } from 'react'

import { onboardingAction } from '@/features/auth/actions/auth-actions'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useSelectiveFormRecovery } from '@/shared/forms/use-selective-form-recovery'
import { Button } from '@/shared/ui/button/button'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './auth-view.css'

export function OnboardingView() {
  const [state, formAction, isPending] = useActionState(onboardingAction, null)
  const { captureSubmission, formRef } = useSelectiveFormRecovery(state)
  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비크루</span>
          <h1>크루 정보 등록</h1>
          <p className={styles.description}>
            운영 초대 코드와 연락처를 등록하면 일정을 이용할 수 있어요.
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
            autoComplete="tel"
            error={getFirstFieldError(state?.fieldErrors, 'phone')}
            inputMode="numeric"
            label="휴대폰 번호"
            name="phone"
            required
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
                    ? 'onboarding-kakao-consent-error'
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
                id="onboarding-kakao-consent-error"
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
            {isPending ? '등록 중...' : '등록 완료'}
          </Button>
        </form>
      </div>
    </main>
  )
}
