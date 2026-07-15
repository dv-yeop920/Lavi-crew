import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './schedule.css'
import * as layout from '@/shared/ui/layout/layout.css'

const applicants = [
  { history: '7월 신청 4일 · 연회장 8회', name: '김민지', status: '신청', tone: 'positive' },
  { history: '7월 신청 2일 · 안내 5회', name: '박서준', status: '신청', tone: 'positive' },
  { history: '7월 신청 0일 · 신부대기실 3회', name: '이수빈', status: '미신청', tone: 'warning' },
] as const

export function AdminAssignmentView() {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="7월 25일 토요일"
        title="인원 배정"
        description="신청 통계와 최근 포지션 이력을 확인해 배정하세요."
      />
      <ContentCard>
        <div className={layout.row}>
          <strong>필요 인원 18명</strong>
          <StatusBadge tone="accent">현재 15명</StatusBadge>
        </div>
        <p className={styles.meta}>관리자 본인과 미신청 인원도 배정할 수 있습니다.</p>
      </ContentCard>
      <section className={layout.stack} aria-labelledby="applicant-title">
        <h2 id="applicant-title">배정 후보</h2>
        <ul className={layout.list}>
          {applicants.map((person) => (
            <li key={person.name}>
              <ContentCard>
                <div className={styles.personRow}>
                  <div className={styles.detail}>
                    <strong>{person.name}</strong>
                    <span className={styles.meta}>{person.history}</span>
                  </div>
                  <StatusBadge tone={person.tone}>{person.status}</StatusBadge>
                </div>
                <div className={layout.wrap}>
                  <Button variant="secondary">포지션 선택</Button>
                  <Button variant="secondary">교육 인원</Button>
                </div>
              </ContentCard>
            </li>
          ))}
        </ul>
      </section>
      <Button>배정 확정</Button>
    </div>
  )
}
