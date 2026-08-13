import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import {
  useAcceptMentoringProposal,
  useCancelMentoringRequest,
  useCreateMentoringRequest,
  useMentoring,
} from '../api/mentoring'
import MentoringPage from './MentoringPage'

// 교육과정 허브 탭바(2026-08-05) — 페이지 본문 테스트에 집중하도록 껍데기만 둔다.
vi.mock('../course/CourseTabs', () => ({ CourseTabs: () => null }))
// 허브 공통 헤더 훅(과정명/기간) — useQuery 의존이라 껍데기로 대체한다.
vi.mock('../course/useCourseHubHeader', () => ({
  useCourseHubHeader: () => {},
}))
import type {
  MentoringActiveRequest,
  MentoringData,
  MentoringReservation,
  MentoringRequestPolicy,
} from './types'

vi.mock('../api/mentoring')

const cancelMutate = vi.fn()

function activeRequest(
  id: string,
  requester: string,
  status: MentoringActiveRequest['status'] = 'requested',
): MentoringActiveRequest {
  return {
    id,
    status,
    proposedAtLabel: '2026-07-24(금) 10:00',
    student: {
      person: requester,
      datetime: '2026-07-30(목) 19:00 ~ 20:00',
      placeType: '온라인',
      placeDetail: 'Zoom',
      memo: '프로젝트 리뷰',
    },
    proposal:
      status === 'proposed'
        ? {
            person: '김멘토',
            datetime: '2026-07-31(금) 19:00 ~ 20:00',
            placeType: '온라인',
            placeDetail: 'Zoom',
            memo: '금요일은 가능합니다',
          }
        : undefined,
  }
}

function reservation(
  id: string,
  phase: MentoringReservation['phase'],
): MentoringReservation {
  return {
    id,
    phase,
    dateLabel: '2026-07-31(금)',
    timeLabel: '19:00 ~ 20:00',
    placeType: '온라인',
    placeDetail: 'Zoom',
    estHours: '1h',
    mentorName: '김멘토',
    mentorSpecialty: '멘토',
  }
}

function policy(
  values: Partial<MentoringRequestPolicy>,
): MentoringRequestPolicy {
  return {
    limit: 3,
    inUse: 0,
    canRequest: true,
    requestedCount: 0,
    proposedCount: 0,
    reservedCount: 0,
    blockReason: null,
    ...values,
  }
}

function mentoringData(values: Partial<MentoringData> = {}): MentoringData {
  return {
    teamName: 'Nexus 팀',
    mentor: { name: '김멘토', specialty: '멘토', assigned: true },
    kpis: {
      inProgress: 0,
      requestLimit: 3,
      completed: 0,
      cumulativeHours: 0,
      remainingHours: 10,
    },
    stats: [],
    activeRequest: null,
    reservation: null,
    activeRequests: [],
    reservations: [],
    requestPolicy: policy({}),
    history: [],
    teamMembers: [{ name: '박수진', isMe: true }],
    ...values,
  }
}

function renderPage(data: MentoringData) {
  vi.mocked(useMentoring).mockReturnValue({
    data,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useMentoring>)

  return render(
    <MemoryRouter>
      <ToastProvider>
        <MentoringPage />
      </ToastProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useCreateMentoringRequest).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateMentoringRequest>)
  vi.mocked(useCancelMentoringRequest).mockReturnValue({
    mutate: cancelMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useCancelMentoringRequest>)
  vi.mocked(useAcceptMentoringProposal).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useAcceptMentoringProposal>)
})

