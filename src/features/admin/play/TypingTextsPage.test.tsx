import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import TypingTextsPage from './TypingTextsPage'
import { usePlayTypingTexts, useUpsertPassage } from './api'
import type { PlayOverview } from './types'

vi.mock('./api')
// 샘플 다운로드 helper는 실제 anchor click(jsdom 미지원) → 모킹해 토스트만 검증.
vi.mock('./sampleCsv')

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
      content: '중복을 제거하고 의도를 드러내는 이름을 붙인다.',
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
  vi.mocked(useUpsertPassage).mockReturnValue({
    mutate: (_vars: unknown, opts?: { onSuccess?: () => void }) =>
      opts?.onSuccess?.(),
  } as unknown as ReturnType<typeof useUpsertPassage>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <TypingTextsPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('TypingTextsPage (PLAY 타자 관리)', () => {
  it('제시문 목록·폼 기준·업로드 검증을 렌더하고, 스펙 배너는 노출하지 않는다', () => {
    renderPage()
    // 스펙 마커성 상주 배너 제거(2026-07-28) — 노출 조건·활성 변경 확인 문구가 없어야 한다.
    expect(
      screen.queryByText(/CourseFeatureConfig\.playEnabled/),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('활성 변경 확인 필요')).not.toBeInTheDocument()
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
    await user.click(screen.getByLabelText('활성 상태 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: '오류',
      }),
    )
    expect(screen.getByText('SQL 윈도우 함수')).toBeInTheDocument()
    expect(screen.queryByText('리팩터링 원칙')).toBeNull()
  })

  it('제시문 추가 — 폼 모달을 열고 제출 시 성공 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '제시문 추가' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('제시문 추가')).toBeInTheDocument()
    // 검증: 빈 제출은 에러
    await user.click(within(dialog).getByRole('button', { name: '추가' }))
    expect(screen.getByText('제목을 입력해주세요')).toBeInTheDocument()
    // 입력 후 제출
    await user.type(screen.getByPlaceholderText('80자 이내'), '새 제시문')
    await user.type(
      screen.getByPlaceholderText('타자 입력 대상 원문'),
      '본문 내용',
    )
    await user.click(within(dialog).getByRole('button', { name: '추가' }))
    expect(
      await screen.findByText('제시문을 추가했습니다.'),
    ).toBeInTheDocument()
  })

  it('수정 — 폼 모달이 수정 모드로 열린다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('제시문 수정')).toBeInTheDocument()
  })

  it('수정 — 기존 제시문 본문이 폼에 프리필된다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByDisplayValue(
        '중복을 제거하고 의도를 드러내는 이름을 붙인다.',
      ),
    ).toBeInTheDocument()
    expect(within(dialog).getByDisplayValue('리팩터링 원칙')).toBeInTheDocument()
  })

  it('샘플 다운로드 — 성공 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '샘플 다운로드' }))
    expect(
      await screen.findByText('샘플 CSV 양식을 내려받았습니다.'),
    ).toBeInTheDocument()
  })
})
