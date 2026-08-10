import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GroupReportPane } from './GroupReportPane'
import { useDiagnosisReports } from './api'
import { buildDiagnosisReports, TOTAL_WEEKS } from './reportData'

vi.mock('./api')

const reports = buildDiagnosisReports()

function renderPane(initialEntry = '/admin/education/cohort-34?tab=diagnosis') {
  vi.mocked(useDiagnosisReports).mockReturnValue({
    data: reports,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useDiagnosisReports>)

  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <GroupReportPane />
    </MemoryRouter>,
  )
}

describe('GroupReportPane (매니저 그룹 리포트)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('기본으로 최신 주차 그룹 리포트를 연다', () => {
    renderPane()
    expect(
      screen.getByText(`총 ${TOTAL_WEEKS}개 주차 리포트 · 24주차 열람 중`),
    ).toBeInTheDocument()
    expect(screen.getByText('학생별 현황')).toBeInTheDocument()
  })

  it('20주차를 고르면 PoV 산출 원문이 보인다', async () => {
    renderPane()
    await userEvent.click(screen.getByRole('button', { name: /^20주차/ }))
    expect(
      screen.getByText(/20주차 · 분석 기준일: 2026-07-08/),
    ).toBeInTheDocument()
    expect(screen.getByText(/그냥 답을 알려주시면 안 돼요/)).toBeInTheDocument()
    // 학생 3명 상세 카드의 피드백 초안 박스가 모두 렌더된다.
    expect(
      screen.getAllByText(/피드백 초안 \(강사 검토·승인 후 전달/),
    ).toHaveLength(3)
  })

  it('?week= 쿼리로 특정 주차를 딥링크할 수 있다', () => {
    renderPane('/admin/education/cohort-34?tab=diagnosis&week=1')
    expect(
      screen.getByText(/1주차 · 분석 기준일: 2026-02-25/),
    ).toBeInTheDocument()
  })
})
