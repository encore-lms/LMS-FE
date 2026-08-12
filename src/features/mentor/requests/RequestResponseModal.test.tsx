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
          <Route path="/mentor/teams" element={<div>배정 팀 목록</div>} />
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
    // 성공 시 예약 응답 완료 요약 페이지 이동 흐름 재현
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
    // 저장 완료 — 별도 완료 화면은 팀 탭 이관과 함께 걷어냈다(2026-08-04). 목록으로 돌아온다.
    expect(await screen.findByText('배정 팀 목록')).toBeInTheDocument()
  })

  it('조정 제안 모드 — 희망 일정이 공용 날짜·시각 피커에 프리필되고 제출 시 라벨로 합성된다', async () => {
    mockDetail('req_rec_6')
    const user = userEvent.setup()
    renderModal('/mentor/mentoring-requests/req_rec_6?mode=counter')

    // 자유 텍스트 input 대신 공용 DateTimePicker — 희망 일정('5/29 14:00~16:00')이 분해 프리필.
    expect(screen.getByLabelText('새 일정 날짜')).toHaveTextContent(
      '2026-05-29',
    )
    const minutes = screen.getByLabelText('예상 시간 (분)')
    await user.clear(minutes)
    await user.type(minutes, '90')
    await user.type(
      screen.getByLabelText('멘토 메모 (선택)'),
      '다음 날 저녁으로 옮겨드립니다.',
    )
    await user.click(screen.getByRole('button', { name: /선택한 응답 저장/ }))

    await waitFor(() => expect(actionMutate).toHaveBeenCalled())
    // 제출 시 분해값을 'M/D(요일) HH:mm ~ HH:mm' 로 합성 — 요일은 실제 날짜에서 계산(2026-05-29=금).
    expect(actionMutate).toHaveBeenCalledWith(
      {
        requestId: 'req_rec_6',
        action: 'counter-propose',
        payload: {
          dateTimeLabel: '5/29(금) 14:00 ~ 16:00',
          placeType: 'online',
          placeDetail: 'Zoom',
          expectedMinutes: 90,
          mentorResponseNote: '다음 날 저녁으로 옮겨드립니다.',
        },
      },
      expect.anything(),
    )
  })

  it('조정 제안 모드 — 종료 시각이 시작보다 이르면 검증 에러로 제출이 차단된다', async () => {
    mockDetail('req_rec_6')
    const user = userEvent.setup()
    renderModal('/mentor/mentoring-requests/req_rec_6?mode=counter')

    // 종료 시각 피커를 시작(14:00)보다 이른 오전 10:00 으로 변경 → refine 위반.
    await user.click(screen.getByLabelText('종료 시각'))
    await user.click(screen.getByRole('button', { name: '오전' }))
    await user.click(screen.getByRole('button', { name: '10시' }))
    await user.click(screen.getByRole('button', { name: '00분' }))
    await user.click(screen.getByRole('button', { name: '적용' }))

    await user.click(screen.getByRole('button', { name: /선택한 응답 저장/ }))
    expect(
      await screen.findByText('종료 시각은 시작 시각보다 늦어야 합니다'),
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
    // 기존 제안('6/3 19:00~21:00')이 공용 피커에 분해 프리필
    expect(screen.getByLabelText('새 일정 날짜')).toHaveTextContent(
      '2026-06-03',
    )
    await user.click(screen.getByRole('button', { name: /선택한 응답 저장/ }))
    await waitFor(() => expect(actionMutate).toHaveBeenCalled())
    expect(actionMutate.mock.calls[0][0]).toMatchObject({
      requestId: 'req_dm_6',
      action: 'counter-propose',
      // 요일은 실제 날짜 기준 재계산(2026-06-03=수)
      payload: expect.objectContaining({
        dateTimeLabel: '6/3(수) 19:00 ~ 21:00',
      }),
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
