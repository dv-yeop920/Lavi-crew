import { maskEmail } from '@/shared/lib/mask-contact'

import { getOwnProfileController } from '../model/profile-controller'

import { ProfileView } from './profile-view'

export async function ProfilePageView() {
  const profile = await getOwnProfileController()
  return (
    <ProfileView
      profile={{
        email: maskEmail(profile.email),
        hourlyWage: profile.hourly_wage,
        isActive: profile.is_active,
        name: profile.name,
        phone: profile.phone,
      }}
    />
  )
}
