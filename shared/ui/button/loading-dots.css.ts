import { keyframes, style } from '@vanilla-extract/css'

const blink = keyframes({
  '0%, 20%': { opacity: 0 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0 },
})

export const dots = style({
  display: 'inline-flex',
  gap: '2px',
  marginLeft: '1px',
})

export const dot = style({
  display: 'inline-block',
  width: '3px',
  height: '3px',
  borderRadius: '50%',
  background: 'currentColor',
  animation: `${blink} 1.4s infinite both`,
  selectors: {
    '&:nth-child(2)': { animationDelay: '0.2s' },
    '&:nth-child(3)': { animationDelay: '0.4s' },
  },
})
