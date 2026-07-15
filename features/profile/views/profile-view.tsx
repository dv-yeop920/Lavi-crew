import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as layout from '@/shared/ui/layout/layout.css'

export function ProfileView() {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="MY"
        title="홍길동"
        description="내 정보와 알림 수신 상태를 확인합니다."
      />
      <ContentCard>
        <div className={layout.row}>
          <strong>휴대폰 번호</strong>
          <span>010-****-9200</span>
        </div>
        <div className={layout.row}>
          <strong>카카오 알림</strong>
          <StatusBadge tone="positive">수신 동의</StatusBadge>
        </div>
      </ContentCard>
      <Button variant="secondary">내 정보 수정</Button>
      <Button variant="secondary">로그아웃</Button>
    </div>
  )
}
