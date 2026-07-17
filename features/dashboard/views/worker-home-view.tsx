import Link from 'next/link'

import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './dashboard.css'
import * as layout from '@/shared/ui/layout/layout.css'

export function WorkerHomeView() {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="7월 3주차"
        title="안녕하세요, 홍길동님"
        description="확정된 일정과 새 공지를 확인하세요."
      />

      <section className={layout.stack} aria-labelledby="next-shift-title">
        <div className={layout.row}>
          <h2 id="next-shift-title">다음 근무</h2>
          <Link className={styles.link} href="/schedule">
            전체 일정
          </Link>
        </div>
        <ContentCard>
          <div className={layout.row}>
            <div className={styles.metric}>
              <strong className={styles.metricValue}>7월 19일</strong>
              <span className={styles.meta}>토요일 · 09:00–18:00</span>
            </div>
            <StatusBadge tone="accent">메인</StatusBadge>
          </div>
        </ContentCard>
      </section>

      <section className={layout.stack} aria-labelledby="application-title">
        <h2 id="application-title">일정 신청</h2>
        <ContentCard>
          <div className={layout.row}>
            <div className={styles.metric}>
              <strong>7월 신청 진행 중</strong>
              <span className={styles.meta}>마감 전까지 신청을 바꿀 수 있어요.</span>
            </div>
            <StatusBadge tone="positive">3일 신청</StatusBadge>
          </div>
          <Link className={styles.link} href="/schedule/apply">
            신청 달력 열기
          </Link>
        </ContentCard>
      </section>

      <section className={layout.stack} aria-labelledby="notice-title">
        <div className={layout.row}>
          <h2 id="notice-title">새 공지</h2>
          <Link className={styles.link} href="/notices">
            모두 보기
          </Link>
        </div>
        <ContentCard>
          <StatusBadge tone="warning">고정</StatusBadge>
          <strong>7월 유니폼 착용 안내</strong>
          <p className={styles.meta}>근무 전 변경된 유니폼 기준을 확인해 주세요.</p>
        </ContentCard>
      </section>
    </div>
  )
}
