---
name: lavi-domain-rules
description: Implement or revise Lavi Crew scheduling, assignment, attendance, and payroll business rules as pure domain logic with edge-case tests. Use when behavior or calculations change. Do not use for presentation-only or persistence-only changes.
---

# Lavi Domain Rules

1. Read `AGENTS.md` and the requirement that defines the rule.
2. Convert confirmed behavior into a decision table with normal, boundary, invalid, and correction cases.
3. Separate policy decisions from date/time parsing, persistence, and UI formatting.
4. Implement deterministic pure functions with explicit units for timestamps, durations, and money.
5. Add tests for boundaries relevant to the change, including exact cutoffs, values immediately above and below them, status transitions, replacements, and corrections.
6. Keep Controllers responsible for orchestration and Repositories responsible for persistence; do not move those concerns into Domain code.
7. Run the related tests and `npm run lint`, then report covered cases and unresolved policy questions.
