import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const form = style({
  display: 'grid',
  gap: '1rem',
})

export const field = style({
  display: 'grid',
  gap: '0.375rem',
})

export const label = style({
  color: semanticVars.color.labelNormal,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
})

export const textarea = style({
  width: '100%',
  minHeight: '7rem',
  padding: '0.75rem',
  resize: 'vertical',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
  selectors: {
    '&:focus-visible': {
      borderColor: semanticVars.color.primaryNormal,
      outline: `2px solid ${semanticVars.color.primarySoft}`,
      outlineOffset: '1px',
    },
    '&[aria-invalid="true"]': {
      borderColor: semanticVars.color.negative,
    },
  },
})

export const checkbox = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  minHeight: '2.75rem',
  color: semanticVars.color.labelNormal,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.semibold,
})

export const empty = style({
  padding: '1rem',
  color: semanticVars.color.labelNeutral,
  textAlign: 'center',
})

export const responsiveRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  minWidth: 0,
})

export const noticeSummary = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  minHeight: '2.75rem',
  cursor: 'pointer',
  selectors: {
    '&:focus-visible': {
      borderRadius: '0.5rem',
      outline: `2px solid ${semanticVars.color.primaryNormal}`,
      outlineOffset: '3px',
    },
  },
})

export const summaryText = style({
  display: 'grid',
  flex: '1 1 12rem',
  gap: '0.25rem',
  minWidth: 0,
  overflowWrap: 'anywhere',
})

export const noticeBody = style({
  display: 'grid',
  gap: '0.75rem',
  paddingTop: '1rem',
})

export const noticeContent = style({
  margin: 0,
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
  color: semanticVars.color.labelNormal,
  fontSize: semanticVars.font.size.bodyMedium,
  lineHeight: semanticVars.font.lineHeight.relaxed,
})

export const meta = style({
  margin: 0,
  overflowWrap: 'anywhere',
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.bodySmall,
  lineHeight: semanticVars.font.lineHeight.normal,
})

export const error = style({
  margin: 0,
  overflowWrap: 'anywhere',
  color: semanticVars.color.negative,
  fontSize: semanticVars.font.size.captionLarge,
  fontWeight: semanticVars.font.weight.semibold,
  lineHeight: semanticVars.font.lineHeight.normal,
})

export const editor = style({
  marginTop: '0.75rem',
})

export const dialog = style({
  width: 'min(32rem, calc(100% - 2rem))',
  maxHeight: 'calc(100% - 2rem)',
  margin: 'auto',
  padding: '1rem',
  overflow: 'auto',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '1rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
})
