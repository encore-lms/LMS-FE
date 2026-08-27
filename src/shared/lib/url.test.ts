import { describe, expect, it } from 'vitest'
import { isHttpUrl } from './url'

describe('isHttpUrl', () => {
  it('http/https 주소만 통과시킨다', () => {
    expect(isHttpUrl('https://github.com/a/b')).toBe(true)
    expect(isHttpUrl(' http://a.b/c ')).toBe(true)
    expect(isHttpUrl('ftp://a.b/c')).toBe(false)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('github.com/a/b')).toBe(false)
    expect(isHttpUrl('https://')).toBe(false)
    expect(isHttpUrl('')).toBe(false)
  })
})
