import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as layout from '@/shared/ui/layout/layout.css'

export function PayrollView() {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="확정 출석 기준"
        title="7월 급여"
        description="관리자가 확정한 실제 출석 시간만 반영됩니다."
      />
      <ContentCard>
        <span>이번 달 확정 급여</span>
        <strong>486,000원</strong>
        <StatusBadge tone="positive">출석 확정분</StatusBadge>
      </ContentCard>
      <ContentCard>
        <div className={layout.row}>
          <strong>7월 3주 확정 급여</strong>
          <span>108,000원</span>
        </div>
        <p>출석 확정 1회 · 9시간</p>
      </ContentCard>
      <section className={layout.stack} aria-labelledby="payroll-detail-title">
        <h2 id="payroll-detail-title">근무 내역</h2>
        <ContentCard>
          <div className={layout.row}>
            <strong>7월 19일 · 메인</strong>
            <span>108,000원</span>
          </div>
          <p>09:00–18:00 · 개인 시급 적용</p>
        </ContentCard>
        <ContentCard>
          <div className={layout.row}>
            <strong>월 평균 급여</strong>
            <span>452,000원</span>
          </div>
          <p>확정된 월 데이터 기준</p>
        </ContentCard>
      </section>
    </div>
  )
}
