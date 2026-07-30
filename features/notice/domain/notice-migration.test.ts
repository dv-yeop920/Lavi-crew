import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260730121953_notice_mutations.sql'),
  'utf8',
).toLowerCase()

describe('notice mutation migration', () => {
  it('keeps idempotency requests private and row-level secured', () => {
    expect(sql).toContain('create table private.notice_mutation_requests')
    expect(sql).toContain('alter table private.notice_mutation_requests enable row level security')
    expect(sql).toContain(
      'revoke all on private.notice_mutation_requests from public, anon, authenticated',
    )
    expect(sql).toContain('payload_hash')
    expect(sql).toContain('idempotency_key_reused')
  })

  it('uses hardened definer RPCs with optimistic concurrency', () => {
    for (const name of ['create_notice', 'update_notice', 'delete_notice', 'mark_notice_read']) {
      expect(sql).toMatch(
        new RegExp(
          `create function public\\.${name}[\\s\\S]*?security definer set search_path = ''`,
        ),
      )
    }
    expect(sql).toContain("raise exception 'stale_notice'")
    expect(sql).toContain("status = 'deleted', deleted_at = now(), deleted_by = caller_id")
    expect(sql).not.toContain('delete from public.notices')
  })

  it('removes direct writes and limits reads by role and ownership', () => {
    expect(sql).toContain(
      'revoke insert, update, delete on public.notices, public.notice_reads from anon, authenticated',
    )
    expect(sql).toContain("status = 'published' and (select private.is_active_user())")
    expect(sql).toContain('worker_id = (select auth.uid())')
    expect(sql).toContain('drop policy if exists "admin inserts notices"')
    expect(sql).toContain('drop policy if exists "admin updates notices"')
    expect(sql).toContain('drop policy if exists "workers create own notice reads"')
  })
})
