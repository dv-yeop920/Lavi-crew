export function getCanonicalMonth(monthQuery: string | undefined) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthQuery ?? '') ? (monthQuery as string) : null
}
