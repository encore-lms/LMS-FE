import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  AiTabSkeleton,
  GrowthTabSkeleton,
  ProblemTabSkeleton,
  ProjectsTabSkeleton,
  ResumeTabSkeleton,
  TechTabSkeleton,
} from './TabSkeletons'

// 기술·검증과 문제해결은 같은 훅을 쓴다 — 로딩 상태로 세워 두고 실제 탭을 그려 본다.
vi.mock('../useCertificateDetailTabs', () => ({
  useCertificateDetailTabs: () => ({
    data: undefined,
    isPending: true,
    isError: false,
    refetch: vi.fn(),
  }),
}))

/**
 * 탭마다 자기 데이터를 따로 가져오므로 새로고침 뒤 첫 진입에서 한 번씩 로딩을 거친다.
 * 골격을 안 주면 DataBoundary 가 "불러오는 중…" 한 줄(높이 96px)로 줄었다가 본문 높이로
 * 튀어 화면이 깜빡인다. 골격이 실제로 걸려 있는지 고정한다.
 */
describe('증명서 탭 로딩 골격', () => {
  const RENDERS = [
    ['기술·검증', TechTabSkeleton],
    ['문제해결', ProblemTabSkeleton],
    ['평가·추천', GrowthTabSkeleton],
    ['이력서', ResumeTabSkeleton],
    ['AI 분석', AiTabSkeleton],
    ['프로젝트', ProjectsTabSkeleton],
  ] as const

  it.each(RENDERS)('%s 골격은 스크린리더에 로딩을 알린다', (_label, Comp) => {
    render(<Comp />)
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중…')
  })

  it.each(RENDERS)('%s 골격은 텍스트 한 줄이 아니라 여러 칸을 그린다', (_l, Comp) => {
    const { container } = render(<Comp />)
    // 실제 본문 높이를 흉내 내야 탭 전환에서 높이가 튀지 않는다.
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(5)
  })

  it('로딩 중인 기술·검증 탭은 골격을 보여준다', async () => {
    const { TechTab } = await import('./TechTab')
    render(<TechTab studentId="s1" />)
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중…')
    expect(screen.queryByText('불러오는 중…', { selector: 'div' })).toBeNull()
  })

  it('로딩 중인 문제해결 탭은 골격을 보여준다', async () => {
    const { ProblemTab } = await import('./ProblemTab')
    render(<ProblemTab studentId="s1" />)
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중…')
  })
})
