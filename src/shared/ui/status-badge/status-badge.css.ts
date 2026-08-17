import { style, styleVariants } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

const base = style({
  display: 'inline-flex',
  width: 'fit-content',
  alignItems: 'center',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '999px',
  padding: '0.25rem 0.625rem',
  fontSize: semanticVars.font.size.labelSmall,
  fontWeight: semanticVars.font.weight.bold,
  lineHeight: semanticVars.font.lineHeight.normal,
})

export const badge = styleVariants({
  neutral: [
    base,
    { background: semanticVars.color.surfaceRaised, color: semanticVars.color.labelNeutral },
  ],
  positive: [
    base,
    { background: semanticVars.color.positiveSoft, color: semanticVars.color.positive },
  ],
  accent: [
    base,
    { background: semanticVars.color.primarySubtle, color: semanticVars.color.primaryStrong },
  ],
  warning: [
    base,
    { background: semanticVars.color.warningSoft, color: semanticVars.color.warning },
  ],
})
