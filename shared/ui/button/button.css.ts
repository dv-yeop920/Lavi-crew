import { style, styleVariants } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

const base = style({
  minHeight: '2.75rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
  paddingInline: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.55,
    },
  },
})

export const button = styleVariants({
  primary: [
    base,
    {
      background: semanticVars.color.primaryNormal,
      color: semanticVars.color.onPrimary,
    },
  ],
  secondary: [
    base,
    {
      background: semanticVars.color.surface,
      color: semanticVars.color.labelNormal,
    },
  ],
})
