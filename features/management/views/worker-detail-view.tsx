'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'
import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'
import { TextField } from '@/shared/ui/text-field/text-field'

import { managedWorkers } from '../lib/management-fixtures'
import { formatJoinedAt, formatTenure } from '../lib/tenure'

import * as styles from './management.css'
import * as layout from '@/shared/ui/layout/layout.css'

type WorkerDetailViewProps = {
  workerId: string
}

export function WorkerDetailView({ workerId }: WorkerDetailViewProps) {
  const router = useRouter()
  const worker = managedWorkers.find((candidate) => candidate.id === workerId)
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const [isDeleted, setIsDeleted] = useState(() => !worker?.isActive)
  const [name, setName] = useState(worker?.name ?? '')
  const [phone, setPhone] = useState(worker?.phone ?? '')
  const [hourlyWage, setHourlyWage] = useState(String(worker?.hourlyWage ?? ''))
  const [positionIds, setPositionIds] = useState<PositionId[]>(worker?.positionIds ?? [])
  const [saveMessage, setSaveMessage] = useState('')

  if (!worker) {
    return (
      <div className={layout.page}>
        <PageHeader
          backHref="/admin/workers"
          backLabel="인원 목록으로 돌아가기"
          title="회원을 찾을 수 없습니다"
          description="목록에서 다른 회원을 선택해 주세요."
        />
      </div>
    )
  }

  function togglePosition(positionId: PositionId) {
    setPositionIds((current) =>
      current.includes(positionId)
        ? current.filter((candidate) => candidate !== positionId)
        : [...current, positionId],
    )
    setSaveMessage('')
  }

  function saveWorker() {
    if (isDeleted || Number(hourlyWage) <= 0) return

    setSaveMessage(
      '회원 정보, 개인 시급과 가능한 포지션을 저장했습니다. 현재는 클라이언트 데모입니다.',
    )
  }

  function deleteWorker() {
    setIsDeleted(true)
    setIsDeleteConfirming(false)
    setSaveMessage('회원 삭제 처리했습니다. 근무·급여 이력은 보존되고 계정만 비활성화됩니다.')
  }

  return (
    <div className={layout.page}>
      <PageHeader
        backHref="/admin/workers"
        backLabel="인원 목록으로 돌아가기"
        eyebrow="인원 상세"
        title={name}
        description="연락처, 개인 시급과 가능한 포지션을 수정할 수 있습니다."
      />

      <ContentCard>
        <div className={layout.row}>
          <strong>회원 상태</strong>
          <StatusBadge tone={isDeleted ? 'neutral' : 'positive'}>
            {isDeleted ? '삭제됨 · 로그인 불가' : '활성'}
          </StatusBadge>
        </div>
        <div className={styles.contactList}>
          <span>이메일 · {worker.email}</span>
          <span>
            가입일 · {formatJoinedAt(worker.joinedAt)} · 근속 {formatTenure(worker.joinedAt)}
          </span>
          <span>월 평균 신청 일수 · {worker.averageMonthlyApplicationDays}일</span>
          <span>{worker.history}</span>
        </div>
      </ContentCard>

      <ContentCard>
        <div className={styles.form}>
          <TextField
            disabled={isDeleted}
            label="이름"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setSaveMessage('')
            }}
          />
          <TextField
            disabled={isDeleted}
            error={Number(hourlyWage) <= 0 ? '시급은 0원보다 커야 합니다.' : undefined}
            hint="이 인원의 모든 포지션 근무에 공통으로 적용됩니다."
            inputMode="numeric"
            label="개인 시급"
            min="1"
            step="100"
            type="number"
            value={hourlyWage}
            onChange={(event) => {
              setHourlyWage(event.target.value)
              setSaveMessage('')
            }}
          />
          <TextField
            disabled={isDeleted}
            hint="개인정보 보호를 위해 데모 연락처는 일부 마스킹됩니다."
            label="연락처"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value)
              setSaveMessage('')
            }}
          />

          <fieldset disabled={isDeleted} className={styles.positionFieldset}>
            <legend className={styles.positionLegend}>가능한 포지션</legend>
            <div className={styles.checkboxGrid}>
              {POSITION_CATALOG.map((position) => (
                <label className={styles.checkbox} key={position.id}>
                  <input
                    checked={positionIds.includes(position.id)}
                    className={styles.checkboxInput}
                    type="checkbox"
                    onChange={() => togglePosition(position.id)}
                  />
                  <span>{position.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={layout.wrap}>
            <Button disabled={isDeleted || Number(hourlyWage) <= 0} onClick={saveWorker}>
              완료
            </Button>
            <Button variant="secondary" onClick={() => router.push('/admin/workers')}>
              취소
            </Button>
            <Button
              disabled={isDeleted || worker.role === 'admin'}
              variant="secondary"
              onClick={() => setIsDeleteConfirming(true)}
            >
              회원 삭제
            </Button>
          </div>
        </div>
      </ContentCard>

      {worker.role === 'admin' ? (
        <p className={styles.contactList}>단일 관리자 계정은 인원 관리에서 삭제할 수 없습니다.</p>
      ) : null}

      {isDeleteConfirming && worker.role === 'worker' ? (
        <section className={styles.confirmation} aria-labelledby="delete-worker-title">
          <strong id="delete-worker-title">{worker.name} 회원을 삭제할까요?</strong>
          <p>로그인과 신규 신청·배정은 차단되며 기존 근무 및 급여 이력은 삭제되지 않습니다.</p>
          <div className={layout.wrap}>
            <Button onClick={deleteWorker}>회원 삭제 확인</Button>
            <Button variant="secondary" onClick={() => setIsDeleteConfirming(false)}>
              취소
            </Button>
          </div>
        </section>
      ) : null}

      {saveMessage ? (
        <p className={styles.saveMessage} aria-live="polite">
          {saveMessage}
        </p>
      ) : null}
    </div>
  )
}
