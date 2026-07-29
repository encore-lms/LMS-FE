import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LogComposePage from './LogComposePage'
import LogSubmittedPage from './LogSubmittedPage'
import {
  useLogFieldSnapshot,
  useMentoringLogDetail,
  useMentoringLogTargets,
  useSubmitMentoringLog,
} from '../api/logs'
import {
  LOG_FIELD_SNAPSHOT,
  buildMentoringLogDetail,
  buildMentoringLogTargets,
} from '../mockDb'
import { ToastProvider } from '@/components/ui/Toast'
import { usePageHeaderStore } from '@/shared/store'

vi.mock('../api/logs')

const submitMutateAsync = vi.fn()

function mockDetail(v: unknown) {
  vi.mocked(useMentoringLogDetail).mockReturnValue(
    v as ReturnType<typeof useMentoringLogDetail>,
  )
}

function renderPage(entry = '/mentor/mentoring-logs/new') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ToastProvider>
        <Routes>
          <Route
            path="/mentor/mentoring-logs/new"
            element={<LogComposePage />}
          />
          <Route
            path="/mentor/mentoring-logs"
            element={<div>일지 목록 화면</div>}
          />
          <Route
            path="/mentor/mentoring-logs/submitted"
            element={<LogSubmittedPage />}
          />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useMentoringLogTargets).mockReturnValue({
    data: buildMentoringLogTargets(),
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useMentoringLogTargets>)
  vi.mocked(useLogFieldSnapshot).mockReturnValue({
    data: LOG_FIELD_SNAPSHOT,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useLogFieldSnapshot>)
  mockDetail({ isPending: false, isError: false, data: undefined })
  vi.mocked(useSubmitMentoringLog).mockReturnValue({
    mutateAsync: submitMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useSubmitMentoringLog>)
  submitMutateAsync.mockResolvedValue({})
})

describe('LogComposePage', () => {
  it('신규 작성 — 기본 정보·템플릿 스냅샷 동적 폼·시간 차감 배너를 렌더한다', () => {
    renderPage()
    expect(usePageHeaderStore.getState().title).toBe('멘토링 일지 작성/수정')
    expect(screen.getByText('기본 정보')).toBeInTheDocument()
    // 템플릿 스냅샷 — 필수 3 · 선택 3, 텍스트 항목 4개 에디터
    expect(
      screen.getByText('팀 템플릿 6개 · 필수 3 · 선택 3'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('주요 아젠다')).toBeInTheDocument()
    expect(screen.getByLabelText('수행 내용')).toBeInTheDocument()
    expect(screen.getByLabelText('멘토 의견 및 요청 사항')).toBeInTheDocument()
    expect(screen.getByLabelText('코드리뷰 내용')).toBeInTheDocument()
    // 첨부형 항목 — 드롭존·사진 추가(업로드 계약 미확정, 표시 전용)
    expect(
      screen.getByText('파일·문서를 끌어 놓거나 클릭해 업로드'),
    ).toBeInTheDocument()
    expect(screen.getByText('사진 추가')).toBeInTheDocument()
    // 시간 차감 자동 산정 배너 + 정책 캡션(승인 단계 도입 반영)
    expect(screen.getByText('시간 차감 자동 산정')).toBeInTheDocument()
    expect(
      screen.getByText(
        '제출 시 승인 대기 · 매니저 승인 후 인정 · 수정 요청 시 전체 수정 후 재제출',
      ),
    ).toBeInTheDocument()
    // 참석 멘티 — 기본 전원 선택(추천시스템 팀 5명)
    expect(screen.getByText('5 / 5명 참석')).toBeInTheDocument()
  })

  it('필수 항목 검증 — 미입력 제출은 차단되고 오류를 표시한다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /일지 제출/ }))
    expect(
      await screen.findByText('진행 일자를 입력해주세요'),
    ).toBeInTheDocument()
    expect(screen.getByText('상세 장소를 입력해주세요')).toBeInTheDocument()
    expect(
      screen.getByText('필수 항목이에요 — 주요 아젠다을(를) 작성해주세요'),
    ).toBeInTheDocument()
    expect(submitMutateAsync).not.toHaveBeenCalled()
  })

  it('작성 완료 제출 — 초안 생성 후 submit, 목록(?toast=submitted)으로 복귀한다', async () => {
    const user = userEvent.setup()
    renderPage()
    // 진행 일자 — 달력 기본=이번 달, 15일 선택(소요시간은 시작/종료 시각으로만 산정)
    const now = new Date()
    const expectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`
    await user.click(screen.getByRole('button', { name: '진행 일자' }))
    await user.click(within(screen.getByRole('dialog')).getByText('15'))
    // 시작 14:00 = 오후 02시 00분
    await user.click(screen.getByRole('button', { name: '시작 시각' }))
    const startDlg = screen.getByRole('dialog')
    await user.click(within(startDlg).getByRole('button', { name: '오후' }))
    await user.click(within(startDlg).getByRole('button', { name: '02시' }))
    await user.click(within(startDlg).getByRole('button', { name: '00분' }))
    await user.click(within(startDlg).getByRole('button', { name: '적용' }))
    // 종료 15:58 = 오후 03시 58분 → 118분
    await user.click(screen.getByRole('button', { name: '종료 시각' }))
    const endDlg = screen.getByRole('dialog')
    await user.click(within(endDlg).getByRole('button', { name: '오후' }))
    await user.click(within(endDlg).getByRole('button', { name: '03시' }))
    await user.click(within(endDlg).getByRole('button', { name: '58분' }))
    await user.click(within(endDlg).getByRole('button', { name: '적용' }))
    // 실제 진행 시간 자동 산정(118분 → 2시간) — 인정 시간 프리뷰
    expect(screen.getByText('2시간 (118분)')).toBeInTheDocument()
    await user.type(
      screen.getByLabelText('상세 장소 *'),
      '플레이데이터 강남캠퍼스 · 세미나실 B',
    )
    await user.type(screen.getByLabelText('주요 아젠다'), '추천 모델 회고')
    await user.type(screen.getByLabelText('수행 내용'), '● 회고 진행')
    await user.type(
      screen.getByLabelText('멘토 의견 및 요청 사항'),
      '다음 회차까지 지표 정리',
    )
    await user.click(screen.getByRole('button', { name: /일지 제출/ }))

    await waitFor(() => expect(submitMutateAsync).toHaveBeenCalled())
    // 신규 작성 — 제출=생성(초안 선저장 없음, logId 없이 바로 create). 승인 단계 도입.
    expect(submitMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'submit',
        payload: expect.objectContaining({
          teamId: 'team_rec',
          sessionDate: expectedDate,
          startTime: '14:00',
          endTime: '15:58',
          placeType: 'offline',
        }),
      }),
    )
    expect(submitMutateAsync.mock.calls[0][0].logId).toBeUndefined()
    // 제출 완료 — 요약 페이지로 이동(state 로 요약 전달)
    expect(await screen.findByText('일지가 제출되었습니다')).toBeInTheDocument()
  })

  it('신규 작성 — 임시 저장 버튼 없음(승인 단계 도입, 초안 제거)', async () => {
    renderPage()
    expect(
      screen.queryByRole('button', { name: '임시 저장' }),
    ).not.toBeInTheDocument()
  })

  it('수정 요청 재제출 — 사유 배너 + 일지 재제출(임시 저장 없음)', async () => {
    mockDetail({
      isPending: false,
      isError: false,
      data: buildMentoringLogDetail('log_ts_3'),
    })
    const user = userEvent.setup()
    renderPage('/mentor/mentoring-logs/new?logId=log_ts_3')
    // 운영자 수정 요청 컨텍스트 — 사유 코드 라벨 + 상세 메모
    expect(
      screen.getByText('운영자 수정 요청 — 항목 답변 불충분'),
    ).toBeInTheDocument()
    expect(screen.getByText(/전체 수정 후 재제출해 주세요/)).toBeInTheDocument()
    // 재제출 전용 — 임시 저장 없음, 대상 팀 고정
    expect(
      screen.queryByRole('button', { name: '임시 저장' }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('대상 팀')).toBeDisabled()

    // 전체 수정 후 재제출 → resubmit mutation
    await user.type(screen.getByLabelText('수행 내용'), '● 보강된 진행 내용')
    await user.type(
      screen.getByLabelText('멘토 의견 및 요청 사항'),
      '재현 스크립트 보존 권장',
    )
    await user.click(screen.getByRole('button', { name: /일지 재제출/ }))
    await waitFor(() =>
      expect(submitMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ logId: 'log_ts_3', mode: 'resubmit' }),
      ),
    )
    expect(
      await screen.findByText('일지가 재제출되었습니다'),
    ).toBeInTheDocument()
  })

  it('유효 일지 진입 차단 — 제출 후 임의 수정 불가(05-31 확정)', () => {
    mockDetail({
      isPending: false,
      isError: false,
      data: buildMentoringLogDetail('log_rec_4'),
    })
    renderPage('/mentor/mentoring-logs/new?logId=log_rec_4')
    expect(
      screen.getByText('제출된 일지는 수정할 수 없어요'),
    ).toBeInTheDocument()
    expect(screen.queryByText('기본 정보')).not.toBeInTheDocument()
  })

  it('비용·정산·매출 표현이 없다', () => {
    const { container } = renderPage()
    expect(container.textContent ?? '').not.toMatch(/비용|정산|매출/)
  })
})
