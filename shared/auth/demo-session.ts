export type AuthRole = 'worker' | 'admin'

export type AuthSession = {
  displayName: string
  email: string
  phone: string
  role: AuthRole
}

type DemoAccount = AuthSession & {
  password: string
}

const sessionStorageKey = 'lavi-crew-demo-session'
const accountsStorageKey = 'lavi-crew-demo-accounts'

export const demoInviteCode = 'LAVI-DEMO'

export const demoAccounts: readonly DemoAccount[] = [
  {
    displayName: '홍길동',
    email: 'worker@lavi-demo.com',
    phone: '01012345678',
    password: 'worker1234',
    role: 'worker',
  },
  {
    displayName: '라비에벨 팀장',
    email: 'admin@lavi-demo.com',
    phone: '01000000000',
    password: 'admin1234',
    role: 'admin',
  },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAuthRole(value: unknown): value is AuthRole {
  return value === 'worker' || value === 'admin'
}

function isAuthSession(value: unknown): value is AuthSession {
  return (
    isRecord(value) &&
    typeof value.displayName === 'string' &&
    typeof value.email === 'string' &&
    typeof value.phone === 'string' &&
    isAuthRole(value.role)
  )
}

function isDemoAccount(value: unknown): value is DemoAccount {
  return isRecord(value) && typeof value.password === 'string' && isAuthSession(value)
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function readRegisteredAccounts(): DemoAccount[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedAccounts = window.localStorage.getItem(accountsStorageKey)
    const parsedAccounts: unknown = storedAccounts ? JSON.parse(storedAccounts) : []
    return Array.isArray(parsedAccounts) ? parsedAccounts.filter(isDemoAccount) : []
  } catch {
    return []
  }
}

export function authenticateDemoAccount(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email)
  const accounts = [...demoAccounts, ...readRegisteredAccounts()]
  const account = accounts.find(
    (candidate) => candidate.email === normalizedEmail && candidate.password === password,
  )

  if (!account) {
    return null
  }

  const session: AuthSession = {
    displayName: account.displayName,
    email: account.email,
    phone: account.phone,
    role: account.role,
  }

  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session))
  return session
}

export function registerDemoWorker(
  displayName: string,
  email: string,
  phone: string,
  password: string,
) {
  const normalizedEmail = normalizeEmail(email)
  const normalizedPhone = normalizePhone(phone)
  const registeredAccounts = readRegisteredAccounts()
  const isDuplicate = [...demoAccounts, ...registeredAccounts].some(
    (account) => account.email === normalizedEmail || account.phone === normalizedPhone,
  )

  if (isDuplicate) {
    return false
  }

  const account: DemoAccount = {
    displayName: displayName.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role: 'worker',
  }

  window.localStorage.setItem(accountsStorageKey, JSON.stringify([...registeredAccounts, account]))
  return true
}

export function readDemoSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedSession = window.localStorage.getItem(sessionStorageKey)
    const parsedSession: unknown = storedSession ? JSON.parse(storedSession) : null
    return isAuthSession(parsedSession) ? parsedSession : null
  } catch {
    return null
  }
}

export function clearDemoSession() {
  window.localStorage.removeItem(sessionStorageKey)
}
