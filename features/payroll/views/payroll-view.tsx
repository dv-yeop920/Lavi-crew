import Link from 'next/link'

import {
  formatActualPayrollTime,
  formatFullWeekLabel,
  formatPayrollDate,
} from '@/features/payroll/lib/payroll-display'
import { movePayrollMonth } from '@/features/payroll/lib/payroll-navigation'
import type { WorkerPayrollViewModel } from '@/features/payroll/schemas/payroll-view-model'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './payroll.css'
import * as layout from '@/shared/ui/layout/layout.css'

type ReadyWorkerPayroll = WorkerPayrollViewModel & { state: 'ready' }

const currencyFormatter = new Intl.NumberFormat('ko-KR')

function formatCurrency(amount: number) {
  return `${currencyFormatter.format(amount)}원`
}

function formatMonth(month: string) {
  const [year, numericMonth] = month.split('-')
  return `${year}년 ${Number(numericMonth)}월`
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours === 0) return `${remainder}분`
  if (remainder === 0) return `${hours}시간`
  return `${hours}시간 ${remainder}분`
}

export function PayrollView({ viewModel }: { viewModel: ReadyWorkerPayroll }) {
  const previousMonth = movePayrollMonth(viewModel.month, -1)
  const nextMonth = movePayrollMonth(viewModel.month, 1)

  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="확정 출석 기준"
        title={`${formatMonth(viewModel.month)} 급여`}
        description="관리자가 확정한 실제 출석 시간만 반영됩니다."
      />
      <nav className={styles.monthNavigator} aria-label="급여 조회 월">
        <Link
          aria-label="이전 달 급여 보기"
          className={styles.arrowLink}
          href={`/payroll?month=${previousMonth}`}
        >
          ←
        </Link>
        <strong>{formatMonth(viewModel.month)}</strong>
        <Link
          aria-label="다음 달 급여 보기"
          className={styles.arrowLink}
          href={`/payroll?month=${nextMonth}`}
        >
          →
        </Link>
      </nav>

      <ContentCard>
        <div className={styles.summary}>
          <span>이번 달 확정 급여</span>
          <strong className={styles.amount}>{formatCurrency(viewModel.totalAmount)}</strong>
          <StatusBadge tone={viewModel.details.length > 0 ? 'positive' : 'neutral'}>
            {viewModel.details.length > 0 ? '출석 확정분' : '확정 내역 없음'}
          </StatusBadge>
        </div>
      </ContentCard>

      <section
        className={layout.stack}
        aria-describedby="payroll-week-description"
        aria-labelledby="payroll-week-title"
      >
        <h2 id="payroll-week-title">주별 급여</h2>
        <p className={styles.meta} id="payroll-week-description">
          선택한 달과 겹치는 각 주의 월요일–일요일 전체 확정 급여입니다. 따라서 이번 달 합계와 다를
          수 있습니다.
        </p>
        {viewModel.weeks.length > 0 ? (
          <ul className={layout.list}>
            {viewModel.weeks.map((week) => (
              <li key={week.start}>
                <ContentCard>
                  <div className={styles.responsiveRow}>
                    <strong>{formatFullWeekLabel(week)}</strong>
                    <span>{formatCurrency(week.amount)}</span>
                  </div>
                  <p className={styles.meta}>
                    월–일 전체 · 출석 확정 {week.shiftCount}회 · 실제 근무{' '}
                    {formatMinutes(week.workedMinutes)}
                  </p>
                </ContentCard>
              </li>
            ))}
          </ul>
        ) : (
          <ContentCard>
            <p className={styles.emptyState}>이 달에 확정된 급여가 없습니다.</p>
          </ContentCard>
        )}
      </section>

      <section className={layout.stack} aria-labelledby="payroll-detail-title">
        <h2 id="payroll-detail-title">근무 내역</h2>
        {viewModel.details.length > 0 ? (
          <ul className={layout.list}>
            {viewModel.details.map((detail) => {
              const actualStartedAt = formatActualPayrollTime(detail.actualStartedAt)
              const actualEndedAt = formatActualPayrollTime(detail.actualEndedAt)

              return (
                <li key={detail.id}>
                  <ContentCard>
                    <div className={styles.responsiveRow}>
                      <strong>
                        {formatPayrollDate(detail.workDate)} · {detail.positionName}
                      </strong>
                      <span>{formatCurrency(detail.amount)}</span>
                    </div>
                    <p className={styles.meta}>
                      {actualStartedAt && actualEndedAt
                        ? `실제 ${actualStartedAt}–${actualEndedAt}`
                        : '실제 출퇴근 시각 확인 필요'}{' '}
                      · 기본 {formatMinutes(detail.regularMinutes)}
                      {detail.overtimeMinutes > 0
                        ? ` · 연장 ${formatMinutes(detail.overtimeMinutes)}`
                        : ''}
                    </p>
                  </ContentCard>
                </li>
              )
            })}
          </ul>
        ) : (
          <ContentCard>
            <p className={styles.emptyState}>표시할 확정 근무 내역이 없습니다.</p>
          </ContentCard>
        )}
      </section>

      <ContentCard>
        <div className={styles.responsiveRow}>
          <strong>확정 급여가 있는 월 평균</strong>
          <span>{formatCurrency(viewModel.averagePaidMonthAmount)}</span>
        </div>
        <p className={styles.meta}>
          {viewModel.averagePaidMonthAmount > 0
            ? '실제 출석 시각이 있는 확정 급여 월만 계산했습니다.'
            : '아직 평균을 계산할 확정 급여 월이 없습니다.'}
        </p>
      </ContentCard>
    </div>
  )
}
