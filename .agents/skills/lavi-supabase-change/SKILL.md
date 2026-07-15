---
name: lavi-supabase-change
description: Design, implement, or review Lavi Crew Supabase schema, migration, constraint, index, RLS policy, RPC, and Auth integration changes. Use whenever a task changes database structure or data-access permissions. Do not use for UI-only work.
---

# Lavi Supabase Change

1. Read `AGENTS.md`, `docs/architecture.md`, the ERD, and only the relevant requirements.
2. Define tables, relationships, constraints, status transitions, indexes, and retention behavior before writing SQL.
3. Write an access matrix for worker, admin, anonymous, and server-only operations.
4. Add RLS policies for every new access path and keep privileged keys server-only.
5. Use an RPC when one business operation must change multiple records atomically.
6. Preserve confirmed attendance and payroll history; prefer explicit correction or status transitions over destructive deletion.
7. Validate migrations and policy behavior with representative allowed and denied cases.
8. Update the ERD or architecture document when the persisted model or access boundary changes.
9. Report migration order, verification performed, rollback considerations, and any operation requiring production authority.
