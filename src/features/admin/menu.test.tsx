import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { adminMenu } from './menu'

// 운영 사이드바 — 대분류(드롭다운) + active highlight 정합 검증.
// menu.ts의 to/match가 Sidebar 매칭 로직과 맞는지, 그룹이 활성 자식 기준으로
// 자동 펼침/접힘 하는지.

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar label="운영" items={adminMenu} />
    </MemoryRouter>,
  )
}

// 그룹이 접히면 자식 링크가 DOM에 없을 수 있으므로 queryByRole(없으면 null)로 안전 조회.
const isActive = (name: string) =>
  screen.queryByRole('link', { name })?.getAttribute('aria-current') === 'page'

const group = (name: string) => screen.getByRole('button', { name })
const isExpanded = (name: string) =>
  group(name).getAttribute('aria-expanded') === 'true'

describe('adminMenu 사이드바 active highlight', () => {
  // 인증 검토는 역량 증명서 상세로 흡수했다 — 사이드바에 별도 항목을 두지 않는다.
  it('인증 검토 항목이 없다', () => {
    renderAt('/admin/reputation')
    expect(screen.queryByRole('link', { name: /인증 검토/ })).toBeNull()
  })

  // 역량 증명서·평판 관리는 '들여다보고 판단하는 일'이라 한 그룹으로 묶었다(2026-08-06).
  it('평판 관리는 검토·심사 그룹 안에서 활성된다', () => {
    renderAt('/admin/reputation')
    expect(isExpanded('검토·심사(매니저)')).toBe(true)
    expect(isActive('평판 관리')).toBe(true)
  })

  it('역량 증명서도 같은 그룹에 있다', () => {
    renderAt('/admin/certificates')
    expect(isExpanded('검토·심사(매니저)')).toBe(true)
    expect(screen.queryByRole('link', { name: /증명서/ })).not.toBeNull()
    // 학습·보상에는 더 이상 없다.
    expect(isExpanded('학습·보상(매니저)')).toBe(false)
  })

  // 설정 하위 화면 — 계정 관리가 설정 랜딩이 되며 하위 탭은 prefix 매칭으로 '설정' 활성 유지.
  it('설정 하위(hrd-api-key)에서 설정이 활성', () => {
    renderAt('/admin/settings/hrd-api-key')
    expect(isActive('설정(매니저)')).toBe(true)
  })

  it('설정 하위(hrd-api-key)에서 설정이 활성', () => {
    renderAt('/admin/settings/hrd-api-key')
    expect(isActive('설정(매니저)')).toBe(true)
  })

  it('설정 하위(courses/new)에서 설정이 활성', () => {
    renderAt('/admin/settings/courses/new')
    expect(isActive('설정(매니저)')).toBe(true)
  })

  it('설정 랜딩(/admin/settings = 계정 관리)에서 설정이 활성', () => {
    renderAt('/admin/settings')
    expect(isActive('설정(매니저)')).toBe(true)
  })
})

describe('adminMenu 사이드바 대분류 드롭다운', () => {
  it('활성 자식이 있는 그룹은 자동 펼침, 없는 그룹은 접힘', () => {
    renderAt('/admin/mileage')
    // 마일리지 = 학습·보상 그룹 → 자동 펼침 + 자식 노출
    expect(isExpanded('학습·보상(매니저)')).toBe(true)
    expect(screen.queryByRole('link', { name: 'PLAY 관리' })).not.toBeNull()
    expect(isExpanded('검토·심사(매니저)')).toBe(false)
  })

  it('접힌 그룹 헤더를 클릭하면 자식 링크가 펼쳐진다', () => {
    renderAt('/admin') // 어떤 그룹도 활성 아님 → 전부 접힘
    expect(screen.queryByRole('link', { name: '마일리지' })).toBeNull()
    fireEvent.click(group('학습·보상(매니저)'))
    expect(isExpanded('학습·보상(매니저)')).toBe(true)
    expect(screen.queryByRole('link', { name: '마일리지' })).not.toBeNull()
    // PLAY 관리 — 실기능 완결로 준비 중 해제(일반 링크)
    expect(screen.getByRole('link', { name: 'PLAY 관리' })).toHaveAttribute(
      'href',
      '/admin/play/typing-texts',
    )
  })

  it('대시보드·설정은 그룹이 아니라 항상 보이는 leaf 항목', () => {
    renderAt('/admin')
    expect(screen.queryByRole('link', { name: '대시보드' })).not.toBeNull()
    expect(screen.queryByRole('link', { name: '설정(매니저)' })).not.toBeNull()
  })
})
