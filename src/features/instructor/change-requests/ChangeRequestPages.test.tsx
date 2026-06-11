import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import ChangeRequestsPage from './ChangeRequestsPage'
import RecertificationsPage from './RecertificationsPage'
import { useChangeRequests, useRecertifications } from '../api/changeRequests'
import type {
  InstructorChangeRequestsData,
  RecertificationsData,
} from '@/shared/types'

vi.mock('../api/changeRequests')

const changeRequests: InstructorChangeRequestsData = {
  items: [
    {
      id: 'cr-1',
      type: 'project',
      target: '추천 영상 큐레이션',
      requester: '김민준 PM',
      status: 'requested',
      certifierAbsent: false,
      changes: [
        {
          id: 'diff-stack',
          label: '기술스택: React Query 추가',
          before: 'axios 단독 호출',
          after: 'TanStack Query v5 도입',
        },
      ],
    },
    {
      id: 'cr-2',
      type: 'troubleshooting',
      target: 'OOM 원인 분석',
      requester: '이서연',
      status: 'reviewing',
      certifierAbsent: true,
      changes: [
        {
          id: 'diff-oom',
          label: '원인 분석: heap dump 근거 추가',
          before: '로그 기반 추정',
          after: 'heap dump 분석 첨부',
        },
      ],
    },
  ],
}

const recertifications: RecertificationsData = {
  items: [
    {
      id: 'rc-1',
      type: 'project',
      target: '추천 영상 큐레이션',
      requesterLabel: 'PM 김민준',
      summary: '수정 완료 요청',
      changes: [
        {
          id: 'diff-artifact',
          label: '산출물: 최종 발표 PDF 교체',
          before: 'v1.pdf',
          after: 'v2.pdf — 성능 비교 4장 추가',
        },
      ],
    },
    {
      id: 'rc-2',
      type: 'troubleshooting',
      target: 'OOM 원인 분석',
      requesterLabel: '이서연',
      summary: '수정 완료 요청',
      changes: [
        {
          id: 'diff-oom-recert',
          label: '해결 과정: 재발 방지 테스트 추가',
          before: '수동 재현 절차',
          after: '부하 테스트 시나리오 추가',
        },
      ],
    },
  ],
}

function ok(data: unknown) {
  return { data, isPending: false, isError: false }
}

function renderAt(path: string) {
  vi.mocked(useChangeRequests).mockReturnValue(
    ok(changeRequests) as unknown as ReturnType<typeof useChangeRequests>,
  )
  vi.mocked(useRecertifications).mockReturnValue(
    ok(recertifications) as unknown as ReturnType<typeof useRecertifications>,
  )
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/instructor/change-requests"
            element={<ChangeRequestsPage />}
          />
          <Route
            path="/instructor/recertifications"
            element={<RecertificationsPage />}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ChangeRequestsPage (P0 29 통합)', () => {
  it('큐 행·유형 칩·상태 pill·인증자 부재 배지를 렌더한다', () => {
    renderAt('/instructor/change-requests')
    expect(screen.getByText('검토 대기 변경 제안')).toBeInTheDocument()
    expect(screen.getByText('추천 영상 큐레이션')).toBeInTheDocument()
    expect(screen.getByText('요청 대기')).toBeInTheDocument()
    expect(screen.getByText('검토중')).toBeInTheDocument()
    expect(screen.getByText('인증자 부재 — 매니저 대체')).toBeInTheDocument()
  })

  it('[검토] 클릭 시 상세 패널이 열리고 접힘 카드가 이전/변경 값을 펼친다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/change-requests')
    await user.click(screen.getAllByRole('button', { name: '검토' })[0])
    expect(screen.getByText('변경된 내역만 보기')).toBeInTheDocument()
    await user.click(screen.getByText('기술스택: React Query 추가'))
    expect(screen.getByText('이전 값')).toBeInTheDocument()
    expect(screen.getByText('TanStack Query v5 도입')).toBeInTheDocument()
  })

  it('승인 시 큐에서 제거된다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/change-requests')
    await user.click(screen.getAllByRole('button', { name: '검토' })[0])
    await user.click(screen.getByRole('button', { name: '승인' }))
    expect(screen.queryByText('추천 영상 큐레이션')).not.toBeInTheDocument()
  })

  it('유형 탭이 큐를 필터링한다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/change-requests')
    await user.click(screen.getByRole('button', { name: '트러블슈팅' }))
    expect(screen.getByText('OOM 원인 분석')).toBeInTheDocument()
    expect(screen.queryByText('추천 영상 큐레이션')).not.toBeInTheDocument()
  })
})

describe('RecertificationsPage (P0 29)', () => {
  it('첫 요청이 기본 선택돼 상세·변경 내역·액션을 렌더한다', () => {
    renderAt('/instructor/recertifications')
    expect(screen.getByText('재인증 요청 상세')).toBeInTheDocument()
    expect(
      screen.getByText(/추천 영상 큐레이션 · PM 김민준 · 수정 완료 요청/),
    ).toBeInTheDocument()
    expect(screen.getByText('산출물: 최종 발표 PDF 교체')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '재인증 승인' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '보완요청' })).toBeInTheDocument()
  })

  it('재인증 승인 시 다음 요청으로 넘어간다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/recertifications')
    await user.click(screen.getByRole('button', { name: '재인증 승인' }))
    expect(
      screen.getByText(/OOM 원인 분석 · 이서연 · 수정 완료 요청/),
    ).toBeInTheDocument()
  })
})
