import { globalStyle } from '@vanilla-extract/css'

globalStyle('*', {
  boxSizing: 'border-box',
})

globalStyle('html, body', {
  margin: 0,
  minHeight: '100%',
})

globalStyle('body', {
  background: '#fffaf7',
  color: '#29221e',
  fontFamily: 'Arial, sans-serif',
})
