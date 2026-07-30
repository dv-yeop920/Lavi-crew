import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260730122011_notification_outbox_processor.sql'),
  'utf8',
).toLowerCase()

describe('notification outbox processor migration', () => {
  it('claims due eligible rows with a bounded skip-locked lease', () => {
    expect(sql).toContain('p_batch_size not between 1 and 5')
    expect(sql).toContain('p_lease_seconds not between 60 and 300')
    expect(sql).toContain('for update of notification skip locked')
    expect(sql).toContain("notification.delivery_status = 'pending'")
    expect(sql).toContain('notification.next_attempt_at <= now()')
    expect(sql).toContain('notification.locked_until <= now()')
    expect(sql).toContain('profile.is_active')
    expect(sql).toContain('profile.kakao_consent')
    expect(sql).toContain('limit p_batch_size')
    expect(sql).toContain('attempt_count = notification.attempt_count + 1')
    expect(sql).toContain('lease_token = pg_catalog.gen_random_uuid()')
  })

  it('terminally fails an expired third-attempt lease after a processor crash', () => {
    expect(sql).toMatch(
      /set delivery_status = 'failed',[\s\S]*?error_code = 'error_retry_exhausted'[\s\S]*?where notification\.delivery_status = 'pending'[\s\S]*?notification\.attempt_count >= 3[\s\S]*?notification\.locked_until <= now\(\)/,
    )
    expect(sql).toContain("failure_reason = 'notification retry limit was exhausted.'")
    expect(sql).toContain('locked_at = null')
    expect(sql).toContain('lease_token = null')
  })

  it('uses lease-token completion and bounded retry state transitions', () => {
    expect(sql).toContain('and lease_token = p_lease_token')
    expect(sql).toContain('current_record.attempt_count < 3')
    expect(sql).toContain('now() + retry_delay')
    expect(sql).toContain("set delivery_status = 'sent'")
    expect(sql).toContain("'failed'::public.notification_delivery_status")
  })

  it('allows only service_role RPC execution and no direct writes', () => {
    for (const name of [
      'claim_pending_notifications',
      'complete_notification',
      'retry_or_fail_notification',
    ]) {
      expect(sql).toMatch(
        new RegExp(`create function public\\.${name}[\\s\\S]*?set search_path = ''`),
      )
      expect(sql).toMatch(
        new RegExp(`grant execute on function public\\.${name}[\\s\\S]*?to service_role`),
      )
    }
    expect(sql).toContain(
      'revoke insert, update, delete on public.notification_logs\n  from public, anon, authenticated, service_role',
    )
  })
})
