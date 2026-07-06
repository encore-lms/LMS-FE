import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { apiClient } from './client'
import { useAuthStore } from '@/shared/store'
import type { User } from '@/shared/types'

// silent refresh 인터셉터 — 401 시 /auth/refresh 재발급 후 원 요청 재시도,
// 재발급 실패·로그인 401·재시도 후 401만 세션을 초기화한다.

const user: User = {
  id: 'u1',
  email: 'a@b.com',
  name: '홍길동',
  role: 'ADMIN',
}

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  useAuthStore.setState({ token: 'expired-token', user })
})

describe('apiClient silent refresh', () => {
  it('401 → refresh 성공 → 원 요청을 새 토큰으로 재시도하고 세션을 유지한다', async () => {
    let refreshCalls = 0
    server.use(
      http.get('*/api/admin/ping', ({ request }) => {
        const auth = request.headers.get('authorization')
        if (auth === 'Bearer fresh-token') {
          return HttpResponse.json({ data: { ok: true } })
        }
        return new HttpResponse(null, { status: 401 })
      }),
      http.post('*/api/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json({ data: { token: 'fresh-token' } })
      }),
    )

    const result = await apiClient.get<{ ok: boolean }>('/admin/ping')
    expect(result.data.ok).toBe(true)
    expect(refreshCalls).toBe(1)
    expect(useAuthStore.getState().token).toBe('fresh-token')
    expect(useAuthStore.getState().user).not.toBeNull()
  })

  it('401 → refresh 실패 → 세션을 초기화한다', async () => {
    server.use(
      http.get(
        '*/api/admin/ping',
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post(
        '*/api/auth/refresh',
        () => new HttpResponse(null, { status: 401 }),
      ),
    )

    await expect(apiClient.get('/admin/ping')).rejects.toThrow()
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('로그인 401(자격 증명 오류)은 refresh를 시도하지 않는다', async () => {
    let refreshCalls = 0
    server.use(
      http.post(
        '*/api/auth/login',
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post('*/api/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json({ data: { token: 'fresh-token' } })
      }),
    )

    await expect(
      apiClient.post('/auth/login', { userId: 'a@b.com', password: 'x' }),
    ).rejects.toThrow()
    expect(refreshCalls).toBe(0)
  })

  it('동시 다발 401은 refresh 1회로 합류한다(single-flight)', async () => {
    let refreshCalls = 0
    server.use(
      http.get('*/api/admin/ping', ({ request }) => {
        const auth = request.headers.get('authorization')
        if (auth === 'Bearer fresh-token') {
          return HttpResponse.json({ data: { ok: true } })
        }
        return new HttpResponse(null, { status: 401 })
      }),
      http.post('*/api/auth/refresh', async () => {
        refreshCalls += 1
        // 합류 검증을 위해 재발급 응답을 살짝 지연시킨다.
        await new Promise((resolve) => setTimeout(resolve, 30))
        return HttpResponse.json({ data: { token: 'fresh-token' } })
      }),
    )

    const [a, b, c] = await Promise.all([
      apiClient.get<{ ok: boolean }>('/admin/ping'),
      apiClient.get<{ ok: boolean }>('/admin/ping'),
      apiClient.get<{ ok: boolean }>('/admin/ping'),
    ])
    expect(a.data.ok && b.data.ok && c.data.ok).toBe(true)
    expect(refreshCalls).toBe(1)
  })
})
