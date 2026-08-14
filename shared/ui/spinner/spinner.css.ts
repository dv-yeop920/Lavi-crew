import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

const rotate = keyframes({
  to: { transform: 'rotate(360deg)' },
})

const base = style({
  display: 'inline-block',
  border: `3px solid ${semanticVars.color.primarySoft}`,
  borderTopColor: semanticVars.color.primaryNormal,
  borderRadius: '50%',
  animation: `${rotate} 0.8s linear infinite`,
})

export const spinner = styleVariants({
  small: [base, { width: '1.25rem', height: '1.25rem', borderWidth: '2px' }],
  medium: [base, { width: '2rem', height: '2rem' }],
})

export const container = style({
  display: 'grid',
  placeItems: 'center',
  padding: '2rem',
})
