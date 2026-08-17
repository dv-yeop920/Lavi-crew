export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey)
    throw new Error('Supabase 환경 변수가 없습니다. .env.local을 설정해 주세요.')
  return { publishableKey, url }
}
