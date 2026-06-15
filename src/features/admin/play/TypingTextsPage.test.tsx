import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import TypingTextsPage from './TypingTextsPage'
import { usePlayTypingTexts } from './api'
import type { PlayOverview } from './types'

vi.mock('./api')

// PLAY 타자 관리 — 배너·필터·제시문 목록·폼 기준·일괄 업로드 검증 렌더 + 상태 필터 + 액션 토스트.

const NOTE = '내용 미리보기 80자 기준, 수강생 입력 대상 원문'

const overview: PlayOverview = {
  summary: { active: 18, inactive: 4, error: 2, disabledCourses: 2 },
  passages: [
    {
      id: 'p1',
      title: '리팩터링 원칙',
      previewNote: NOTE,
      language: 'Python',
      level: '보통',
      order: 10,
      status: 'active',
    },
    {
      id: 'p4',
      title: 'SQL 윈도우 함수',
      previewNote: NOTE,
      language: '영문',
      level: '보통',
      order: 40,
      status: 'error',
    },
  ],
  uploadErrorRows: 3,
  uploadValidation: [
    {
      id: 'u2',
      rowNo: 2,
      title: 'HTTP 코드',
      titleError: false,
      content: '정상',
      contentError: false,
      language: '영문',
      level: 'easy',
      result: '저장 가능',
      ok: true,
    },
    {
      id: 'u5',
      rowNo: 5,
      title: '-',
      titleError: true,
      content: '본문 있음',
      contentError: false,
      language: 'Python',
      level: 'medium',
      result: 'title 필수',
      ok: false,
    },
  ],
}

function renderPage() {
  vi.mocked(usePlayTypingTexts).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof usePlayTypingTexts>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <TypingTextsPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('TypingTextsPage (PLAY 타자 관리)', () => {
  it('노출 조건 배너·제시문 목록·폼 기준·업로드 검증을 렌더한다', () => {
    renderPage()
    expect(
      screen.getByText('노출 조건: CourseFeatureConfig.playEnabled = true'),
    ).toBeInTheDocument()
    expect(screen.getByText('비활성 과정 2개')).toBeInTheDocument()
    expect(screen.getByText('리팩터링 원칙')).toBeInTheDocument()
    expect(screen.getByText('활성 18 · 비활성 4 · 오류 2')).toBeInTheDocument()
    // 폼 기준 패널 + 업로드 검증 결과
    expect(screen.getByText('제시문 폼 모달 기준')).toBeInTheDocument()
    expect(screen.getByText('title 필수')).toBeInTheDocument()
    expect(screen.getByText('오류 3행')).toBeInTheDocument()
  })

  it('활성 상태 필터 — 오류만 보면 활성 제시문이 사라진다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('활성 상태 필터'), 'error')
    expect(screen.getByText('SQL 윈도우 함수')).toBeInTheDocument()
    expect(screen.queryByText('리팩터링 원칙')).toBeNull()
  })

  it('제시문 추가 버튼 — 준비 중 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '제시문 추가' }))
    expect(
      await screen.findByText('제시문 추가는 준비 중입니다.'),
    ).toBeInTheDocument()
  })
})
