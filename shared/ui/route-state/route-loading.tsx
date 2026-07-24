import { ContentCard } from '@/shared/ui/content-card/content-card'

import * as layout from '../layout/layout.css'

export function RouteLoading() {
  return (
    <div className={layout.page} role="status">
      <ContentCard aria-busy="true">
        <p className={layout.subdued}>정보를 불러오는 중입니다...</p>
      </ContentCard>
    </div>
  )
}
