import Link from 'next/link'

import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as layout from '@/shared/ui/layout/layout.css'

const menuItems = [
  { description: '알바 목록 · 프로필 · 비활성화', href: '/admin/workers', label: '알바 관리' },
  {
    description: '포지션 · 기본 시급 · 사용 상태',
    href: '/admin/positions',
    label: '포지션 · 시급',
  },
  { description: '등록 · 고정 · 읽음 현황', href: '/admin/notices', label: '공지 관리' },
  { description: '신청 일수 · 포지션 · 월별 급여', href: '/admin/payroll', label: '통계 · 급여' },
]

export function ManagementMenuView() {
  return (
    <div className={layout.page}>
      <PageHeader eyebrow="관리" title="운영 설정" description="인원과 운영 기준을 관리합니다." />
      <ul className={layout.list}>
        {menuItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>
              <ContentCard>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </ContentCard>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

type ManagementListViewProps = {
  description: string
  items: Array<{ detail: string; label: string; status: string }>
  title: string
}

export function ManagementListView({ description, items, title }: ManagementListViewProps) {
  return (
    <div className={layout.page}>
      <PageHeader eyebrow="관리자" title={title} description={description} />
      <ul className={layout.list}>
        {items.map((item) => (
          <li key={item.label}>
            <ContentCard>
              <div className={layout.row}>
                <strong>{item.label}</strong>
                <StatusBadge tone="neutral">{item.status}</StatusBadge>
              </div>
              <p>{item.detail}</p>
            </ContentCard>
          </li>
        ))}
      </ul>
    </div>
  )
}
