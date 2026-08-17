import 'server-only'

import { redirect } from 'next/navigation'

import { getAuthenticatedProfile, getSessionUserId, requireRole } from '@/shared/auth/session'
import { getProfileUniqueConflict } from '@/shared/lib/postgres-conflict'

import {
  deactivateOwnProfileRecord,
  getOwnProfileRecord,
  signOutProfileSession,
  updateOwnProfileRecord,
} from '../api/profile-repository'
import type { ProfileActionResult } from '../schema/profile-input'

export async function getOwnProfileController() {
  const userId = await getSessionUserId()
  if (!userId) redirect('/')
  const [authProfile, profile] = await Promise.all([
    getAuthenticatedProfile(),
    getOwnProfileRecord(userId),
  ])
  if (!authProfile || authProfile.role !== 'worker')
    redirect(authProfile?.role === 'admin' ? '/admin' : '/')
  if (!profile) throw new Error('프로필을 찾을 수 없습니다.')
  return profile
}

export async function updateOwnProfileController(input: {
  name: string
  phone: string
}): Promise<ProfileActionResult> {
  await requireRole('worker')
  const { error } = await updateOwnProfileRecord(input)
  const conflictingField = getProfileUniqueConflict(error)
  if (conflictingField === 'name') {
    return {
      code: 'NAME_ALREADY_EXISTS',
      fieldErrors: { name: ['이미 다른 회원이 사용 중인 이름입니다.'] },
      message: '이름을 확인해 주세요.',
      ok: false,
    }
  }
  if (conflictingField === 'phone') {
    return {
      code: 'PHONE_ALREADY_EXISTS',
      fieldErrors: { phone: ['이미 다른 회원이 사용 중인 휴대폰 번호입니다.'] },
      message: '휴대폰 번호를 확인해 주세요.',
      ok: false,
    }
  }
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
