import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { type Browser, devices, expect, type Page, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const fixtures = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8')) as {
  admin: { email: string }
  signupInviteCode: string
  workers: Array<{ email: string; id: string; name: string }>
}

const password = process.env.LAVI_E2E_PASSWORD ?? ''
const mailpitUrl = process.env.LAVI_E2E_MAILPIT_URL ?? ''
const runId = process.env.LAVI_E2E_RUN_ID ?? ''
const mobileDevice = devices['iPhone SE']
const roleContextOptions = {
  baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
  deviceScaleFactor: mobileDevice.deviceScaleFactor,
  hasTouch: mobileDevice.hasTouch,
  isMobile: mobileDevice.isMobile,
  userAgent: mobileDevice.userAgent,
  viewport: { height: 568, width: 320 },
}

if (!password || !mailpitUrl || !runId) {
  throw new Error('test:e2e 실행기를 통해 Playwright를 실행하세요.')
}

async function login(page: Page, email: string, expectedPath: '/admin' | '/home') {
  await page.goto('/')
  await page.getByLabel('이메일', { exact: true }).fill(email)
  await page.getByLabel('비밀번호', { exact: true }).fill(password)
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${expectedPath}$`))
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible()
}

async function applyScheduleDates(email: string, dates: string[], month = scheduleMonth) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) throw signInError
  const { data: period, error: periodError } = await client
    .from('schedule_application_periods')
    .select('id, updated_at')
    .eq('year_month', `${month}-01`)
    .single()
  if (periodError) throw periodError
  const { error } = await client.rpc('save_own_monthly_schedule_applications', {
    p_expected_period_updated_at: period.updated_at,
    p_period_id: period.id,
    p_request_id: crypto.randomUUID(),
    p_selected_dates: dates,
  })
  if (error) throw error
  await client.auth.signOut()
}

function createRoleContext(browser: Browser) {
  return browser.newContext(roleContextOptions)
}

function captureUnexpectedBrowserErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`)
  })
  return errors
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

const scheduleMonth = '2099-01'
const firstScheduleDate = '2099-01-03'
const secondScheduleDate = '2099-01-04'

function formatScheduleDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date(`${date}T00:00:00`))
}

const assignmentLabels = [
  '팀장 1번째 인원',
  '스캔 1번째 인원',
  '메인 1번째 인원',
  '드레스 1번째 인원',
  '축가 1번째 인원',
  '매니저 1번째 인원',
  '매니저 2번째 인원',
  '안내 1번째 인원',
  '안내 2번째 인원',
  '대기실 1번째 인원',
]

test.describe.configure({ mode: 'serial' })

test('실제 Auth 세션이 역할별 화면과 보호 경계를 유지한다', async ({ browser }) => {
  const adminContext = await createRoleContext(browser)
  const workerContext = await createRoleContext(browser)
  const adminPage = await adminContext.newPage()
  const workerPage = await workerContext.newPage()
  const adminErrors = captureUnexpectedBrowserErrors(adminPage)
  const workerErrors = captureUnexpectedBrowserErrors(workerPage)

  await test.step('관리자와 알바가 이메일·비밀번호로 로그인한다', async () => {
    await login(adminPage, fixtures.admin.email, '/admin')
    await expect(adminPage).toHaveURL(/\/admin$/)
    await expect(adminPage.getByRole('button', { name: '로그아웃' })).toBeVisible()

    await login(workerPage, fixtures.workers[0].email, '/home')
    await expect(workerPage).toHaveURL(/\/home$/)
    await expect(workerPage.getByRole('button', { name: '로그아웃' })).toBeVisible()
  })

  await test.step('역할이 다른 보호 화면은 각자의 홈으로 되돌린다', async () => {
    await workerPage.goto('/admin')
    await expect(workerPage).toHaveURL(/\/home$/)
    await adminPage.goto('/home')
    await expect(adminPage).toHaveURL(/\/admin$/)
  })

  await test.step('새로고침 뒤에도 세션이 유지되고 로그아웃 뒤에는 보호 화면이 차단된다', async () => {
    await workerPage.reload()
    await expect(workerPage).toHaveURL(/\/home$/)
    await workerPage.getByRole('button', { name: '로그아웃' }).click()
    await expect(workerPage).toHaveURL(/\/$/)
    await workerPage.goto('/home')
    await expect(workerPage).toHaveURL(/\/$/)
  })

  expect(adminErrors).toEqual([])
  expect(workerErrors).toEqual([])
  await adminContext.close()
  await workerContext.close()
})

