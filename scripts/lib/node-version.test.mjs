import { describe, expect, it } from 'vitest'

import { assertSupportedNodeVersion } from './node-version.mjs'

describe('browser E2E Node version guard', () => {
  it('accepts Node.js 22 or later', () => {
    expect(() => assertSupportedNodeVersion('22.0.0')).not.toThrow()
    expect(() => assertSupportedNodeVersion('24.1.0')).not.toThrow()
  })

  it('rejects unsupported or malformed versions with an actionable message', () => {
    expect(() => assertSupportedNodeVersion('20.19.0')).toThrow('Node.js 22 이상')
    expect(() => assertSupportedNodeVersion('unknown')).toThrow('Node.js 22 이상')
  })
})
