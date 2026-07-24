'use client'

import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'

import * as layout from '../layout/layout.css'

export function RouteError({ reset }: { reset: () => void }) {
  return (
    <div className={layout.page}>
      <ContentCard>
        <div className={layout.stack}>
          <strong>정보를 불러오지 못했습니다.</strong>
          <p className={layout.subdued}>연결 상태를 확인한 뒤 다시 시도해 주세요.</p>
          <div>
            <Button onClick={reset}>다시 시도</Button>
          </div>
        </div>
      </ContentCard>
    </div>
  )
}
