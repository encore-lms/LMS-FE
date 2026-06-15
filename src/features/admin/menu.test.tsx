import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { adminMenu } from './menu'

// 운영 사이드바 active highlight 정합 — menu.ts의 to/match가 Sidebar 매칭 로직과 맞는지 검증.
// 특히 인증 검토(match: ['/admin/certificates'])가 스냅샷·감사 로그 하위 경로까지 활성으로 잡는지.

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar label="운영" items={adminMenu} />
    </MemoryRouter>,
  )
}

const active = (name: string) =>
  screen.getByRole('link', { name }).getAttribute('aria-current') === 'page'

describe('adminMenu 사이드바 active highlight', () => {
  it('인증 검토 큐에서 인증 검토가 활성', () => {
    renderAt('/admin/certificates/reviews')
    expect(active('인증 검토')).toBe(true)
  })

  it('감사 로그(:id/audit)에서 인증 검토가 활성', () => {
    renderAt('/admin/certificates/cert-1842/audit')
    expect(active('인증 검토')).toBe(true)
  })

  it('스냅샷 상세(:id/snapshot)에서 인증 검토가 활성', () => {
    renderAt('/admin/certificates/cert-1842/snapshot')
    expect(active('인증 검토')).toBe(true)
  })

  it('인입 격리 큐 경로에서는 인증 검토가 비활성', () => {
    renderAt('/admin/ingestion/quarantine')
    expect(active('인증 검토')).toBe(false)
    expect(active('인입 격리 큐')).toBe(true)
  })

  // 설정 하위 화면 — 운영 계정·권한이 별도 메뉴라 '설정'이 end=true로 잠기던 갭 보강(match).
  it('설정 하위(hrd-api-key)에서 설정이 활성·운영 계정·권한은 비활성', () => {
    renderAt('/admin/settings/hrd-api-key')
    expect(active('설정')).toBe(true)
    expect(active('운영 계정·권한')).toBe(false)
  })

  it('설정 하위(course-config)에서 설정이 활성', () => {
    renderAt('/admin/settings/course-config')
    expect(active('설정')).toBe(true)
  })

  it('설정 하위(courses/new)에서 설정이 활성', () => {
    renderAt('/admin/settings/courses/new')
    expect(active('설정')).toBe(true)
  })

  it('운영 계정·권한 경로에서는 운영 계정·권한만 활성(설정 비활성 — 이중 하이라이트 방지)', () => {
    renderAt('/admin/settings/accounts')
    expect(active('운영 계정·권한')).toBe(true)
    expect(active('설정')).toBe(false)
  })

  it('설정 허브(/admin/settings)에서 설정이 활성', () => {
    renderAt('/admin/settings')
    expect(active('설정')).toBe(true)
  })
})
