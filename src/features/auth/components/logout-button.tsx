import { logoutAction } from '@/features/auth/actions/auth-actions'
import { Button } from '@/shared/ui/button/button'

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="secondary">
        로그아웃
      </Button>
    </form>
  )
}
