import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { useAdminProjectWorkspace, useCohortProjects } from './api'

/**
 * 프로젝트 탭이 실제로 부르는 URL 계약.
 *
 * <p>다른 테스트들은 `vi.mock('./api')` 로 훅 자체를 갈아 끼워, 경로가 틀리거나 서버에서
 * 사라져도 초록으로 남았다. BE 가 admin 미러를 걷어내고 /instructor 정본으로 수렴했을 때
 * (2026-08-12~13) 화면은 404 였는데 CI 는 아무 말도 하지 않았다.</p>
 *
 * <p>여기서는 훅을 그대로 쓰고 MSW 로 서버 쪽을 세운다 — 핸들러에 없는 주소를 부르면
 * `onUnhandledRequest: 'error'` 가 실패로 만든다.</p>
 */
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('운영 프로젝트 탭 API 계약', () => {
  it('기수 목록은 /instructor/cohorts/{cohortId}/projects 를 부른다', async () => {
    server.use(
      http.get('*/api/instructor/cohorts/co1/projects', () =>
        HttpResponse.json({ data: [{ id: 'p1', title: '팀 프로젝트 A' }] }),
      ),
    )

    const { result } = renderHook(() => useCohortProjects('c1', 'co1'), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0].title).toBe('팀 프로젝트 A')
  })

  it('워크스페이스 상세는 /instructor/projects/{id}/workspace 를 부른다', async () => {
    server.use(
      http.get('*/api/instructor/projects/p1/workspace', () =>
        HttpResponse.json({ data: { id: 'p1', title: '팀 프로젝트 A' } }),
      ),
    )

    const { result } = renderHook(() => useAdminProjectWorkspace('p1'), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe('p1')
  })
})
