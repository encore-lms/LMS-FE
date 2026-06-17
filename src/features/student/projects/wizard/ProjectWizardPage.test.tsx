import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    <MemoryRouter initialEntries={['/student/projects/new']}>
      <Routes>
        <Route path="/student/projects/new" element={<ProjectWizardPage />} />
      </Routes>
    </MemoryRouter>,
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
})
