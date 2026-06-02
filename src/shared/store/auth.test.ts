import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAuthStore, useAuth } from './auth'
import type { User } from '@/shared/types'

const user: User = {
  id: 'u1',
  email: 'a@b.com',
  name: '홍길동',
  role: 'STUDENT',
}

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('setSession이 토큰·유저를 저장한다', () => {
    useAuthStore.getState().setSession('tok', user)
    expect(useAuthStore.getState().token).toBe('tok')
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('clearSession이 세션을 비운다', () => {
    useAuthStore.getState().setSession('tok', user)
    useAuthStore.getState().clearSession()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('useAuth가 user에서 role·isAuthenticated를 파생한다', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.role).toBeNull()

    act(() => {
      useAuthStore.getState().setSession('tok', user)
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.role).toBe('STUDENT')
  })
})
