import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const card = style({
  display: 'grid',
  gap: '0.75rem',
  padding: '1rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '1rem',
  background: semanticVars.color.surface,
  boxShadow: `0 0.25rem 1rem ${semanticVars.color.primarySubtle}`,
})
