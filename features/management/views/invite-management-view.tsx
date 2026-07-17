'use client'

import { useState } from 'react'

import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './management.css'
import * as layout from '@/shared/ui/layout/layout.css'

type InviteCode = {
  expiresAt: string
  id: string
  isActive: boolean
  label: string
  limit: number
  used: number
}

const initialInviteCodes: InviteCode[] = [
  {
    expiresAt: '2026-08-31',
    id: 'july-crew',
    isActive: true,
    label: '7월 신규 크루 코드',
    limit: 30,
    used: 7,
  },
]

export function InviteManagementView() {
  const [inviteCodes, setInviteCodes] = useState(initialInviteCodes)
  const [isCreating, setIsCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [expiresAt, setExpiresAt] = useState('2026-09-30')
  const [limit, setLimit] = useState('30')

  function createInviteCode() {
    const nextId = `invite-${inviteCodes.length + 1}`
    setInviteCodes((current) => [
      ...current,
      {
        expiresAt,
        id: nextId,
        isActive: true,
        label: label || '신규 크루 코드',
        limit: Number(limit) || 1,
        used: 0,
      },
    ])
    setLabel('')
    setIsCreating(false)
  }

  function deactivateInviteCode(inviteId: string) {
    setInviteCodes((current) =>
      current.map((inviteCode) =>
        inviteCode.id === inviteId ? { ...inviteCode, isActive: false } : inviteCode,
      ),
    )
  }

  return (
    <div className={layout.page}>
      <PageHeader
        backHref="/admin/more"
        backLabel="관리로 돌아가기"
        eyebrow="관리자"
        title="초대 코드"
        description="가입 전용 코드의 만료일과 사용 가능 횟수를 관리합니다."
      />
      <Button onClick={() => setIsCreating((current) => !current)}>
        {isCreating ? '등록 닫기' : '새 초대 코드 등록'}
      </Button>

      {isCreating ? (
        <ContentCard>
          <div className={styles.form}>
            <TextField label="코드 설명" value={label} onChange={(e) => setLabel(e.target.value)} />
            <TextField
              label="만료일"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <TextField
              label="사용 가능 횟수"
              min="1"
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
            <Button onClick={createInviteCode}>코드 생성</Button>
          </div>
        </ContentCard>
      ) : null}

      <ul className={layout.list}>
        {inviteCodes.map((inviteCode) => (
          <li key={inviteCode.id}>
            <ContentCard>
              <div className={layout.row}>
                <strong>{inviteCode.label}</strong>
                <StatusBadge tone={inviteCode.isActive ? 'positive' : 'neutral'}>
                  {inviteCode.isActive ? '사용 중' : '사용 중지'}
                </StatusBadge>
              </div>
              <p>
                {inviteCode.expiresAt} 만료 · {inviteCode.used} / {inviteCode.limit}회 사용
              </p>
              <Button
                disabled={!inviteCode.isActive}
                variant="secondary"
                onClick={() => deactivateInviteCode(inviteCode.id)}
              >
                사용 중지
              </Button>
            </ContentCard>
          </li>
        ))}
      </ul>
    </div>
  )
}
