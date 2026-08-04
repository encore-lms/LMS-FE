import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { RouteErrorBoundary } from './RouteErrorBoundary'

// 콘솔에 스택을 남기는 건 의도된 동작 — 테스트 출력만 조용히 한다.
vi.spyOn(console, 'error').mockImplementation(() => {})

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <div>홈</div>,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: '/boom',
        element: <Boom />,
        errorElement: <RouteErrorBoundary />,
      },
    ],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

function Boom(): never {
  throw new Error('렌더 중 터짐')
}

describe('RouteErrorBoundary', () => {
  it('없는 주소는 오류가 아니라 못 찾았다고 안내한다', () => {
    // 옮겨 가거나 걷어낸 화면의 옛 주소를 북마크로 들고 오는 경우다.
    // '다시 시도'라고 하면 새로고침하면 될 것처럼 읽힌다.
    renderAt('/mentor/mentoring-logs')
    expect(screen.getByText('찾을 수 없는 주소예요')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '다시 시도' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '홈으로' })).toBeInTheDocument()
  })

  it('렌더 중 터진 경우는 다시 시도를 권한다', () => {
    renderAt('/boom')
    expect(screen.getByText('화면을 표시하지 못했어요')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
