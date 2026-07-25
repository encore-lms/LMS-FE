import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { Sidebar } from './Sidebar'
import type { MenuNode } from './types'

// 사이드바 활성 상태 — 로그인 nextRoute(/admin/dashboard)에서도 대시보드 탭이 활성이어야 한다.
// 대시보드 to=/admin은 하위 경로가 있어 정확 일치만 잡히므로 match:['/admin/dashboard']로 묶는다.

const adminMenu: MenuNode[] = [
  { label: '대시보드', to: '/admin', match: ['/admin/dashboard'] },
  { label: '과정·기수', to: '/admin/education' },
]

function renderAt(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Sidebar label="운영" items={adminMenu} />
    </MemoryRouter>,
  )
}

describe('Sidebar 활성 상태', () => {
  it('로그인 랜딩(/admin/dashboard)에서 대시보드 탭이 활성이다', () => {
    renderAt('/admin/dashboard')
    const dash = screen.getByRole('link', { name: '대시보드' })
    expect(dash).toHaveAttribute('aria-current', 'page')
  })

  it('인덱스 경로(/admin)에서도 대시보드 탭이 활성이다', () => {
    renderAt('/admin')
    expect(screen.getByRole('link', { name: '대시보드' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('다른 메뉴(/admin/education)에서는 대시보드 탭이 활성이 아니다', () => {
    renderAt('/admin/education')
    expect(screen.getByRole('link', { name: '대시보드' })).not.toHaveAttribute(
      'aria-current',
    )
    expect(screen.getByRole('link', { name: '과정·기수' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})

describe('Sidebar 준비 중(comingSoon) 메뉴', () => {
  const menu: MenuNode[] = [
    { label: '대시보드', to: '/student' },
    { label: 'PLAY', to: '/student/play', comingSoon: true },
  ]

  it('comingSoon 항목은 링크가 아니라 버튼으로 렌더된다(이동 없음)', () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/student']}>
          <Sidebar label="수강생" items={menu} />
        </MemoryRouter>
      </ToastProvider>,
    )
    expect(screen.queryByRole('link', { name: 'PLAY' })).toBeNull()
    expect(screen.getByRole('button', { name: 'PLAY' })).toBeInTheDocument()
  })

  it('comingSoon 항목 클릭 시 준비중 토스트가 뜬다', () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/student']}>
          <Sidebar label="수강생" items={menu} />
        </MemoryRouter>
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))
    expect(screen.getByText('준비 중인 기능입니다.')).toBeInTheDocument()
  })
})
