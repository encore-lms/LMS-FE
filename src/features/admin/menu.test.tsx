import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { adminMenu } from './menu'

// 운영 사이드바 — 4개 대분류(드롭다운) + active highlight 정합 검증.
// menu.ts의 to/match가 Sidebar 매칭 로직과 맞는지(특히 인증 검토 하위 경로),
// 그룹이 활성 자식 기준으로 자동 펼침/접힘 하는지.

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
  // 인증 검토·증명서 템플릿은 BE 미구현(404)으로 comingSoon(비활성 버튼) 처리 —
  // 하위 경로(reviews/:id·audit·snapshot) 활성 매칭 테스트는 오픈 시 복원.
  it('인증 검토는 (준비 중) 비활성 버튼으로 렌더된다', () => {
    renderAt('/admin/reputation') // 검토·심사 그룹 펼침(평판 관리 활성)
    expect(
      screen.getByRole('button', { name: /인증 검토.*\(준비 중\)/ }),
    ).toBeDisabled()
    expect(screen.queryByRole('link', { name: /인증 검토/ })).toBeNull()
  })

  it('인입 격리 큐 경로에서는 인증 검토가 비활성', () => {
    renderAt('/admin/ingestion/quarantine')
    expect(isActive('인증 검토')).toBe(false)
    // 데이터·연동 임시 숨김 — 사이드바 항목 부재. 재활성화 시 아래 복원.
    // expect(isActive('인입 격리 큐')).toBe(true)
  })

  // 설정 하위 화면 — 계정 관리가 설정 랜딩이 되며 하위 탭은 prefix 매칭으로 '설정' 활성 유지.
  it('설정 하위(hrd-api-key)에서 설정이 활성', () => {
    renderAt('/admin/settings/hrd-api-key')
    expect(isActive('설정')).toBe(true)
  })

  it('설정 하위(course-config)에서 설정이 활성', () => {
    renderAt('/admin/settings/course-config')
    expect(isActive('설정')).toBe(true)
  })

  it('설정 하위(courses/new)에서 설정이 활성', () => {
    renderAt('/admin/settings/courses/new')
    expect(isActive('설정')).toBe(true)
  })

  it('설정 랜딩(/admin/settings = 계정 관리)에서 설정이 활성', () => {
    renderAt('/admin/settings')
    expect(isActive('설정')).toBe(true)
  })
})

describe('adminMenu 사이드바 대분류 드롭다운', () => {
  it('활성 자식이 있는 그룹은 자동 펼침, 없는 그룹은 접힘', () => {
    renderAt('/admin/reputation')
    // 평판 관리 = 검토·심사 그룹 → 자동 펼침 + 자식 노출(인증 검토는 준비 중 버튼)
    expect(isExpanded('검토·심사')).toBe(true)
    expect(screen.queryByRole('link', { name: '평판 관리' })).not.toBeNull()
    // 데이터·연동 임시 숨김 — 그룹 부재. 재활성화 시 아래 복원.
    // expect(isExpanded('데이터·연동')).toBe(false)
    // expect(screen.queryByRole('link', { name: '인입 격리 큐' })).toBeNull()
  })

  it('접힌 그룹 헤더를 클릭하면 자식 링크가 펼쳐진다', () => {
    renderAt('/admin') // 어떤 그룹도 활성 아님 → 전부 접힘
    expect(screen.queryByRole('link', { name: 'PLAY 관리' })).toBeNull()
    fireEvent.click(group('학습·보상'))
    expect(isExpanded('학습·보상')).toBe(true)
    expect(screen.queryByRole('link', { name: 'PLAY 관리' })).not.toBeNull()
  })

  it('대시보드·설정은 그룹이 아니라 항상 보이는 leaf 항목', () => {
    renderAt('/admin')
    expect(screen.queryByRole('link', { name: '대시보드' })).not.toBeNull()
    expect(screen.queryByRole('link', { name: '설정' })).not.toBeNull()
  })
})
