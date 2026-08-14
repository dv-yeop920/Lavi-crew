'use client'

import { useActionState, useRef, useState } from 'react'

import {
  deactivateOwnProfileAction,
  updateOwnProfileAction,
} from '@/features/profile/actions/profile-actions'
import type { ProfileActionResult } from '@/features/profile/schemas/profile-input'
import { getFirstFieldError } from '@/shared/forms/form-result'
import { useSelectiveFormRecovery } from '@/shared/forms/use-selective-form-recovery'
import { Button } from '@/shared/ui/button/button'
import { LoadingDots } from '@/shared/ui/button/loading-dots'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './profile.css'
import * as layout from '@/shared/ui/layout/layout.css'

export type ProfileViewModel = {
  email: string
  hourlyWage: number
  isActive: boolean
  name: string
  phone: string
}

const currencyFormatter = new Intl.NumberFormat('ko-KR')

export function ProfileView({ profile }: { profile: ProfileViewModel }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [updateState, updateFormAction, isUpdating] = useActionState(
    async (previousState: ProfileActionResult | null, formData: FormData) => {
      const result = await updateOwnProfileAction(previousState, formData)
      if (result.ok) {
        formRef.current?.reset()
        setIsEditing(false)
      }
      return result
    },
    null,
  )
  const [withdrawState, withdrawFormAction, isWithdrawingPending] = useActionState(
    deactivateOwnProfileAction,
    null,
  )
  const { captureSubmission } = useSelectiveFormRecovery(updateState, formRef)

  function cancelEditing() {
    formRef.current?.reset()
    setIsEditing(false)
  }

  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="MY"
        title={profile.name}
        description="내 정보와 알림 수신 상태를 확인합니다."
      />
      <ContentCard>
        <div className={layout.row}>
          <strong>계정 상태</strong>
          <StatusBadge tone={profile.isActive ? 'positive' : 'neutral'}>
            {profile.isActive ? '활성' : '탈퇴'}
          </StatusBadge>
        </div>
        <div className={layout.row}>
          <strong>이메일</strong>
          <span className={styles.breakableValue}>{profile.email}</span>
        </div>
        <div className={layout.row}>
          <strong>현재 적용 시급</strong>
          <span>{currencyFormatter.format(profile.hourlyWage)}원</span>
        </div>
      </ContentCard>

      <ContentCard>
        <form
          action={updateFormAction}
          className={styles.form}
          noValidate
          onSubmitCapture={captureSubmission}
          ref={formRef}
        >
          <TextField
            defaultValue={profile.name}
            disabled={!isEditing || isUpdating}
            error={getFirstFieldError(updateState?.fieldErrors, 'name')}
            label="이름"
            name="name"
            required
          />
          <TextField
            autoComplete="tel"
            defaultValue={profile.phone}
            disabled={!isEditing || isUpdating}
            error={getFirstFieldError(updateState?.fieldErrors, 'phone')}
            inputMode="tel"
            label="휴대폰 번호"
            name="phone"
            required
          />
          <div className={layout.wrap}>
            {isEditing ? (
              <>
                <Button disabled={isUpdating} type="submit">
                  {isUpdating ? <>저장 중<LoadingDots /></> : '변경 저장'}
                </Button>
                <Button variant="secondary" onClick={cancelEditing}>
                  취소
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                내 정보 수정
              </Button>
            )}
            <Button variant="secondary" onClick={() => setIsWithdrawing(true)}>
              회원 탈퇴 신청
            </Button>
          </div>
          {updateState?.message && !updateState.fieldErrors ? (
            <p
              className={updateState.ok ? styles.message : styles.errorMessage}
              role={updateState.ok ? 'status' : 'alert'}
            >
              {updateState.message}
            </p>
          ) : null}
        </form>
      </ContentCard>

      {isWithdrawing ? (
        <section className={styles.confirmation} aria-labelledby="withdraw-title">
          <strong id="withdraw-title">회원 탈퇴를 신청할까요?</strong>
          <p>로그인과 새 신청은 중단되며 기존 근무·출석·급여 이력은 보존됩니다.</p>
          <form action={withdrawFormAction} className={layout.wrap}>
            <Button disabled={isWithdrawingPending} type="submit">
              {isWithdrawingPending ? <>처리 중<LoadingDots /></> : '탈퇴 신청 확인'}
            </Button>
            <Button variant="secondary" onClick={() => setIsWithdrawing(false)}>
              취소
            </Button>
          </form>
          {withdrawState?.message ? (
            <p
              className={withdrawState.ok ? styles.message : styles.errorMessage}
              role={withdrawState.ok ? 'status' : 'alert'}
            >
              {withdrawState.message}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
