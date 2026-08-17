import { AuthCallbackErrorView } from '@/features/auth/view/auth-callback-error-view'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ flow?: string | string[] }>
}) {
  const { flow } = await searchParams
  return (
    <AuthCallbackErrorView flow={flow === 'reset-password' ? 'reset-password' : 'verify-email'} />
  )
}
