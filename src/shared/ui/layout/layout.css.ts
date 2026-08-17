import { style } from '@vanilla-extract/css'

export const page = style({
  display: 'grid',
  minWidth: 0,
  gap: '1.5rem',
})

export const stack = style({
  display: 'grid',
  minWidth: 0,
  gap: '0.75rem',
})

export const row = style({
  display: 'flex',
  minWidth: 0,
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: '0.75rem',
})

export const wrap = style({
  display: 'flex',
  minWidth: 0,
  flexWrap: 'wrap',
  gap: '0.5rem',
})

export const wrapEnd = style({
  display: 'flex',
  minWidth: 0,
  flexWrap: 'wrap',
  gap: '0.5rem',
  justifyContent: 'flex-end',
})

export const list = style({
  display: 'grid',
  gap: '0.75rem',
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const subdued = style({
  margin: 0,
})
