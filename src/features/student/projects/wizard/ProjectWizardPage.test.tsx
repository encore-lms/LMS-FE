import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { useProjectWizard } from '../../api/projects'
import type { ProjectWizardData } from '../types'
import ProjectWizardPage from './ProjectWizardPage'

vi.mock('../../api/projects')

const wizardData: ProjectWizardData = {
  cohortLabel: '백엔드 부트캠프 3기',
  pmName: '김수강',
  pmMeta: '백엔드 · 3팀',
  candidates: [
    { id: 'c2', name: '박준석', meta: '백엔드 · 3팀', avatarTone: 'info' },
    { id: 'c3', name: '이민지', meta: '백엔드 · 3팀', avatarTone: 'success' },
    { id: 'c4', name: '최하늘', meta: '백엔드 · 3팀', avatarTone: 'warning' },
  ],
}

function renderPage() {
  vi.mocked(useProjectWizard).mockReturnValue({
    data: wizardData,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useProjectWizard>)

  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/student/projects/new']}>
        <Routes>
          <Route path="/student/projects/new" element={<ProjectWizardPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ProjectWizardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1단계 필수 입력이 비면 다음 버튼을 비활성화한다', async () => {
    const user = userEvent.setup()
    renderPage()

    const nameInput = screen.getByDisplayValue(
      'Encore Mart — 마이크로서비스 백엔드',
    )
    await user.clear(nameInput)

    expect(screen.getByText('필수 3 / 4 입력 완료')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /다음.*팀 설정/ })).toBeDisabled()
  })

  it('1단계 입력값을 다음/이전 이동 후에도 유지한다', async () => {
    const user = userEvent.setup()
    renderPage()

    const nameInput = screen.getByDisplayValue(
      'Encore Mart — 마이크로서비스 백엔드',
    )
    await user.clear(nameInput)
    await user.type(nameInput, 'Redis Stream 정산 플랫폼')

    await user.click(screen.getByRole('button', { name: /다음.*팀 설정/ }))
    expect(screen.getByText('팀원 초대')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /이전.*기본 정보/ }))
    expect(
      screen.getByDisplayValue('Redis Stream 정산 플랫폼'),
    ).toBeInTheDocument()
  })

  it('2단계 팀원 검색과 초대 취소를 팀 구성에 반영한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /다음.*팀 설정/ }))

    await user.type(
      screen.getByPlaceholderText('이름이나 영문 닉네임으로 검색'),
      '최하늘',
    )
    expect(screen.getByText('검색 결과 (1명)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '박준석 초대 취소' }))

    expect(screen.getByText('초대 2 / 7명')).toBeInTheDocument()
    expect(
      screen.getByText('팀 3명 구성 완료 (PM 1 + 팀원 2)'),
    ).toBeInTheDocument()
  })

  it('3단계 직접 추가 버튼은 준비 중 토스트를 띄운다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /다음.*팀 설정/ }))
    await user.click(screen.getByRole('button', { name: /다음.*상세 설정/ }))
    await user.click(screen.getAllByRole('button', { name: '+ 직접 추가' })[0])

    expect(
      await screen.findByText('직접 추가는 준비 중입니다'),
    ).toBeInTheDocument()
  })
})