describe('MentoringPage 다건 요청 정책', () => {
  it('진행 요청 두 건을 모두 표시하고 새 요청을 허용한다', () => {
    const requests = [
      activeRequest('request-1', '박수진'),
      activeRequest('request-2', '이동료', 'proposed'),
    ]

    renderPage(
      mentoringData({
        activeRequest: requests[0],
        activeRequests: requests,
        requestPolicy: policy({
          inUse: 2,
          requestedCount: 1,
          proposedCount: 1,
        }),
      }),
    )

    expect(screen.getAllByText('진행 중 요청')).toHaveLength(2)
    expect(screen.getByText('2 / 3건')).toBeInTheDocument()
    expect(screen.getByText('1건 더 요청할 수 있어요')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '+ 새 멘토링 요청' }),
    ).toBeEnabled()
  })

  it('취소 확인창에 선택한 요청자를 표시하고 해당 요청을 취소한다', async () => {
    const user = userEvent.setup()
    const requests = [
      activeRequest('request-1', '박수진'),
      activeRequest('request-2', '이동료'),
    ]
    renderPage(
      mentoringData({
        activeRequest: requests[0],
        activeRequests: requests,
        requestPolicy: policy({ inUse: 2, requestedCount: 2 }),
      }),
    )

    await user.click(screen.getAllByRole('button', { name: '요청 취소' })[1])

    expect(screen.getByRole('dialog')).toHaveTextContent('요청자')
    expect(screen.getByRole('dialog')).toHaveTextContent('이동료')
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: '요청 취소',
      }),
    )
    expect(cancelMutate).toHaveBeenCalledWith('request-2', expect.anything())
  })

  // 전송 중에는 액션을 막는다 — 연타하면 두 번째 호출이 서버에서
  // "확정 전 요청만 취소할 수 있습니다"(422)로 떨어져 실패 토스트만 뜬다(2026-08-13 QA).
  it('취소·수락 전송 중에는 카드와 모달 버튼을 비활성화한다', async () => {
    const user = userEvent.setup()
    vi.mocked(useCancelMentoringRequest).mockReturnValue({
      mutate: cancelMutate,
      isPending: true,
    } as unknown as ReturnType<typeof useCancelMentoringRequest>)
    const request = activeRequest('request-1', '박수진', 'proposed')
    renderPage(
      mentoringData({
        activeRequest: request,
        activeRequests: [request],
        requestPolicy: policy({ inUse: 1, proposedCount: 1 }),
      }),
    )

    expect(screen.getByRole('button', { name: '요청 취소' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: '제안 거절 후 새로 요청' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: '처리 중…' })).toBeDisabled()

    // 모달을 열려면 카드 버튼이 막혀 있으므로 제안 수락 경로 대신 직접 확인한다.
    await user.click(screen.getByRole('button', { name: '요청 취소' }))
    expect(cancelMutate).not.toHaveBeenCalled()
  })

  it('요청 대기와 확정 예약으로 한도에 도달한 원인을 구분한다', () => {
    const requests = [
      activeRequest('request-1', '박수진'),
      activeRequest('request-2', '이동료'),
    ]
    const upcoming = reservation('reservation-1', 'upcoming')

    renderPage(
      mentoringData({
        activeRequest: requests[0],
        reservation: upcoming,
        activeRequests: requests,
        reservations: [upcoming],
        requestPolicy: policy({
          inUse: 3,
          canRequest: false,
          requestedCount: 2,
          reservedCount: 1,
          blockReason: 'limit_reached',
        }),
      }),
    )

    expect(screen.getByText('3 / 3건')).toBeInTheDocument()
    expect(screen.getByText('확정 예약 1건')).toBeInTheDocument()
    expect(
      screen.getByText(
        '요청 대기 2건 · 확정 예약 1건으로 팀 한도(3건)에 도달했어요',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '+ 새 멘토링 요청' }),
    ).toBeDisabled()
  })

  it('일정이 지난 확정 예약은 완료 처리 대기로 표시하고 한도에서 제외한다', () => {
    const past = reservation('reservation-past', 'awaiting_completion')

    renderPage(
      mentoringData({
        reservations: [past],
        requestPolicy: policy({}),
      }),
    )

    expect(
      screen.getAllByText('일정 종료 · 완료 처리 대기').length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText('일정 종료 · 완료 처리 대기 1건'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '+ 새 멘토링 요청' }),
    ).toBeEnabled()
  })
})
