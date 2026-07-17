import Link from 'next/link'

import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'

import * as layout from '@/shared/ui/layout/layout.css'

const menuItems = [
  {
    description: '연락처 · 개인 시급 · 가능 포지션 · 회원 삭제',
    href: '/admin/workers',
    label: '인원 관리',
  },
  { description: '등록 · 고정 · 읽음 현황', href: '/admin/notices', label: '공지 관리' },
  { description: '코드 · 만료일 · 사용 가능 횟수', href: '/admin/invites', label: '초대 코드' },
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
