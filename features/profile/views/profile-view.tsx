'use client'

import { useState } from 'react'

import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './profile.css'
import * as layout from '@/shared/ui/layout/layout.css'

export function ProfileView() {
  const [isEditing, setIsEditing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isWithdrawn, setIsWithdrawn] = useState(false)
  const [name, setName] = useState('홍길동')
  const [phone, setPhone] = useState('010-****-9200')
  const [isKakaoConsented, setIsKakaoConsented] = useState(true)
  const [message, setMessage] = useState('')

  function saveProfile() {
    setIsEditing(false)
    setMessage('내 정보를 저장했습니다. 현재는 클라이언트 데모입니다.')
  }

  function withdrawAccount() {
    setIsWithdrawn(true)
    setIsWithdrawing(false)
    setIsEditing(false)
    setMessage('회원 탈퇴를 신청했습니다. 기존 근무 및 급여 이력은 보존됩니다.')
  }

  return (
    <div className={layout.page}>
      <PageHeader eyebrow="MY" title={name} description="내 정보와 알림 수신 상태를 확인합니다." />
      <ContentCard>
        <div className={layout.row}>
          <strong>계정 상태</strong>
          <StatusBadge tone={isWithdrawn ? 'neutral' : 'positive'}>
            {isWithdrawn ? '탈퇴 신청' : '활성'}
          </StatusBadge>
        </div>
        <div className={layout.row}>
          <strong>이메일</strong>
          <span>wo***@example.com</span>
        </div>
        <div className={layout.row}>
          <strong>현재 적용 시급</strong>
          <span>13,000원</span>
        </div>
      </ContentCard>

      <ContentCard>
        <div className={styles.form}>
          <TextField
            disabled={!isEditing || isWithdrawn}
            label="이름"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            disabled={!isEditing || isWithdrawn}
            label="휴대폰 번호"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <label>
            <input
              checked={isKakaoConsented}
              disabled={!isEditing || isWithdrawn}
              type="checkbox"
              onChange={(event) => setIsKakaoConsented(event.target.checked)}
            />{' '}
            카카오 알림 수신 동의
          </label>
          <div className={layout.wrap}>
            {isEditing ? (
              <>
                <Button onClick={saveProfile}>변경 저장</Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  취소
                </Button>
              </>
            ) : (
              <Button disabled={isWithdrawn} variant="secondary" onClick={() => setIsEditing(true)}>
                내 정보 수정
              </Button>
            )}
            <Button
              disabled={isWithdrawn}
              variant="secondary"
              onClick={() => setIsWithdrawing(true)}
            >
              회원 탈퇴 신청
            </Button>
          </div>
        </div>
      </ContentCard>

      {isWithdrawing ? (
        <section className={styles.confirmation} aria-labelledby="withdraw-title">
          <strong id="withdraw-title">회원 탈퇴를 신청할까요?</strong>
          <p>로그인과 새 신청은 중단되며 기존 근무·출석·급여 이력은 보존됩니다.</p>
          <div className={layout.wrap}>
            <Button onClick={withdrawAccount}>탈퇴 신청 확인</Button>
            <Button variant="secondary" onClick={() => setIsWithdrawing(false)}>
              취소
            </Button>
          </div>
        </section>
      ) : null}

      {message ? (
        <p className={styles.message} aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  )
}
