import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'

import * as layout from '@/shared/ui/layout/layout.css'

export default function DailyScheduleNotFound() {
  return (
    <div className={layout.page}>
      <PageHeader
        backHref="/admin/schedules"
        backLabel="일정으로 돌아가기"
        eyebrow="일별 일정 관리"
        title="일정을 찾지 못했습니다"
      />
      <ContentCard>
        <p>날짜 주소를 확인하거나 일정 달력에서 등록된 일정을 다시 선택해 주세요.</p>
      </ContentCard>
    </div>
  )
}
