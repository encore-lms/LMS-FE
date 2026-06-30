import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import LogTemplatesPage from './LogTemplatesPage'
import {
  useDuplicateLogTemplate,
  useLogTemplates,
  useSetTemplateStatus,
  useUpdateTemplateFields,
} from './api'
import type { AdminLogTemplatesData, AdminTemplateField } from './types'

vi.mock('./api')

// 일지 템플릿 페이지 — 비활성화/복원 플로우 + 목록·메타 렌더(§31).

const fields: AdminTemplateField[] = [
  {
    fieldId: 'tf_1',
    order: 1,
    name: '주요 아젠다',
    helpText: '이번 멘토링에서 다룬 핵심 안건',
    required: true,
    type: 'long_text',
  },
  {
    fieldId: 'tf_2',
    order: 2,
    name: '다음 회차 일정',
    helpText: 'YYYY-MM-DD HH:MM',
    required: false,
    type: 'short_text',
  },
]

const data: AdminLogTemplatesData = {
  summary: { total: 3, defaults: 1 },
  templates: [
    {
      templateId: 'tpl_default',
      name: 'AI 캠프 기본 v2.1',
      description: '핵심 항목 구성',
      isDefault: true,
      isActive: true,
      appliedTeamCount: 3,
      updatedAtLabel: '05-19',
      fields,
    },
    {
      templateId: 'tpl_da5',
      name: 'DA 5기 데이터 분석용',
      description: '분석 중심',
      isDefault: false,
      isActive: true,
      appliedTeamCount: 0,
      updatedAtLabel: '05-12',
      fields,
    },
    {
      templateId: 'tpl_legacy',
      name: '레거시 v1.0 (보관)',
      description: '보관용',
      isDefault: false,
      isActive: false,
      appliedTeamCount: 0,
      updatedAtLabel: '03-02',
      fields,
    },
  ],
}

const setStatusMutate = vi.fn()

function stubMutation() {
  return { mutate: vi.fn(), isPending: false }
}

function renderPage() {
  vi.mocked(useLogTemplates).mockReturnValue({
    data,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLogTemplates>)
  vi.mocked(useDuplicateLogTemplate).mockReturnValue(
    stubMutation() as unknown as ReturnType<typeof useDuplicateLogTemplate>,
  )
  vi.mocked(useUpdateTemplateFields).mockReturnValue(
    stubMutation() as unknown as ReturnType<typeof useUpdateTemplateFields>,
  )
  vi.mocked(useSetTemplateStatus).mockReturnValue({
    mutate: setStatusMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useSetTemplateStatus>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <LogTemplatesPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('LogTemplatesPage (§31)', () => {
  beforeEach(() => setStatusMutate.mockClear())

  it('목록·요약·반영 정책 — 총계 칩과 비활성 배지, 스냅샷 보존 안내를 렌더한다', () => {
    renderPage()
    expect(screen.getByText('총 3 템플릿 · 기본 1')).toBeInTheDocument()
    expect(
      screen.getByText(
        '기존 팀에는 자동 반영 안 됨 — 팀별 일지 항목 설정에서 직접 수정',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('레거시 v1.0 (보관)')).toBeInTheDocument()
    expect(screen.getByText('비활성')).toBeInTheDocument()
    // 첫 활성 템플릿 자동 선택 — 메타 카드 '기본 템플릿' 배지 + 항목 편집
    expect(screen.getByText('기본 템플릿')).toBeInTheDocument()
    expect(screen.getByText('항목 편집 — 2항목')).toBeInTheDocument()
    expect(
      screen.getByText(/기존 제출 일지·작성 중 초안은 작성 당시 항목 구조와/),
    ).toBeInTheDocument()
  })

  it('비활성화 — 일반 템플릿 선택 후 비활성화 클릭 시 isActive:false 로 mutate', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByText('DA 5기 데이터 분석용'))
    await user.click(screen.getByRole('button', { name: /비활성화/ }))
    expect(setStatusMutate).toHaveBeenCalledWith(
      { templateId: 'tpl_da5', isActive: false },
      expect.anything(),
    )
  })

  it('복원 — 비활성 템플릿 선택 시 비활성화 대신 복원 버튼, 클릭 시 isActive:true', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByText('레거시 v1.0 (보관)'))
    expect(screen.queryByRole('button', { name: /비활성화/ })).toBeNull()
    await user.click(screen.getByRole('button', { name: /복원/ }))
    expect(setStatusMutate).toHaveBeenCalledWith(
      { templateId: 'tpl_legacy', isActive: true },
      expect.anything(),
    )
  })
})
