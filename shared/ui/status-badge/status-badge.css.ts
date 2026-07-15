import { style, styleVariants } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

const base = style({
  display: 'inline-flex',
  width: 'fit-content',
  alignItems: 'center',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '999px',
  padding: '0.25rem 0.625rem',
  fontSize: '0.875rem',
  fontWeight: 700,
})

export const badge = styleVariants({
  neutral: [base, { color: semanticVars.color.labelNeutral }],
  positive: [base, { color: semanticVars.color.positive }],
  accent: [base, { color: semanticVars.color.primaryStrong }],
  warning: [base, { color: semanticVars.color.warning }],
})
