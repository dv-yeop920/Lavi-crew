import 'server-only'

import { requireRole } from '@/shared/auth/session'

import {
  deactivateOwnProfileRecord,
  getOwnProfileRecord,
  signOutProfileSession,
  updateOwnProfileRecord,
} from '../repositories/profile-repository'
import type { ProfileActionResult } from '../schemas/profile-input'

export async function getOwnProfileController() {
  const worker = await requireRole('worker')
  const profile = await getOwnProfileRecord(worker.id)
  if (!profile) throw new Error('프로필을 찾을 수 없습니다.')
  return profile
}

export async function updateOwnProfileController(input: {
  kakaoConsent: boolean
  name: string
  phone: string
}): Promise<ProfileActionResult> {
  await requireRole('worker')
  const { error } = await updateOwnProfileRecord(input)
  return error
    ? { code: 'PROFILE_UPDATE_FAILED', message: '내 정보를 저장하지 못했습니다.', ok: false }
    : { message: '내 정보를 저장했습니다.', ok: true }
}

export async function deactivateOwnProfileController(): Promise<ProfileActionResult> {
  await requireRole('worker')
  const { error } = await deactivateOwnProfileRecord()
  if (error)
    return {
      code: 'PROFILE_DEACTIVATE_FAILED',
      message: '회원 탈퇴를 처리하지 못했습니다.',
      ok: false,
    }
  await signOutProfileSession()
  return { message: '회원 탈퇴를 처리했습니다.', ok: true }
}
