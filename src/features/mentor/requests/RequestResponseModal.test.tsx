import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RequestResponseModal from './RequestResponseModal'
import {
  useMentoringRequestAction,
  useMentoringRequestDetail,
  useUpdateConfirmedDetails,
} from '../api/requests'
import { buildMentoringRequestDetail } from '../mockDb'
import { ToastProvider } from '@/components/ui/Toast'

vi.mock('../api/requests')

type DetailHook = ReturnType<typeof useMentoringRequestDetail>

const actionMutate = vi.fn()
const detailsMutate = vi.fn()

function mockDetail(requestId: string) {
  vi.mocked(useMentoringRequestDetail).mockReturnValue({
    data: buildMentoringRequestDetail(requestId),
    isPending: false,
    isError: false,
  } as unknown as DetailHook)
}

function renderModal(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ToastProvider>
        <Routes>
          <Route
            path="/mentor/mentoring-requests"
            element={<div>요청 목록</div>}
          />
          <Route
            path="/mentor/mentoring-requests/:requestId"
            element={<RequestResponseModal />}
          />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useMentoringRequestAction).mockReturnValue({
    mutate: actionMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useMentoringRequestAction>)
  vi.mocked(useUpdateConfirmedDetails).mockReturnValue({
    mutate: detailsMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateConfirmedDetails>)
})

