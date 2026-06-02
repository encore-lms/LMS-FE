import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { RequireRole } from './RequireRole'
import { useAuthStore } from '@/shared/store'
import type { Role } from '@/shared/types'

function setRole(role: Role) {
  useAuthStore
    .getState()
    .setSession('tok', { id: '1', email: 'a@b.com', name: '테스트', role })
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireRole allow={['MANAGER', 'ADMIN']} />}>
          <Route path="admin" element={<div>운영 콘솔</div>} />
        </Route>
        <Route path="student" element={<div>수강생 홈</div>} />
        <Route path="login" element={<div>로그인</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireRole', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('허용 역할이면 자식을 렌더한다', () => {
    setRole('MANAGER')
    renderAt('/admin')
    expect(screen.getByText('운영 콘솔')).toBeInTheDocument()
  })

  it('허용되지 않은 역할이면 자기 역할 홈으로 보낸다', () => {
    setRole('STUDENT')
    renderAt('/admin')
    expect(screen.getByText('수강생 홈')).toBeInTheDocument()
  })

  it('미인증이면 로그인으로 보낸다', () => {
    renderAt('/admin')
    expect(screen.getByText('로그인')).toBeInTheDocument()
  })
})
