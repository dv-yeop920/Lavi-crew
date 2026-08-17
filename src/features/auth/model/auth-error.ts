import type { FormActionResult } from '@/shared/forms/form-result'

type AuthFailure = {
  code?: string
  message?: string
}

export type SignupIdentityAvailability = {
  is_invite_code_valid: boolean
  is_name_available: boolean
  is_phone_available: boolean
}

function failure(
  code: string,
  message: string,
  fieldErrors?: FormActionResult['fieldErrors'],
): FormActionResult {
  return { code, fieldErrors, message, ok: false }
}

export function mapSignupFailure(error: AuthFailure): FormActionResult {
  switch (error.code) {
    case 'email_address_invalid':
      return failure('INVALID_EMAIL', '이메일 주소를 확인해 주세요.', {
        email: ['가입에 사용할 수 없는 이메일 주소입니다.'],
      })
    case 'email_address_not_authorized':
      return failure('EMAIL_NOT_AUTHORIZED', '이메일 발송 설정을 확인해 주세요.', {
        email: ['현재 메일 발송 설정에서 허용되지 않은 이메일입니다. 관리자에게 문의해 주세요.'],
      })
    case 'over_email_send_rate_limit':
      return failure(
        'EMAIL_RATE_LIMITED',
        '인증 메일 발송 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.',
      )
    case 'signup_disabled':
      return failure('SIGNUP_DISABLED', '현재는 신규 회원가입을 받을 수 없습니다.')
    case 'user_already_exists':
      return failure('ACCOUNT_EXISTS', '이미 가입된 계정입니다.', {
        email: ['이미 가입된 이메일입니다. 로그인하거나 비밀번호 재설정을 이용해 주세요.'],
      })
    case 'weak_password':
      return failure('WEAK_PASSWORD', '비밀번호를 더 안전하게 설정해 주세요.', {
        password: ['다른 서비스에서 사용하지 않은 더 안전한 비밀번호를 입력해 주세요.'],
      })
  }

  if (error.message?.includes('Database error saving new user')) {
    return failure(
      'PROFILE_CREATE_FAILED',
      '가입 정보가 방금 변경되었습니다. 이름, 휴대폰 번호와 전용 코드를 다시 확인해 주세요.',
    )
  }

  return failure(
    'SIGNUP_FAILED',
    '회원가입을 완료하지 못했습니다. 입력 항목을 확인한 뒤 다시 시도해 주세요.',
  )
}

export function mapSignupIdentityAvailability(
  availability: SignupIdentityAvailability,
): FormActionResult | null {
  const fieldErrors: NonNullable<FormActionResult['fieldErrors']> = {}

  if (!availability.is_name_available) fieldErrors.name = ['이미 등록된 이름입니다.']
  if (!availability.is_phone_available) fieldErrors.phone = ['이미 등록된 휴대폰 번호입니다.']
  if (!availability.is_invite_code_valid)
    fieldErrors.inviteCode = ['라비에벨 전용 코드가 올바르지 않습니다.']

  return Object.keys(fieldErrors).length > 0
    ? failure('SIGNUP_IDENTITY_UNAVAILABLE', '입력 항목별 안내를 확인해 주세요.', fieldErrors)
    : null
}

export function repeatedSignupFailure(): FormActionResult {
  return failure('SIGNUP_UNAVAILABLE', '가입 요청을 완료할 수 없습니다.', {
    email: ['이미 가입한 이메일이라면 로그인하거나 비밀번호 재설정을 이용해 주세요.'],
  })
}

export function mapPasswordUpdateFailure(error: AuthFailure): FormActionResult {
  if (error.code === 'weak_password') {
    return failure('WEAK_PASSWORD', '비밀번호를 더 안전하게 설정해 주세요.', {
      password: ['다른 서비스에서 사용하지 않은 더 안전한 비밀번호를 입력해 주세요.'],
    })
  }
  return failure(
    'PASSWORD_UPDATE_FAILED',
    '비밀번호를 변경할 수 없습니다. 재설정 링크를 다시 요청해 주세요.',
  )
}
