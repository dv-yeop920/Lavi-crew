import { ManagementListView } from '@/features/management/views/management-view'

const workers = [
  { detail: '7월 신청 4일 · 연회장 8회', label: '김민지', status: '활성' },
  { detail: '7월 신청 2일 · 안내 5회', label: '박서준', status: '활성' },
  { detail: '7월 신청 3일 · 신부대기실 3회', label: '이수빈', status: '활성' },
]

export default function AdminWorkersPage() {
  return (
    <ManagementListView
      title="알바 관리"
      description="회원 정보와 월 신청 일수, 포지션 이력을 확인합니다."
      items={workers}
    />
  )
}
