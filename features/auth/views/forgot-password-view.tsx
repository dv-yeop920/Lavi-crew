'use client'

import Link from 'next/link'
import { type FormEvent, useState } from 'react'

import { Button } from '@/shared/ui/button/button'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './auth-view.css'

export function ForgotPasswordView() {
  const [email, setEmail] = useState('')
  const [isSent, setIsSent] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSent(true)
  }

  return (
    <main className={styles.viewport}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brand}>라비크루</span>
          <h1>비밀번호 재설정</h1>
          <p className={styles.description}>가입 이메일로 비밀번호 재설정 링크를 보내드려요.</p>
        </header>
        <form className={styles.form} onSubmit={handleSubmit}>
          <TextField
            autoComplete="email"
            inputMode="email"
            label="이메일"
            name="email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {isSent ? (
            <p className={styles.message} role="status">
              데모에서는 메일을 발송하지 않습니다. 서버 연결 후 재설정 링크가 발송됩니다.
            </p>
          ) : null}
          <Button className={styles.fullButton} type="submit">
            재설정 링크 받기
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
