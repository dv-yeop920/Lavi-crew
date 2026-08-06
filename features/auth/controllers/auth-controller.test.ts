import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getAuthenticatedProfile, signInWithPassword, signOut } = vi.hoisted(() => ({
  getAuthenticatedProfile: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/shared/auth/session', () => ({ getAuthenticatedProfile }))
vi.mock('../repositories/auth-repository', () => ({
  checkSignupIdentity: vi.fn(),
  resendSignupConfirmation: vi.fn(),
  sendPasswordReset: vi.fn(),
  signInWithPassword,
  signOut,
  signUpWorker: vi.fn(),
  updatePassword: vi.fn(),
}))

import { loginController } from './auth-controller'

describe('login controller session cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signInWithPassword.mockResolvedValue({ error: null })
    signOut.mockResolvedValue({ error: null })
  })

  it('signs out and returns a safe error when profile lookup fails', async () => {
    getAuthenticatedProfile.mockRejectedValue(new Error('temporary database failure'))

    await expect(
      loginController({ email: 'worker@example.com', password: 'password123' }),
    ).resolves.toEqual({
      code: 'PROFILE_LOOKUP_FAILED',
      message: '계정 정보를 확인하지 못했습니다. 잠시 후 다시 로그인해 주세요.',
      ok: false,
    })
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('keeps the safe error even if best-effort sign out throws', async () => {
    getAuthenticatedProfile.mockRejectedValue(new Error('temporary database failure'))
    signOut.mockRejectedValue(new Error('provider unavailable'))

    const result = await loginController({
      email: 'worker@example.com',
      password: 'password123',
    })
    expect(result.code).toBe('PROFILE_LOOKUP_FAILED')
    expect(result.ok).toBe(false)
  })
})
