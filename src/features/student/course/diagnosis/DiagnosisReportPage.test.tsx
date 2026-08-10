import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DiagnosisReportPage from './DiagnosisReportPage'
import { useDiagnosisReports } from './api'
import { buildDiagnosisReports, TOTAL_WEEKS } from './reportData'

// 교육과정 허브 탭바 — 페이지 본문 테스트에 집중하도록 껍데기만 둔다.
vi.mock('../CourseTabs', () => ({ CourseTabs: () => null }))
// 허브 공통 헤더 훅(과정명/기간) — useQuery 의존이라 껍데기로 대체한다.
vi.mock('../useCourseHubHeader', () => ({ useCourseHubHeader: () => {} }))
vi.mock('./api')

const reports = buildDiagnosisReports()

function renderPage(initialEntry = '/student/course/diagnosis') {
  vi.mocked(useDiagnosisReports).mockReturnValue({
    data: reports,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useDiagnosisReports>)

  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/student/course/diagnosis"
          element={<DiagnosisReportPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DiagnosisReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('기본으로 최신 주차 리포트를 연다', () => {
    renderPage()
    expect(
      screen.getByText(`총 ${TOTAL_WEEKS}개 주차 리포트 · 24주차 열람 중`),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/24주차 · 분석 기준일: 2026-08-05/),
    ).toBeInTheDocument()
  })

  it('주차 목록에서 20주차를 고르면 해당 주 원문 리포트가 보인다', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /^20주차/ }))
    expect(
      screen.getByText(/20주차 · 분석 기준일: 2026-07-08/),
    ).toBeInTheDocument()
    // 20주차는 LLM PoV 산출 원문 — 김민준 진단 근거의 발화 인용이 그대로 실려야 한다.
    expect(screen.getByText(/그냥 답을 알려주시면 안 돼요/)).toBeInTheDocument()
    // 학생 3명 상세 카드의 피드백 초안 박스가 모두 렌더된다.
    expect(
      screen.getAllByText(/피드백 초안 \(강사 검토·승인 후 전달/),
    ).toHaveLength(3)
  })

  it('?week= 쿼리로 특정 주차를 딥링크할 수 있다', () => {
    renderPage('/student/course/diagnosis?week=1')
    expect(
      screen.getByText(/1주차 · 분석 기준일: 2026-02-25/),
    ).toBeInTheDocument()
  })

  it('이전 주/다음 주 버튼으로 인접 주차로 이동한다', async () => {
    renderPage('/student/course/diagnosis?week=20')
    await userEvent.click(screen.getByRole('button', { name: /이전 주/ }))
    expect(
      screen.getByText(/19주차 · 분석 기준일: 2026-07-01/),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /다음 주/ }))
    expect(
      screen.getByText(/20주차 · 분석 기준일: 2026-07-08/),
    ).toBeInTheDocument()
  })
})
