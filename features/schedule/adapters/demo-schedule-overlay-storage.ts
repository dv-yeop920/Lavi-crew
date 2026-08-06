import {
  DEMO_SCHEDULE_OVERLAY_VERSION,
  type DemoScheduleOverlayDocument,
  parseDemoScheduleOverlay,
} from '../domain/demo-schedule-overlay'

export const DEMO_SCHEDULE_OVERLAY_STORAGE_KEY = 'lavi-crew:demo-schedule-overlay:v1'

export const EMPTY_DEMO_SCHEDULE_OVERLAY: DemoScheduleOverlayDocument = {
  schedules: [],
  version: DEMO_SCHEDULE_OVERLAY_VERSION,
}

export function readDemoScheduleOverlay(storage: Pick<Storage, 'getItem'>) {
  try {
    const raw = storage.getItem(DEMO_SCHEDULE_OVERLAY_STORAGE_KEY)
    if (!raw) return EMPTY_DEMO_SCHEDULE_OVERLAY
    return parseDemoScheduleOverlay(JSON.parse(raw) as unknown) ?? EMPTY_DEMO_SCHEDULE_OVERLAY
  } catch {
    return EMPTY_DEMO_SCHEDULE_OVERLAY
  }
}

export function writeDemoScheduleOverlay(
  storage: Pick<Storage, 'setItem'>,
  document: DemoScheduleOverlayDocument,
) {
  try {
    storage.setItem(DEMO_SCHEDULE_OVERLAY_STORAGE_KEY, JSON.stringify(document))
    return { ok: true as const }
  } catch {
    return {
      message: '브라우저 저장 공간에 데모 일정을 저장하지 못했습니다.',
      ok: false as const,
    }
  }
}
