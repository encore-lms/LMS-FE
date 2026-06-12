import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import VerifyPage from './VerifyPage'
import { externalPublicRoutes } from '../routes'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/verify/vfy_kp9q4r2nx0']}>
      <VerifyPage />
    </MemoryRouter>,
  )
}

describe('VerifyPage (진입 로딩 셸)', () => {
  it('전용 topbar와 로딩 상태 마크업을 렌더한다', () => {
    renderPage()
    // public 전용 topbar — AppShell 미사용이라 직접 렌더.
    expect(screen.getByText('PLAYDATA — 외부 검증')).toBeInTheDocument()
    expect(screen.getByText('HTTPS · 검증 전용 페이지')).toBeInTheDocument()
    // 로딩 상태(분기 전) 고정 문구.
    expect(screen.getByText('VERIFYING TOKEN · 자동 분기')).toBeInTheDocument()
    expect(
      screen.getByText('검증 정보를 확인하고 있습니다'),
    ).toBeInTheDocument()
    expect(screen.getByText('publicToken 유효성')).toBeInTheDocument()
    expect(
      screen.getByText('공개 / 비공개 / 미인증 / 잘못된 링크'),
    ).toBeInTheDocument()
    expect(screen.getByText('분기 완료 전 표시 없음')).toBeInTheDocument()
    expect(screen.getByText('외부 검증 페이지 정책')).toBeInTheDocument()
  })

  it('분기 전에는 실데이터(수강생 이름·점수)를 렌더하지 않는다', () => {
    renderPage()
    // 명세: 분기 완료 전 어떤 상세 정보도 렌더링하지 않음 — mock 대표값 비노출 확인.
    expect(screen.queryByText('이서연')).not.toBeInTheDocument()
    expect(screen.queryByText(/sha256:/)).not.toBeInTheDocument()
  })
})

describe('externalPublicRoutes (public 마운트 계약)', () => {
  it('AuthGuard 밖 최상위 마운트용 /verify/:publicToken 라우트를 route-level lazy로 내보낸다', () => {
    expect(externalPublicRoutes).toHaveLength(1)
    const route = externalPublicRoutes[0]
    expect(route.path).toBe('/verify/:publicToken')
    // AppShell 밖(상위 Suspense 없음)이라 element+lazy() 대신 route-level lazy 필수.
    expect(route.lazy).toBeTypeOf('function')
    expect(route.element).toBeUndefined()
  })
})
