'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'

import {
  authenticateDemoAccount,
  demoInviteCode,
  normalizeEmail,
  normalizePhone,
  readDemoSession,
  registerDemoWorker,
} from '@/shared/auth/demo-session'
import { Button } from '@/shared/ui/button/button'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './auth-view.css'

export function SignupView() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [hasKakaoConsent, setHasKakaoConsent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const session = readDemoSession()

    if (session) {
      router.replace(session.role === 'admin' ? '/admin' : '/home')
    }
  }, [router])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (displayName.trim().length < 2) {
      setError('이름을 2자 이상 입력해 주세요.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizeEmail(email))) {
      setError('사용할 이메일 주소를 정확히 입력해 주세요.')
      return
    }

    if (normalizePhone(phone).length !== 11) {
      setError('휴대폰 번호 11자리를 입력해 주세요.')
      return
    }

    if (password.length < 8) {
      setError('비밀번호는 8자 이상으로 입력해 주세요.')
      return
    }

    if (password !== passwordConfirm) {
      setError('비밀번호 확인이 일치하지 않아요.')
      return
    }

    if (inviteCode.trim().toUpperCase() !== demoInviteCode) {
      setError('라비에벨 전용 코드를 확인해 주세요. 데모 코드는 LAVI-DEMO입니다.')
      return
    }

    if (!hasKakaoConsent) {
      setError('스케줄 알림을 위해 카카오 알림 수신에 동의해 주세요.')
      return
    }

    if (!registerDemoWorker(displayName, email, phone, password)) {
      setError('이미 가입된 이메일 또는 휴대폰 번호예요.')
      return
    }

    authenticateDemoAccount(email, password)
    router.replace('/home')
  }

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

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            autoComplete="name"
            label="이름"
            name="displayName"
            placeholder="실명을 입력해 주세요"
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
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
            autoComplete="tel"
            inputMode="numeric"
            label="휴대폰 번호"
            name="phone"
            placeholder="01012345678"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <TextField
            autoComplete="new-password"
            hint="8자 이상 입력해 주세요."
            label="비밀번호"
            name="password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <TextField
            autoComplete="new-password"
            label="비밀번호 확인"
            name="passwordConfirm"
            required
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
          />
          <TextField
            autoCapitalize="characters"
            hint="현재 데모 전용 코드는 LAVI-DEMO입니다."
            label="라비에벨 전용 코드"
            name="inviteCode"
            placeholder="전용 코드를 입력해 주세요"
            required
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
          />

          <label className={styles.checkbox}>
            <input
              className={styles.checkboxInput}
              checked={hasKakaoConsent}
              required
              type="checkbox"
              onChange={(event) => setHasKakaoConsent(event.target.checked)}
            />
            <span>[필수] 스케줄 확정·변경 알림을 위한 카카오 알림톡 수신에 동의합니다.</span>
          </label>

          {error ? (
            <p className={styles.message} role="alert">
              {error}
            </p>
          ) : null}

          <Button className={styles.fullButton} type="submit">
            회원가입
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
