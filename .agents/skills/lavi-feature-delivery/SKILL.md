---
name: lavi-feature-delivery
description: Orchestrate complex Lavi Crew feature delivery across multiple layers or concerns, such as UI plus domain plus Supabase/RLS plus notifications. Use when work requires dependent planning, implementation, and independent review. Do not use for a localized edit, a single document update, or a one-file fix.
---

# Lavi Feature Delivery

## Classify

1. Read `AGENTS.md` and the request.
2. Use a single agent when the work is localized and does not need an independent handoff.
3. Use this pipeline only when the result of one stage is required by the next stage or an independent review materially reduces risk.

## Run the pipeline

1. When product scope, user flow, or screen structure changes, delegate read-only reconciliation to `lavi-product-planner` first.
2. Delegate read-only technical analysis to `lavi-architect` and provide the planner handoff when one exists.
3. Resolve assumptions that would materially change product behavior before implementation.
4. Delegate implementation to one `lavi-builder`. Keep a single writer to avoid conflicting edits.
5. Delegate final diff review to `lavi-reviewer` after implementation and verification complete.
6. Let the main agent integrate findings, apply justified fixes, rerun affected checks, and deliver the final result.

Run independent read-only investigations in parallel only when they do not depend on each other's output. Pass concise decisions and artifacts between stages instead of raw logs or full transcripts.

## Communicate between agents

- When peer-agent messaging is available, planner sends product scope and acceptance criteria to architect, architect sends technical constraints to builder, builder sends changed files and verification to reviewer, and reviewer sends implementation findings to builder and scope drift to planner.
- Send source-backed questions directly to the active owner instead of asking the main agent to relay them.
- If the intended peer is not active, return a concise handoff to the main agent with the intended recipient named.
- Preserve a single writer even when read-only agents communicate in parallel.

## Stop conditions

- Do not continue from architecture to implementation when a missing user decision changes data shape, authorization, or a confirmed business rule.
- Do not accept the builder's self-review as the independent review stage.
- Do not add agents to a simple task solely to follow the pipeline.
