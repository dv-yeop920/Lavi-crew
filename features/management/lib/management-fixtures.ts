import type { PositionId } from '@/shared/domain/positions'

export type ManagedWorker = {
  averageMonthlyApplicationDays: number
  email: string
  history: string
  hourlyWage: number
  id: string
  isActive: boolean
  joinedAt: string
  name: string
  phone: string
  positionIds: PositionId[]
  role: 'admin' | 'worker'
}

export const managedWorkers: ManagedWorker[] = [
  {
    averageMonthlyApplicationDays: 6,
    email: 'le***@lavi-crew.com',
    history: '지난달 출근 6회 · 팀장 6회',
    hourlyWage: 15000,
    id: 'admin',
    isActive: true,
    joinedAt: '2022-03-15',
    name: '라비에벨 팀장',
    phone: '010-9200-00**',
    positionIds: ['leader', 'main'],
    role: 'admin',
  },
  {
    averageMonthlyApplicationDays: 5,
    email: 'mi***@lavi-crew.com',
    history: '지난달 출근 4회 · 메인 3회 · 스캔 1회',
    hourlyWage: 13000,
    id: 'minji',
    isActive: true,
    joinedAt: '2024-08-10',
    name: '김민지',
    phone: '010-1234-56**',
    positionIds: ['main', 'scan'],
    role: 'worker',
  },
  {
    averageMonthlyApplicationDays: 4,
    email: 'se***@lavi-crew.com',
    history: '지난달 출근 3회 · 안내 3회',
    hourlyWage: 12500,
    id: 'seojun',
    isActive: true,
    joinedAt: '2025-01-20',
    name: '박서준',
    phone: '010-2345-67**',
    positionIds: ['guide', 'manager'],
    role: 'worker',
  },
  {
    averageMonthlyApplicationDays: 6,
    email: 'su***@lavi-crew.com',
    history: '지난달 출근 5회 · 대기실 3회 · 드레스 2회',
    hourlyWage: 13000,
    id: 'subin',
    isActive: true,
    joinedAt: '2023-11-05',
    name: '이수빈',
    phone: '010-3456-78**',
    positionIds: ['waiting-room', 'dress'],
    role: 'worker',
  },
  {
    averageMonthlyApplicationDays: 2,
    email: 'hy***@lavi-crew.com',
    history: '지난달 출근 4회 · 스캔 4회',
    hourlyWage: 12000,
    id: 'hyunwoo',
    isActive: false,
    joinedAt: '2024-02-28',
    name: '강현우',
    phone: '010-4567-89**',
    positionIds: ['scan', 'song'],
    role: 'worker',
  },
]
