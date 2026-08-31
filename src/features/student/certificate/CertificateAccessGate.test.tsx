import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCertificateAnalysis } from './analysis'
import { CertificateAccessGate } from './CertificateAccessGate'
import type { CertificateAnalysisView } from './analysis'

vi.mock('./analysis', () => ({
  useCertificateAnalysis: vi.fn(),
}))

const readyView = {
  dataStatus: 'READY',
  analysisStatus: 'READY',
  resultSchemaVersion: '2026.08.26-certificate-seven-tab-result-v1',
  tabs: {},
  mode: 'PREVIEW',
  snapshot: null,
} as CertificateAnalysisView

function renderGate(path = '/student/certificate') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/student" element={<div>수강생 대시보드</div>} />
        <Route element={<CertificateAccessGate />}>
          <Route path="/student/certificate" element={<div>역량 증명서</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('CertificateAccessGate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('준비 상태를 확인하는 동안 증명서 본문을 먼저 보여주지 않는다', () => {
    vi.mocked(useCertificateAnalysis).mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    } as never)

    renderGate()

    expect(
      screen.getByText('증명서 준비 상태를 확인하는 중입니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('역량 증명서')).not.toBeInTheDocument()
  })

  it('데이터가 준비되지 않으면 직접 URL도 대시보드로 돌린다', () => {
    vi.mocked(useCertificateAnalysis).mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...readyView, dataStatus: 'NOT_READY' },
    } as never)

    renderGate()

    expect(screen.getByText('수강생 대시보드')).toBeInTheDocument()
    expect(screen.queryByText('역량 증명서')).not.toBeInTheDocument()
  })

  it('완성된 7개 탭 결과가 있을 때만 증명서 라우트를 연다', () => {
    vi.mocked(useCertificateAnalysis).mockReturnValue({
      isPending: false,
      isError: false,
      data: readyView,
    } as never)

    renderGate()

    expect(screen.getByText('역량 증명서')).toBeInTheDocument()
  })
})
