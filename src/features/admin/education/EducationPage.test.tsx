import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import EducationPage from './EducationPage'
import { useEducationOverview } from './api'
import type { EducationOverview } from './types'

vi.mock('./api')

// 과정·기수·교과목 통합 관리 — KPI 4종 + 모듈 표 + 안내 콜아웃 렌더 + 액션 토스트.

const overview: EducationOverview = {
  summary: {
    courses: 18,
    coursesHrdLinked: 16,
    cohorts: 32,
    cohortsActive: 21,
    modules: 64,
    weeks: 312,
  },
  rows: [
    {
      id: 'mod-1',
      cohortLabel: 'AI 캠프 22기',
      moduleName: 'Java/Spring 기본',
      unit: '1단위',
      owner: '김강사',
      linkedFeatures: '퀴즈 4 · 기록실 6주',
    },
    {
      id: 'mod-3',
      cohortLabel: 'AI 캠프 22기',
      moduleName: '취업 포트폴리오',
      unit: '3단위',
      owner: '이정훈',
      linkedFeatures: '이력서 · 증명서',
    },
  ],
}

function renderPage() {
  vi.mocked(useEducationOverview).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useEducationOverview>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <EducationPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('EducationPage (과정·기수·교과목 통합 관리)', () => {
  it('인트로 + KPI 4종 + 안내 콜아웃을 렌더한다', () => {
    renderPage()
    expect(screen.getByText('과정·기수·교과목 통합 관리')).toBeInTheDocument()
    // KPI 값/보조 설명
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('HRD 연동 16')).toBeInTheDocument()
    expect(screen.getByText('312')).toBeInTheDocument()
    expect(screen.getByText('기록실/퀴즈 연결')).toBeInTheDocument()
    expect(screen.getByText('교과목 설계 반영 기준')).toBeInTheDocument()
  })

  it('모듈 표 — 교과목/담당/연결 기능 행과 총 건수를 렌더한다', () => {
    renderPage()
    expect(screen.getByText('Java/Spring 기본')).toBeInTheDocument()
    expect(screen.getByText('퀴즈 4 · 기록실 6주')).toBeInTheDocument()
    expect(screen.getByText('취업 포트폴리오')).toBeInTheDocument()
    expect(screen.getByText('이력서 · 증명서')).toBeInTheDocument()
    expect(screen.getByText('총 2건')).toBeInTheDocument()
  })

  it('교과목 추가 버튼 — 준비 중 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '교과목 추가' }))
    expect(
      await screen.findByText('교과목 추가 화면은 준비 중입니다.'),
    ).toBeInTheDocument()
  })

  it('행 수정 버튼 — 교과목명 포함 준비 중 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    const editButtons = screen.getAllByRole('button', { name: '수정' })
    await user.click(editButtons[0])
    expect(
      await screen.findByText('Java/Spring 기본 수정 화면은 준비 중입니다.'),
    ).toBeInTheDocument()
  })
})
