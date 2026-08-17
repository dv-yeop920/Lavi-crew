type DatabaseError = {
  code?: string
  details?: string
  message?: string
}

export function getProfileUniqueConflict(error: DatabaseError | null) {
  if (error?.code !== '23505') return null
  const detail = `${error.details ?? ''} ${error.message ?? ''}`
  if (detail.includes('profiles_name_normalized_unique_idx')) return 'name' as const
  if (detail.includes('profiles_phone_key')) return 'phone' as const
  return null
}
