import { POSITION_CATALOG, type PositionId } from '@/shared/domain/positions'
import { Button } from '@/shared/ui/button/button'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'

import { getWorkerAvailabilityLabel, isWorkerOptionDisabled } from '../lib/schedule-worker-option'

import * as styles from './schedule-assignment-table.css'

export type ScheduleWorkerOption = {
  appliedDates?: string[]
  id: string
  isActive?: boolean
  isSelectable?: boolean
  name: string
  summary: string
}

export type PositionAssignment = {
  assignedWorkerIds: string[]
  id: PositionId
  minimumAssigneeCount: number
  name: string
  trainingFlags: boolean[]
}

export function createDefaultPositionAssignments(): PositionAssignment[] {
  return POSITION_CATALOG.map((position) => ({
    assignedWorkerIds: Array.from({ length: position.defaultAssigneeCount }, () => ''),
    id: position.id,
    minimumAssigneeCount: position.defaultAssigneeCount,
    name: position.name,
    trainingFlags: Array.from({ length: position.defaultAssigneeCount }, () => false),
  }))
}

type ScheduleAssignmentTableProps = {
  getWorkerError?: (positionId: string, personIndex: number) => string | undefined
  isEditing?: boolean
  onAddPerson?: (positionId: string) => void
  onRemovePerson?: (positionId: string, personIndex: number) => void
  onToggleTraining?: (positionId: string, personIndex: number, isTraining: boolean) => void
  onUpdateWorker?: (positionId: string, personIndex: number, workerId: string) => void
  positions: PositionAssignment[]
  selectedDate?: string
  workers?: ScheduleWorkerOption[]
}

export function ScheduleAssignmentTable({
  getWorkerError,
  isEditing = true,
  onAddPerson,
  onRemovePerson,
  onToggleTraining,
  onUpdateWorker,
  positions,
  selectedDate,
  workers = [],
}: ScheduleAssignmentTableProps) {
  const selectedWorkerIds = new Set(positions.flatMap((position) => position.assignedWorkerIds))

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
                <fieldset className={styles.positionFieldset}>
                  <legend className={styles.visuallyHidden}>
                    {selectedDate ? `${selectedDate} ` : ''}
                    {position.name} 배정
                  </legend>
                  <div className={styles.personSelectList}>
                    {position.assignedWorkerIds.map((workerId, personIndex) => {
                      const selectedWorker = workers.find((worker) => worker.id === workerId)
                      const availabilityLabel = selectedWorker
                        ? getWorkerAvailabilityLabel(selectedWorker)
                        : null

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
                              {selectedWorker.isActive === false ? (
                                <StatusBadge tone="neutral">비활성</StatusBadge>
                              ) : null}
                            </div>
                            <span className={styles.personSummary}>
                              {availabilityLabel ? `${availabilityLabel} · ` : ''}
                              {selectedWorker.summary}
                            </span>
                          </div>
                        ) : null
                      }

                      const selectId = `${selectedDate ?? 'schedule'}-${position.id}-${personIndex}-worker`
                      const errorId = `${selectId}-error`
                      const workerError = getWorkerError?.(position.id, personIndex)
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
                              aria-describedby={workerError ? errorId : undefined}
                              aria-invalid={workerError ? true : undefined}
                              value={workerId}
                              onChange={(event) =>
                                onUpdateWorker?.(position.id, personIndex, event.target.value)
                              }
                            >
                              <option value="">인원을 선택하세요</option>
                              {workers.map((worker) => (
                                <option
                                  disabled={isWorkerOptionDisabled(
                                    worker,
                                    workerId,
                                    selectedWorkerIds,
                                  )}
                                  key={worker.id}
                                  value={worker.id}
                                >
                                  {worker.name}
                                  {getWorkerAvailabilityLabel(worker)
                                    ? ` · ${getWorkerAvailabilityLabel(worker)}`
                                    : ''}
                                  {selectedDate && worker.appliedDates
                                    ? worker.appliedDates.includes(selectedDate)
                                      ? ' · 신청'
                                      : ' · 미신청'
                                    : ''}{' '}
                                  · {worker.summary}
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
                            <span className={styles.personSummary}>
                              {selectedDate && selectedWorker.appliedDates
                                ? selectedWorker.appliedDates?.includes(selectedDate)
                                  ? '해당 날짜 신청 · '
                                  : '해당 날짜 미신청 · '
                                : null}
                              {availabilityLabel ? `${availabilityLabel} · ` : ''}
                              {selectedWorker.summary}
                            </span>
                          ) : null}
                          {workerError ? (
                            <span className={styles.fieldError} id={errorId}>
                              {workerError}
                            </span>
                          ) : null}
                          <label className={styles.trainingToggle}>
                            <input
                              checked={position.trainingFlags[personIndex] ?? false}
                              disabled={!workerId || canRemove}
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
                    {isEditing &&
                    position.assignedWorkerIds.length < position.minimumAssigneeCount + 1 ? (
                      <Button
                        aria-label={`${position.name} 인원 추가`}
                        variant="secondary"
                        onClick={() => onAddPerson?.(position.id)}
                      >
                        교육 인원 추가
                      </Button>
                    ) : null}
                  </div>
                </fieldset>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