test('관리자 마감·배정·수정과 알바 신청·조회가 실제 DB에서 연결된다', async ({ browser }) => {
  const adminContext = await createRoleContext(browser)
  const workerContext = await createRoleContext(browser)
  const adminPage = await adminContext.newPage()
  const workerPage = await workerContext.newPage()
  const adminErrors = captureUnexpectedBrowserErrors(adminPage)
  const workerErrors = captureUnexpectedBrowserErrors(workerPage)

  await login(adminPage, fixtures.admin.email, '/admin')
  await login(workerPage, fixtures.workers[0].email, '/home')

  await test.step('관리자가 월별 신청 기간을 연다', async () => {
    await adminPage.goto(`/admin/schedules?month=${scheduleMonth}`)
    await expect(adminPage.getByRole('heading', { name: '일정 달력' })).toBeVisible()
    await expect(
      adminPage.getByRole('button', { name: '신청 날짜를 선택해 주세요' }),
    ).toBeDisabled()
    await adminPage.getByRole('button', { name: '1월 3일' }).click()
    await adminPage.getByRole('button', { name: '1월 4일' }).click()
    await adminPage.getByLabel('마감 날짜', { exact: true }).fill('2098-12-15')
    await adminPage.getByLabel('마감 시간', { exact: true }).fill('18:00')
    await adminPage.getByRole('button', { name: '신청 기간 열고 일정 등록' }).click()
    await expect(adminPage).toHaveURL(`/admin/schedules/new?month=${scheduleMonth}`)
  })

  await test.step('알바가 두 날짜를 신청한 뒤 한 날짜를 취소한다', async () => {
    await workerPage.goto(`/schedule/apply?month=${scheduleMonth}`)
    await expect(
      workerPage.getByRole('heading', { name: '근무 가능한 날을 선택하세요' }),
    ).toBeVisible()
    await workerPage.getByRole('button', { name: '1월 3일 신청', exact: true }).click()
    await workerPage.getByRole('button', { name: '1월 4일 신청', exact: true }).click()
    const firstSaveButton = workerPage.getByRole('button', { name: '신청 변경 저장' })
    await firstSaveButton.click()
    await expect(workerPage.getByRole('button', { name: '신청 변경 없음' })).toBeDisabled()
    await expect(workerPage.getByRole('status')).toContainText('월별 신청 날짜를 저장했습니다.')

    await workerPage.getByRole('button', { name: '1월 4일 신청 취소', exact: true }).click()
    const secondSaveButton = workerPage.getByRole('button', { name: '신청 변경 저장' })
    await secondSaveButton.click()
    await expect(workerPage.getByRole('button', { name: '신청 변경 없음' })).toBeDisabled()
    await expect(workerPage.getByRole('status')).toContainText('월별 신청 날짜를 저장했습니다.')
    await expectNoHorizontalOverflow(workerPage)
    await workerPage.reload()
    const selectedDateCard = workerPage
      .getByRole('article')
      .filter({ has: workerPage.getByText('신청한 날짜', { exact: true }) })
    await expect(selectedDateCard).toContainText('1일')
    await expect(
      workerPage.getByRole('button', { name: '1월 3일 신청 취소', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      workerPage.getByRole('button', { name: '1월 4일 신청', exact: true }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  await test.step('배정 후보들이 각 날짜를 실제 계정으로 신청한다', async () => {
    for (const worker of fixtures.workers.slice(1, 11)) {
      await applyScheduleDates(worker.email, [firstScheduleDate, secondScheduleDate])
    }
  })

  await test.step('관리자가 신청을 수동 마감하고 알바 화면이 잠긴다', async () => {
    await adminPage.goto(`/admin/schedules?month=${scheduleMonth}`)
    await adminPage.getByRole('button', { name: '신청 수동 마감' }).click()
    await expect(adminPage.getByRole('heading', { name: '지금 신청을 마감할까요?' })).toBeVisible()
    await adminPage.getByRole('button', { name: '신청 마감 확정' }).click()
    await expect(adminPage.getByRole('button', { name: '신청 다시 열기' })).toBeVisible()

    await workerPage.reload()
    await expect(workerPage.getByRole('button', { name: '신청 변경 없음' })).toBeDisabled()
  })

  await test.step('관리자가 이틀의 일정과 포지션별 인원을 확정한다', async () => {
    await adminPage.getByRole('link', { name: '2일 일정 등록하기' }).click()
    await expect(adminPage).toHaveURL(`/admin/schedules/new?month=${scheduleMonth}`)
    await expect(adminPage.getByRole('heading', { name: '2099년 1월 일정 등록' })).toBeVisible()

    for (const [dateIndex, date] of [firstScheduleDate, secondScheduleDate].entries()) {
      const dateRegion = adminPage.getByRole('region', { name: formatScheduleDate(date) })
      await dateRegion.getByRole('button', { name: '일정 설정' }).click()
      await dateRegion.getByLabel('예식 개수', { exact: true }).fill(String(dateIndex + 2))
      await dateRegion.getByLabel('근무 시작', { exact: true }).fill('09:00')
      await dateRegion.getByLabel('근무 종료', { exact: true }).fill('18:00')

      for (const [assignmentIndex, label] of assignmentLabels.entries()) {
        const worker = fixtures.workers[assignmentIndex + dateIndex]
        await dateRegion.getByLabel(label, { exact: true }).selectOption(worker.id)
      }
    }
    await expectNoHorizontalOverflow(adminPage)

    await adminPage.getByRole('button', { name: '스케줄 확정' }).click()
    await expect(
      adminPage.getByRole('heading', { name: '일정과 배정을 확정할까요?' }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(adminPage)
    await adminPage.getByRole('button', { name: '2일 일정 등록·배정 확정' }).click()
    await expect(adminPage).toHaveURL(`/admin/schedules?month=${scheduleMonth}`)
    await expect(
      adminPage.getByRole('link', {
        name: `${formatScheduleDate(firstScheduleDate)} 일정 상세 관리`,
      }),
    ).toContainText('배정 10명')
    await expect(
      adminPage.getByRole('link', {
        name: `${formatScheduleDate(secondScheduleDate)} 일정 상세 관리`,
      }),
    ).toContainText('배정 10명')
  })

  await test.step('관리자가 상세 화면의 같은 테이블로 일정과 배정을 수정한다', async () => {
    await adminPage.goto(`/admin/schedules/${firstScheduleDate}`)
    await expect(adminPage.getByRole('heading', { name: '등록 스케줄' })).toBeVisible()
    await expect(adminPage.getByRole('link', { name: '일정으로 돌아가기' })).toHaveAttribute(
      'href',
      `/admin/schedules?month=${scheduleMonth}`,
    )
    await adminPage.getByRole('button', { name: '수정', exact: true }).click()
    await adminPage.getByLabel('예식 개수', { exact: true }).fill('4')
    await adminPage
      .getByLabel('대기실 1번째 인원', { exact: true })
      .selectOption(fixtures.workers[10].id)
    await adminPage.getByRole('button', { name: '수정 저장' }).click()
    await expect(adminPage.getByRole('status')).toContainText('일정과 배정을 수정했습니다.')
    await adminPage.reload()
    await expect(adminPage.getByLabel('예식 개수', { exact: true })).toHaveValue('4')
    const waitingRoomRow = adminPage
      .getByRole('row')
      .filter({ has: adminPage.getByRole('rowheader', { name: '대기실' }) })
    await expect(waitingRoomRow).toContainText(fixtures.workers[10].name)
    await expectNoHorizontalOverflow(adminPage)
  })

  await test.step('알바는 본인에게 배정된 일정만 월·주·일 단위로 조회한다', async () => {
    for (const mode of ['month', 'week', 'day']) {
      await workerPage.goto(`/schedule?mode=${mode}&anchor=${firstScheduleDate}`)
      await expect(workerPage.getByRole('heading', { name: '1회 확정' })).toBeVisible()
      const scheduleUnitNavigation = workerPage.getByRole('navigation', {
        name: '일정 보기 단위',
      })
      await expect(
        scheduleUnitNavigation.getByRole('link', {
          exact: true,
          name: mode === 'month' ? '월' : mode === 'week' ? '주' : '일',
        }),
      ).toHaveAttribute('aria-current', 'page')
    }

    await workerPage.goto(`/schedule?mode=day&anchor=${secondScheduleDate}`)
    await expect(workerPage.getByRole('heading', { name: '0회 확정' })).toBeVisible()
    await expect(workerPage.getByText('이 기간에 확정된 일정이 없습니다.')).toBeVisible()
    await expectNoHorizontalOverflow(workerPage)
  })

  expect(adminErrors).toEqual([])
  expect(workerErrors).toEqual([])
  await adminContext.close()
  await workerContext.close()
})

test('회원가입 확인 메일과 PKCE callback이 실제 계정을 활성화한다', async ({ page, request }) => {
  const browserErrors = captureUnexpectedBrowserErrors(page)
  const signupEmail = `signup-${runId}@lavi.local`

  await page.goto('/signup')
  await page.getByLabel('이름', { exact: true }).fill('E2E가입알바')
  await page.getByLabel('입사 년월일', { exact: true }).fill('2024-01-15')
  await page.getByLabel('이메일', { exact: true }).fill(signupEmail)
  await page.getByLabel('휴대폰 번호', { exact: true }).fill('01090000999')
  await page.getByLabel('비밀번호', { exact: true }).fill(password)
  await page.getByLabel('비밀번호 확인', { exact: true }).fill(password)
  await page.getByLabel('라비에벨 전용 코드', { exact: true }).fill(fixtures.signupInviteCode)
  await page.getByRole('button', { name: '회원가입', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('가입 이메일로 확인 링크를 보냈습니다.')

  let messageId: string | null = null
  await expect
    .poll(
      async () => {
        const response = await request.get(`${mailpitUrl}/api/v1/messages`)
        const body = (await response.json()) as {
          messages: Array<{ ID: string; To?: Array<{ Address?: string }> }>
        }
        messageId =
          body.messages.find((message) =>
            message.To?.some((recipient) => recipient.Address === signupEmail),
          )?.ID ?? null
        return messageId
      },
      { timeout: 15_000 },
    )
    .not.toBeNull()

  const detailResponse = await request.get(`${mailpitUrl}/api/v1/message/${messageId}`)
  const detail = (await detailResponse.json()) as { HTML?: string; Text?: string }
  const content = `${detail.HTML ?? ''}\n${detail.Text ?? ''}`.replaceAll('&amp;', '&')
  const confirmationUrl = content.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/)?.[0]
  expect(confirmationUrl).toBeTruthy()

  await page.goto(confirmationUrl!)
  await expect(page).toHaveURL(/\/verify-email$/)
  await expect(page.getByRole('heading', { name: '이메일 확인을 완료했어요' })).toBeVisible()

  await page.goto('/home')
  await expect(page).toHaveURL(/\/home$/)
  await page.getByRole('button', { name: '로그아웃' }).click()
  await login(page, signupEmail, '/home')
  await expect(page).toHaveURL(/\/home$/)
  expect(browserErrors).toEqual([])
})

test('320px 화면에서 인증 화면은 가로로 넘치지 않고 키보드 포커스를 제공한다', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/')
  await expectNoHorizontalOverflow(page)

  await page.keyboard.press('Tab')
  await expect(page.locator(':focus-visible')).toBeVisible()
})
