import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import CertificateTemplatePage from './CertificateTemplatePage'
import { useCertificateTemplate } from './api'
import type { CertTemplateOverview } from './types'

vi.mock('./api')

// 증명서 템플릿 — 탭·KPI·필드 표·미리보기 패널·스냅샷 정책 렌더 + 탭 전환 + 액션 토스트.

const overview: CertTemplateOverview = {
  summary: {
    version: 'v3.2',
    versionState: '공개중',
    publicFields: 18,
    internalFields: 9,
    snapshotLockStages: 5,
    policyWarnings: 2,
  },
  fields: [
    {
      id: 'profile',
      section: '프로필',
      publicField: '이름·과정·기수',
      internalField: 'userId',
      status: 'normal',
      action: 'edit',
    },
    {
      id: 'reputation',
      section: '평판',
      publicField: '동료/멘토 요약',
      internalField: 'rawComment',
      status: 'warning',
      action: 'mask',
    },
  ],
  preview: {
    studentName: '김민준',
    cohortLabel: 'DA 4기',
    coreCompetency: '문제 해결 86 · 협업 91 · 성실성 94',
    representativeProject: 'WeatherAPI 기반 데이터 파이프라인',
  },
}

function renderPage() {
  vi.mocked(useCertificateTemplate).mockReturnValue({
    data: overview,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCertificateTemplate>)
  return render(
    <ToastProvider>
      <MemoryRouter>
        <CertificateTemplatePage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('CertificateTemplatePage (증명서 템플릿)', () => {
  it('KPI 5종 + 필드 표 + 스냅샷 정책 콜아웃을 렌더한다', () => {
    renderPage()
    expect(screen.getByText('v3.2')).toBeInTheDocument()
    expect(screen.getByText('5단계')).toBeInTheDocument()
    // 섹션·내부 필드
    expect(screen.getByText('이름·과정·기수')).toBeInTheDocument()
    expect(screen.getByText('userId')).toBeInTheDocument()
    expect(screen.getByText('rawComment')).toBeInTheDocument()
    // 하단 정책 콜아웃 + 공개 미리보기(기본 공개 필드 탭)
    expect(
      screen.getByText(/정식 인증 승인 시 공개 필드와 내부 필드가/),
    ).toBeInTheDocument()
    expect(screen.getByText('증명서 공개 미리보기')).toBeInTheDocument()
  })

  it('내부 필드 탭 — 우측 패널이 내부 필드 미리보기로 바뀐다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '내부 필드' }))
    expect(screen.getByText('내부 필드 미리보기')).toBeInTheDocument()
    expect(
      screen.getByText('운영/검토 전용 — 수강생·외부에 노출되지 않습니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('증명서 공개 미리보기')).toBeNull()
  })

  it('정책 저장 버튼 — 준비 중 토스트를 띄운다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '정책 저장' }))
    expect(
      await screen.findByText('정책 저장은 준비 중입니다.'),
    ).toBeInTheDocument()
  })
})
