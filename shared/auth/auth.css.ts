import { keyframes, style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

const rotate = keyframes({
  to: { transform: 'rotate(360deg)' },
})

export const guard = style({
  display: 'grid',
  minHeight: '100dvh',
  placeContent: 'center',
  justifyItems: 'center',
  gap: '0.75rem',
  color: semanticVars.color.labelNeutral,
})

export const spinner = style({
  width: '2rem',
  height: '2rem',
  border: `3px solid ${semanticVars.color.primarySoft}`,
  borderTopColor: semanticVars.color.primaryNormal,
  borderRadius: '50%',
  animation: `${rotate} 0.8s linear infinite`,
})
