import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const mutationSql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260730121953_notice_mutations.sql'),
  'utf8',
).toLowerCase()

const hardDeleteSql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260816100000_notice_hard_delete.sql'),
  'utf8',
).toLowerCase()

describe('notice mutation migration', () => {
  it('keeps idempotency requests private and row-level secured', () => {
    expect(mutationSql).toContain('create table private.notice_mutation_requests')
    expect(mutationSql).toContain(
      'alter table private.notice_mutation_requests enable row level security',
    )
    expect(mutationSql).toContain(
      'revoke all on private.notice_mutation_requests from public, anon, authenticated',
    )
    expect(mutationSql).toContain('payload_hash')
    expect(mutationSql).toContain('idempotency_key_reused')
  })

  it('uses hardened definer RPCs with optimistic concurrency', () => {
    for (const name of ['create_notice', 'update_notice', 'delete_notice', 'mark_notice_read']) {
      expect(mutationSql).toMatch(
        new RegExp(
          `create function public\\.${name}[\\s\\S]*?security definer set search_path = ''`,
        ),
      )
    }
    expect(mutationSql).toContain("raise exception 'stale_notice'")
  })

  it('removes direct writes and limits reads by role and ownership', () => {
    expect(mutationSql).toContain(
      'revoke insert, update, delete on public.notices, public.notice_reads from anon, authenticated',
    )
    expect(mutationSql).toContain('worker_id = (select auth.uid())')
    expect(mutationSql).toContain('drop policy if exists "admin inserts notices"')
    expect(mutationSql).toContain('drop policy if exists "admin updates notices"')
    expect(mutationSql).toContain('drop policy if exists "workers create own notice reads"')
  })
})

describe('notice hard delete migration', () => {
  it('physically deletes notices instead of soft delete', () => {
    expect(hardDeleteSql).toContain('delete from public.notices where id = p_notice_id')
    expect(hardDeleteSql).not.toContain("status = 'deleted'")
  })

  it('cascades notice_reads on notice deletion', () => {
    expect(hardDeleteSql).toContain('on delete cascade')
  })

  it('drops soft-delete columns and status', () => {
    expect(hardDeleteSql).toContain('drop column deleted_by')
    expect(hardDeleteSql).toContain('drop column deleted_at')
    expect(hardDeleteSql).toContain('drop column status')
    expect(hardDeleteSql).toContain('drop constraint notices_deletion_audit_check')
  })

  it('drops dependent objects before the status column', () => {
    const policyDropPos = hardDeleteSql.indexOf('drop policy')
    const indexDropPos = hardDeleteSql.indexOf('drop index if exists notices_published_idx')
    const columnDropPos = hardDeleteSql.indexOf('drop column status')
    expect(policyDropPos).toBeLessThan(columnDropPos)
    expect(indexDropPos).toBeLessThan(columnDropPos)
  })

  it('cleans up orphan notice_status enum', () => {
    expect(hardDeleteSql).toContain('drop type if exists public.notice_status')
  })
})
