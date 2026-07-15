import { ManagementListView } from '@/features/management/views/management-view'

const positions = [
  { detail: '기본 시급 12,000원', label: '연회장', status: '사용 중' },
  { detail: '기본 시급 13,000원', label: '안내', status: '사용 중' },
  { detail: '기본 시급 14,000원', label: '신부대기실', status: '사용 중' },
]

export default function AdminPositionsPage() {
  return (
    <ManagementListView
      title="포지션 · 시급"
      description="포지션별 기본 시급을 등록하고 사용 상태를 관리합니다."
      items={positions}
    />
  )
}
