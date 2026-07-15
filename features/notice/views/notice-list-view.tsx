import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as layout from '@/shared/ui/layout/layout.css'

const notices = [
  { date: '7월 14일', isPinned: true, title: '7월 유니폼 착용 안내' },
  { date: '7월 10일', isPinned: false, title: '직원 통로 이용 안내' },
  { date: '7월 3일', isPinned: false, title: '여름철 위생 수칙' },
]

type NoticeListViewProps = {
  isAdmin?: boolean
}

export function NoticeListView({ isAdmin = false }: NoticeListViewProps) {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow={isAdmin ? '공지 관리' : '공지'}
        title={isAdmin ? '공지와 읽음 현황' : '꼭 확인해 주세요'}
        description={
          isAdmin
            ? '공지 등록·수정·고정과 알바별 읽음 상태를 관리합니다.'
            : '고정된 공지가 먼저 표시됩니다.'
        }
      />
      <ul className={layout.list}>
        {notices.map((notice) => (
          <li key={notice.title}>
            <ContentCard>
              <div className={layout.row}>
                <strong>{notice.title}</strong>
                {notice.isPinned ? <StatusBadge tone="warning">고정</StatusBadge> : null}
              </div>
              <p>{notice.date}</p>
              {isAdmin ? <StatusBadge tone="neutral">읽음 18 / 24명</StatusBadge> : null}
            </ContentCard>
          </li>
        ))}
      </ul>
    </div>
  )
}
