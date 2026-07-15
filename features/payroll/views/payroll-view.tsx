import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as layout from '@/shared/ui/layout/layout.css'

type PayrollViewProps = {
  isAdmin?: boolean
}

export function PayrollView({ isAdmin = false }: PayrollViewProps) {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="확정 출석 기준"
        title={isAdmin ? '월별 급여 현황' : '7월 급여'}
        description="관리자가 확정한 실제 출석 시간만 반영됩니다."
      />
      <ContentCard>
        <span>{isAdmin ? '전체 확정 급여' : '이번 달 확정 급여'}</span>
        <strong>{isAdmin ? '12,480,000원' : '486,000원'}</strong>
        <StatusBadge tone="positive">출석 확정분</StatusBadge>
      </ContentCard>
      <section className={layout.stack} aria-labelledby="payroll-detail-title">
        <h2 id="payroll-detail-title">{isAdmin ? '집계 기준' : '근무 내역'}</h2>
        <ContentCard>
          <div className={layout.row}>
            <strong>{isAdmin ? '확정 출석' : '7월 19일 · 연회장'}</strong>
            <span>{isAdmin ? '42건' : '108,000원'}</span>
          </div>
          <p>
            {isAdmin
              ? '포지션별 시급과 9시간 초과분 1.5배를 적용합니다.'
              : '09:00–18:00 · 기본 시급 적용'}
          </p>
        </ContentCard>
        <ContentCard>
          <div className={layout.row}>
            <strong>{isAdmin ? '출석 미확정' : '월 평균 급여'}</strong>
            <span>{isAdmin ? '4건' : '452,000원'}</span>
          </div>
          <p>{isAdmin ? '미확정 건은 급여에 포함되지 않습니다.' : '확정된 월 데이터 기준'}</p>
        </ContentCard>
      </section>
    </div>
  )
}
