import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import SnapshotPage from './SnapshotPage'
import { useSnapshot } from '../api/reviews'
import type { CertSnapshot } from '@/shared/types'

vi.mock('../api/reviews')

type Hook = ReturnType<typeof useSnapshot>

const snapshot: CertSnapshot = {
  certificateId: 'cert_8b2a',
  student: { name: '이서연', certId: 'def-5678', cohort: 'DA 5기' },
  isPublic: false,
  issuedAt: '2026-02-14 10:00',
  metrics: {
    trainingHours: 480,
    attendance: 0.962,
    quizAvg: 84.7,
    submissionRate: 0.91,
    submissionRaw: '32/35건',
  },
  skills: [
    { key: '기술', score: 82, confirmed: true },
    { key: '책임감', score: 76, confirmed: true },
  ],
  skillAvg: 81.7,
  evidence: [{ title: 'LLM 추천 시스템 v0.3', sub: '프로젝트 · 강사 승인' }],
  payloadJson: '{\n  "version": "2026.02"\n}',
  verify: {
    url: 'verify.playdata.io/cert/vfy_kp4q4r2nv0',
    snapshotHash: 'sha256:a3f8…07e',
    verifLevel: 'ver_202602_512',
  },
}

function mockHook(v: Partial<Hook>) {
  vi.mocked(useSnapshot).mockReturnValue(v as unknown as Hook)
}

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <SnapshotPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('SnapshotPage', () => {
  it('스냅샷 콘텐츠와 검증 URL을 렌더한다', () => {
    mockHook({ data: snapshot, isPending: false, isError: false })
    renderPage()
    expect(
      screen.getByRole('heading', { name: '스냅샷 상세', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('이서연')).toBeInTheDocument()
    expect(screen.getByText('480h')).toBeInTheDocument()
    expect(screen.getByText('LLM 추천 시스템 v0.3')).toBeInTheDocument()
    expect(
      screen.getByText('verify.playdata.io/cert/vfy_kp4q4r2nv0'),
    ).toBeInTheDocument()
  })

  it('검증 URL 복사 버튼이 동작한다', async () => {
    mockHook({ data: snapshot, isPending: false, isError: false })
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByLabelText('검증 URL 복사'))
    expect(screen.getByText('공개 검증 URL이 복사됐어요')).toBeInTheDocument()
  })

  it('로딩·에러 상태를 표시한다', () => {
    mockHook({ isPending: true })
    const { unmount } = renderPage()
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
    unmount()
    mockHook({ isPending: false, isError: true, refetch: vi.fn() })
    renderPage()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
