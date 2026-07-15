import { style } from '@vanilla-extract/css'

export const main = style({
  display: 'grid',
  minHeight: '100dvh',
  placeItems: 'center',
  padding: '24px',
})

export const content = style({
  maxWidth: '560px',
})

export const eyebrow = style({
  color: '#9d3b2f',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
})

export const title = style({
  margin: '12px 0 8px',
  fontSize: 'clamp(32px, 8vw, 56px)',
  lineHeight: 1.1,
})

export const description = style({
  color: '#665b55',
  fontSize: '18px',
  lineHeight: 1.6,
})
