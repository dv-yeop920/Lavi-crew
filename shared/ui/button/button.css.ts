import { style, styleVariants } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

const base = style({
  minHeight: '2.75rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
  paddingInline: '1rem',
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
  lineHeight: semanticVars.font.lineHeight.normal,
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.55,
    },
    '&:not(:disabled):active': {
      transform: 'translateY(1px)',
    },
  },
})

export const button = styleVariants({
  primary: [
    base,
    {
      background: semanticVars.color.primaryNormal,
      color: semanticVars.color.onPrimary,
      selectors: {
        '&:hover': {
          background: semanticVars.color.primaryStrong,
        },
      },
    },
  ],
  secondary: [
    base,
    {
      background: semanticVars.color.surface,
      color: semanticVars.color.labelNormal,
      selectors: {
        '&:hover': {
          background: semanticVars.color.primarySubtle,
          borderColor: semanticVars.color.primarySoft,
        },
      },
    },
  ],
})
