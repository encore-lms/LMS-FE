import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DiagnosisReportPage from './DiagnosisReportPage'
import { useMyDiagnosisReports } from './api'
import { buildMyDiagnosisReports, TOTAL_WEEKS } from './reportData'

// 교육과정 허브 탭바 — 페이지 본문 테스트에 집중하도록 껍데기만 둔다.
vi.mock('../CourseTabs', () => ({ CourseTabs: () => null }))
// 허브 공통 헤더 훅(과정명/기간) — useQuery 의존이라 껍데기로 대체한다.
vi.mock('../useCourseHubHeader', () => ({ useCourseHubHeader: () => {} }))
vi.mock('./api')

const reports = buildMyDiagnosisReports()

function renderPage(initialEntry = '/student/course/diagnosis') {
  vi.mocked(useMyDiagnosisReports).mockReturnValue({
    data: reports,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useMyDiagnosisReports>)

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

describe('DiagnosisReportPage (개인 리포트)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('기본으로 최신 주차 내 리포트를 연다', () => {
    renderPage()
    expect(
      screen.getByText(`총 ${TOTAL_WEEKS}개 주차 리포트 · 24주차 열람 중`),
    ).toBeInTheDocument()
    expect(screen.getByText('나의 주간 수준 진단 리포트')).toBeInTheDocument()
    expect(
      screen.getByText(/24주차 · 분석 기준일: 2026-08-05/),
    ).toBeInTheDocument()
  })

  it('수강생 눈높이 섹션 구성을 갖춘다(강사 권장 조치 없음)', () => {
    renderPage()
    expect(screen.getByText('이번 주 나의 수준')).toBeInTheDocument()
    expect(screen.getByText('지난주 대비 변화')).toBeInTheDocument()
    expect(screen.getByText('잘하고 있는 점')).toBeInTheDocument()
    expect(screen.getByText('보완하면 좋은 점')).toBeInTheDocument()
    expect(screen.getByText('이번 주 학습 제안')).toBeInTheDocument()
    expect(screen.getByText('강사 피드백')).toBeInTheDocument()
    // 그룹(매니저) 리포트 전용 섹션은 노출되지 않는다.
    expect(screen.queryByText('강사 권장 조치')).not.toBeInTheDocument()
    expect(screen.queryByText('학생별 현황')).not.toBeInTheDocument()
  })

  it('20주차를 고르면 강사 검토본 피드백 원문이 보인다', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /^20주차/ }))
    expect(
      screen.getByText(/20주차 · 분석 기준일: 2026-07-08/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/민준님, 지난번 IndentationError를 어제보다 더 빠르게/),
    ).toBeInTheDocument()
  })

  it('?week= 쿼리로 특정 주차를 딥링크할 수 있다', () => {
    renderPage('/student/course/diagnosis?week=1')
    expect(
      screen.getByText(/1주차 · 분석 기준일: 2026-02-25/),
    ).toBeInTheDocument()
    expect(screen.getByText(/첫 진단 주차예요/)).toBeInTheDocument()
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
