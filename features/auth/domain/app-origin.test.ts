import { describe, expect, it } from 'vitest'

import { getCanonicalAppOrigin } from './app-origin'

describe('canonical app origin', () => {
  it('uses only the configured HTTP(S) origin', () => {
    expect(getCanonicalAppOrigin('https://crew.example.com/signup')).toBe(
      'https://crew.example.com',
    )
  })

  it('uses localhost only when no canonical URL is configured', () => {
    expect(getCanonicalAppOrigin()).toBe('http://localhost:3000')
  })

  it('rejects unsupported protocols', () => {
    expect(() => getCanonicalAppOrigin('javascript:alert(1)')).toThrow('http 또는 https')
  })
})
