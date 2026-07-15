import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as layout from '@/shared/ui/layout/layout.css'

const workers = [
  { name: '김민지', position: '연회장', state: '미확정' },
  { name: '박서준', position: '안내', state: '출석' },
  { name: '이수빈', position: '신부대기실', state: '미확정' },
]

export function AdminAttendanceView() {
  return (
    <div className={layout.page}>
      <PageHeader
        eyebrow="7월 19일 일요일"
        title="출석 관리"
        description="실제 출근 시간과 퇴근 시간을 확인한 뒤 확정합니다."
      />
      <ul className={layout.list}>
        {workers.map((worker) => (
          <li key={worker.name}>
            <ContentCard>
              <div className={layout.row}>
                <div>
                  <strong>{worker.name}</strong>
                  <p>{worker.position}</p>
                </div>
                <StatusBadge tone={worker.state === '출석' ? 'positive' : 'warning'}>
                  {worker.state}
                </StatusBadge>
              </div>
              <div className={layout.wrap}>
                <Button variant="secondary">출석 확정</Button>
                <Button variant="secondary">결근 처리</Button>
              </div>
            </ContentCard>
          </li>
        ))}
      </ul>
    </div>
  )
}
