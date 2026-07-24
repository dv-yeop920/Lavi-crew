import { maskEmail } from '@/shared/lib/mask-contact'

import { getOwnProfileController } from '../controllers/profile-controller'

import { ProfileView } from './profile-view'

export async function ProfilePageView() {
  const profile = await getOwnProfileController()
  return (
    <ProfileView
      profile={{
        email: maskEmail(profile.email),
        hourlyWage: profile.hourly_wage,
        isActive: profile.is_active,
        kakaoConsent: profile.kakao_consent,
        name: profile.name,
        phone: profile.phone,
      }}
    />
  )
}
