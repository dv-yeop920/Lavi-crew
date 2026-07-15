---
name: lavi-ui-publishing
description: Implement or revise Lavi Crew screens, layouts, design tokens, and shared UI components with mobile-first behavior. Use for UI design and publishing work that must follow Design.md and vanilla-extract. Do not use for database-only or domain-only changes.
---

# Lavi UI Publishing

1. Read `Design.md` completely, then read the relevant screen and user-flow documents.
2. Inspect existing semantic tokens, `shared/ui`, feature components, and route layouts before designing a new API.
3. Decide whether each component belongs in `shared/ui` or the owning feature using `AGENTS.md`.
4. Implement semantic tokens and the smallest reusable component API before composing the page.
5. Keep interactive client boundaries as small as possible and preserve server-compatible components by default.
6. Verify relevant mobile widths, safe areas, light/dark tokens, keyboard behavior, accessible names, loading/error/empty states, and content overlap.
7. Run `npm run lint`; also run `npm run build` when routes, layouts, imports, or server/client boundaries changed.
8. Report the widths and states verified and any design value left unresolved because the source is TBD.