describe('RequestResponseModal', () => {
  it('요청 대기 — 요청 정보·응답 모드 3종을 렌더하고, 확정 저장 시 confirm 을 호출한다', async () => {
    mockDetail('req_rec_6')
    // 성공 시 토스트 + 목록 복귀(목록 잔류) 흐름 재현
    actionMutate.mockImplementation((_vars, opts) => opts?.onSuccess?.())
    const user = userEvent.setup()
    renderModal('/mentor/mentoring-requests/req_rec_6?mode=confirm')

    expect(screen.getByText('AI 5기 · 추천시스템 팀')).toBeInTheDocument()
    expect(screen.getByText(/요청일 2026-05-26 19:42/)).toBeInTheDocument()
    expect(screen.getByText(/처리 마감 D-2/)).toBeInTheDocument()
    expect(screen.getByText('희망 일정')).toBeInTheDocument()
    expect(screen.getByText('요청 메모')).toBeInTheDocument()
    // 응답 모드 라디오 카드 3종 — Figma 보조 설명 원문
    expect(screen.getByText('희망 일정 그대로')).toBeInTheDocument()
    expect(screen.getByText('일정·장소·시간 수정')).toBeInTheDocument()
    expect(screen.getByText('요청 거절 + 사유')).toBeInTheDocument()
    expect(
      screen.getByText(
        '확정은 예약 확정, 조정 제안은 수강생 응답 대기, 거절은 요청 종료로 저장됩니다',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /선택한 응답 저장/ }))
    expect(actionMutate).toHaveBeenCalledWith(
      { requestId: 'req_rec_6', action: 'confirm' },
      expect.anything(),
    )
    // 저장 완료 — 공통 토스트 원문 + 목록 복귀
    expect(
      screen.getByText(
        '예약 응답이 저장되었습니다. 선택한 상태가 요청 목록에 반영됩니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('요청 목록')).toBeInTheDocument()
  })

  it('조정 제안 모드 — 희망 일정 프리필 폼을 제출하면 counter-propose 를 호출한다', async () => {
    mockDetail('req_rec_6')
    const user = userEvent.setup()
    renderModal('/mentor/mentoring-requests/req_rec_6?mode=counter')

    const datetime = screen.getByLabelText('새 일정')
    expect(datetime).toHaveValue('5/29(목) 14:00 ~ 16:00')
    await user.clear(datetime)
    await user.type(datetime, '6/3(화) 19:00 ~ 21:00')
    const minutes = screen.getByLabelText('예상 시간 (분)')
    await user.clear(minutes)
    await user.type(minutes, '90')
    await user.type(
      screen.getByLabelText('멘토 메모 (선택)'),
      '다음 날 저녁으로 옮겨드립니다.',
    )
    await user.click(screen.getByRole('button', { name: /선택한 응답 저장/ }))

    await waitFor(() => expect(actionMutate).toHaveBeenCalled())
    expect(actionMutate).toHaveBeenCalledWith(
      {
        requestId: 'req_rec_6',
        action: 'counter-propose',
        payload: {
          dateTimeLabel: '6/3(화) 19:00 ~ 21:00',
          placeType: 'online',
          placeDetail: 'Zoom',
          expectedMinutes: 90,
          mentorResponseNote: '다음 날 저녁으로 옮겨드립니다.',
        },
      },
      expect.anything(),
    )
  })

  it('조정 제안 모드 — 새 일정 비우면 검증 에러로 제출이 차단된다', async () => {
    mockDetail('req_rec_6')
    const user = userEvent.setup()
    renderModal('/mentor/mentoring-requests/req_rec_6?mode=counter')

    await user.clear(screen.getByLabelText('새 일정'))
    await user.click(screen.getByRole('button', { name: /선택한 응답 저장/ }))
    expect(
      await screen.findByText('새 일정을 입력해주세요'),
    ).toBeInTheDocument()
    expect(actionMutate).not.toHaveBeenCalled()
  })

  it('거절 모드 — 응답 메모(선택)와 함께 reject 를 호출한다', async () => {
    mockDetail('req_rec_6')
    const user = userEvent.setup()
    renderModal('/mentor/mentoring-requests/req_rec_6?mode=reject')

    await user.type(
      screen.getByLabelText('거절 사유 메모 (선택)'),
      '해당 주는 일정이 가득 찼어요.',
    )
    await user.click(screen.getByRole('button', { name: /선택한 응답 저장/ }))
    expect(actionMutate).toHaveBeenCalledWith(
      {
        requestId: 'req_rec_6',
        action: 'reject',
        payload: { mentorResponseNote: '해당 주는 일정이 가득 찼어요.' },
      },
      expect.anything(),
    )
  })

  it('조정 제안 상태 — 기존 제안 프리필 폼만 노출되고 제안 수정으로 저장된다', async () => {
    mockDetail('req_dm_6')
    const user = userEvent.setup()
    renderModal('/mentor/mentoring-requests/req_dm_6?mode=counter')

    // 응답 모드 라디오 없음(확정·거절은 수강생 몫) — 제안 폼만
    expect(screen.queryByText('희망 일정 그대로')).not.toBeInTheDocument()
    expect(screen.getByLabelText('새 일정')).toHaveValue(
      '6/3(화) 19:00 ~ 21:00',
    )
    await user.click(screen.getByRole('button', { name: /선택한 응답 저장/ }))
    await waitFor(() => expect(actionMutate).toHaveBeenCalled())
    expect(actionMutate.mock.calls[0][0]).toMatchObject({
      requestId: 'req_dm_6',
      action: 'counter-propose',
    })
  })

  it('확정 상태 — 확정 정보 변경 폼이 confirmed-details PATCH 를 호출한다', async () => {
    mockDetail('res_rec_5')
    const user = userEvent.setup()
    renderModal('/mentor/mentoring-requests/res_rec_5')

    expect(screen.getByText('확정 정보 변경')).toBeInTheDocument()
    expect(screen.getByText('확정 일정')).toBeInTheDocument()
    const place = screen.getByLabelText('상세 장소')
    await user.clear(place)
    await user.type(place, 'Zoom · 미팅 ID 123')
    await user.click(screen.getByRole('button', { name: /선택한 응답 저장/ }))
    await waitFor(() => expect(detailsMutate).toHaveBeenCalled())
    expect(detailsMutate.mock.calls[0][0]).toMatchObject({
      requestId: 'res_rec_5',
      payload: expect.objectContaining({ placeDetail: 'Zoom · 미팅 ID 123' }),
    })
    expect(actionMutate).not.toHaveBeenCalled()
  })
})
