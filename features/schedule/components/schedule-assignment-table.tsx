import { POSITION_CATALOG } from '@/shared/domain/positions'
import { Button } from '@/shared/ui/button/button'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import * as styles from './schedule-assignment-table.css'

export const scheduleWorkers = [
  { id: 'admin', name: '라비에벨 팀장', summary: '지난달 출근 6회 · 팀장 6회 · 가능: 팀장, 메인' },
  {
    id: 'minji',
    name: '김민지',
    summary: '지난달 출근 4회 · 메인 3회, 스캔 1회 · 가능: 메인, 스캔',
  },
  { id: 'seojun', name: '박서준', summary: '지난달 출근 3회 · 안내 3회 · 가능: 안내, 매니저' },
  {
    id: 'subin',
    name: '이수빈',
    summary: '지난달 출근 5회 · 대기실 3회, 드레스 2회 · 가능: 대기실, 드레스',
  },
  {
    id: 'jiho',
    name: '최지호',
    summary: '지난달 출근 4회 · 축가 2회, 스캔 2회 · 가능: 축가, 스캔',
  },
  {
    id: 'yuna',
    name: '정유나',
    summary: '지난달 출근 6회 · 매니저 4회, 안내 2회 · 가능: 매니저, 안내',
  },
  { id: 'doyun', name: '한도윤', summary: '지난달 출근 2회 · 메인 2회 · 가능: 메인' },
  {
    id: 'sora',
    name: '윤소라',
    summary: '지난달 출근 3회 · 드레스 2회, 대기실 1회 · 가능: 드레스, 대기실',
  },
  { id: 'hyunwoo', name: '강현우', summary: '지난달 출근 4회 · 스캔 4회 · 가능: 스캔, 축가' },
  {
    id: 'nari',
    name: '오나리',
    summary: '지난달 출근 5회 · 안내 3회, 매니저 2회 · 가능: 안내, 매니저',
  },
  { id: 'junho', name: '송준호', summary: '지난달 출근 3회 · 매니저 3회 · 가능: 매니저, 메인' },
  { id: 'chaeun', name: '임채은', summary: '지난달 출근 2회 · 안내 2회 · 가능: 안내, 대기실' },
] as const

export type PositionAssignment = {
  assignedWorkerIds: string[]
  id: string
  minimumAssigneeCount: number
  name: string
  trainingFlags: boolean[]
}

const defaultWorkersByPosition = {
  dress: ['subin'],
  guide: ['seojun', 'nari'],
  leader: ['admin'],
  main: ['doyun'],
  manager: ['yuna', 'junho'],
  scan: ['minji'],
  song: ['jiho'],
  'waiting-room': ['sora'],
} as const

export function createDefaultPositionAssignments(date: string): PositionAssignment[] {
  return POSITION_CATALOG.map((position) => ({
    assignedWorkerIds: [...defaultWorkersByPosition[position.id]],
    id: `${date}-${position.id}`,
    minimumAssigneeCount: position.defaultAssigneeCount,
    name: position.name,
    trainingFlags: defaultWorkersByPosition[position.id].map(() => false),
  }))
}

type ScheduleAssignmentTableProps = {
  isEditing?: boolean
  onAddPerson?: (positionId: string) => void
  onRemovePerson?: (positionId: string, personIndex: number) => void
  onToggleTraining?: (positionId: string, personIndex: number, isTraining: boolean) => void
  onUpdateWorker?: (positionId: string, personIndex: number, workerId: string) => void
  positions: PositionAssignment[]
}

export function ScheduleAssignmentTable({
  isEditing = true,
  onAddPerson,
  onRemovePerson,
  onToggleTraining,
  onUpdateWorker,
  positions,
}: ScheduleAssignmentTableProps) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.assignmentTable}>
        <thead>
          <tr>
            <th scope="col">포지션</th>
            <th scope="col">배정 인원</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr key={position.id}>
              <th scope="row">{position.name}</th>
              <td>
                <div className={styles.personSelectList}>
                  {position.assignedWorkerIds.map((workerId, personIndex) => {
                    const selectedWorker = scheduleWorkers.find((worker) => worker.id === workerId)

                    if (!isEditing) {
                      return selectedWorker ? (
                        <div
                          className={styles.assignedPerson}
                          key={`${position.id}-${personIndex}`}
                        >
                          <div className={styles.assignedPersonHeader}>
                            <strong>{selectedWorker.name}</strong>
                            {position.trainingFlags[personIndex] ? (
                              <StatusBadge tone="accent">교육</StatusBadge>
                            ) : null}
                          </div>
                          <span className={styles.personSummary}>{selectedWorker.summary}</span>
                        </div>
                      ) : null
                    }

                    const selectId = `${position.id}-${personIndex}-worker`
                    const canRemove = personIndex >= position.minimumAssigneeCount

                    return (
                      <div
                        className={styles.personSelectField}
                        key={`${position.id}-${personIndex}`}
                      >
                        <label className={styles.visuallyHidden} htmlFor={selectId}>
                          {position.name} {personIndex + 1}번째 인원
                        </label>
                        <div className={styles.personSelectControl}>
                          <select
                            className={styles.personSelect}
                            id={selectId}
                            value={workerId}
                            onChange={(event) =>
                              onUpdateWorker?.(position.id, personIndex, event.target.value)
                            }
                          >
                            <option value="">인원을 선택하세요</option>
                            {scheduleWorkers.map((worker) => (
                              <option key={worker.id} value={worker.id}>
                                {worker.name} · {worker.summary}
                              </option>
                            ))}
                          </select>
                          {canRemove ? (
                            <button
                              aria-label={`${position.name} ${personIndex + 1}번째 추가 인원 삭제`}
                              className={styles.removePersonButton}
                              type="button"
                              onClick={() => onRemovePerson?.(position.id, personIndex)}
                            >
                              <span aria-hidden="true">×</span>
                            </button>
                          ) : null}
                        </div>
                        {selectedWorker ? (
                          <span className={styles.personSummary}>{selectedWorker.summary}</span>
                        ) : null}
                        <label className={styles.trainingToggle}>
                          <input
                            checked={position.trainingFlags[personIndex] ?? false}
                            disabled={!workerId}
                            type="checkbox"
                            onChange={(event) =>
                              onToggleTraining?.(position.id, personIndex, event.target.checked)
                            }
                          />
                          <span>교육 근무</span>
                        </label>
                      </div>
                    )
                  })}
                  {isEditing && position.assignedWorkerIds.length < 3 ? (
                    <Button
                      aria-label={`${position.name} 인원 추가`}
                      variant="secondary"
                      onClick={() => onAddPerson?.(position.id)}
                    >
                      인원 추가 ({position.assignedWorkerIds.length}/3)
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
