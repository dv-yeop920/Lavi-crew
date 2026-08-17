export const POSITION_CATALOG = [
  { defaultAssigneeCount: 1, id: 'leader', name: '팀장' },
  { defaultAssigneeCount: 1, id: 'scan', name: '스캔' },
  { defaultAssigneeCount: 1, id: 'main', name: '메인' },
  { defaultAssigneeCount: 1, id: 'dress', name: '드레스' },
  { defaultAssigneeCount: 1, id: 'song', name: '축가' },
  { defaultAssigneeCount: 2, id: 'manager', name: '매니저' },
  { defaultAssigneeCount: 2, id: 'guide', name: '안내' },
  { defaultAssigneeCount: 1, id: 'waiting-room', name: '대기실' },
] as const

export type PositionId = (typeof POSITION_CATALOG)[number]['id']
export type PositionName = (typeof POSITION_CATALOG)[number]['name']
