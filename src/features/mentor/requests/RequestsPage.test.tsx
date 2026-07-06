import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RequestsPage from './RequestsPage'
import {
  useMentoringRequestAction,
  useMentoringRequests,
} from '../api/requests'
import { buildMentoringRequestsData } from '../mockDb'
import { ToastProvider } from '@/components/ui/Toast'
import { usePageHeaderStore } from '@/shared/store'

vi.mock('../api/requests')

type ListHook = ReturnType<typeof useMentoringRequests>

function mockList(v: Partial<ListHook>) {
  vi.mocked(useMentoringRequests).mockReturnValue(v as unknown as ListHook)
}

const actionMutate = vi.fn()

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/mentor/mentoring-requests']}>
      <ToastProvider>
        <RequestsPage />
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
})

describe('RequestsPage', () => {
  it('KPI·필터 탭·진행 중 요청 카드를 렌더한다', () => {
    mockList({
      data: buildMentoringRequestsData(),
      isPending: false,
      isError: false,
    })
    renderPage()
    expect(usePageHeaderStore.getState().title).toBe('멘토링 예약 요청')
    // KPI 4 — 보조설명 원문
    expect(screen.getByText('처리 필요 · D-0 ~ D+1')).toBeInTheDocument()
    expect(screen.getByText('예정된 멘토링')).toBeInTheDocument()
    expect(screen.getByText('최근 30일 진행')).toBeInTheDocument()
    // 기본 탭 '진행 중 요청' — 요청 대기 2 + 조정 제안 1 카드
    expect(screen.getByText('추천시스템 팀')).toBeInTheDocument()
    expect(screen.getByText('트러블슈팅 팀')).toBeInTheDocument()
    expect(screen.getByText('데이터마트 팀')).toBeInTheDocument()
    // 조정 제안 카드 — 내 조정 제안 박스 + 제안 액션
    expect(screen.getByText('내 조정 제안')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '제안 취소' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '제안 수정' })).toBeInTheDocument()
    // 요청 대기 카드 액션 — 모달 오픈 링크(모드 프리셀렉트)
    expect(screen.getAllByRole('link', { name: '확정' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: '거절' })[0]).toHaveAttribute(
      'href',
      '/mentor/mentoring-requests/req_rec_6?mode=reject',
    )
  })

  it('상태 탭·검색으로 목록을 거른다', async () => {
    mockList({
      data: buildMentoringRequestsData(),
      isPending: false,
      isError: false,
    })
    const user = userEvent.setup()
    renderPage()
    // 완료 탭 — 유효 일지 파생 건(NLP 분석 팀 포함), 진행 중 카드 숨김
    await user.click(screen.getByRole('button', { name: /^완료/ }))
    expect(screen.getAllByText('NLP 분석 팀').length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: '확정' })).not.toBeInTheDocument()
    // 진행 중 복귀 + 검색
    await user.click(screen.getByRole('button', { name: /진행 중 요청/ }))
    await user.type(screen.getByLabelText('팀명·요청자 검색'), '트러블')
    expect(screen.getByText('트러블슈팅 팀')).toBeInTheDocument()
    expect(screen.queryByText('추천시스템 팀')).not.toBeInTheDocument()
  })

  it('제안 취소 — cancel mutation 을 호출한다', async () => {
    mockList({
      data: buildMentoringRequestsData(),
      isPending: false,
      isError: false,
    })
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: '제안 취소' }))
    expect(actionMutate).toHaveBeenCalledWith(
      { requestId: 'req_dm_6', action: 'cancel' },
      expect.anything(),
    )
  })

  it('비용·정산·매출 표현이 없다', () => {
    mockList({
      data: buildMentoringRequestsData(),
      isPending: false,
      isError: false,
    })
    const { container } = renderPage()
    expect(container.textContent ?? '').not.toMatch(/비용|정산|매출/)
  })

  it('로딩·에러 상태를 표시한다', () => {
    mockList({ isPending: true })
    const { unmount } = renderPage()
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    unmount()
    mockList({ isPending: false, isError: true, refetch: vi.fn() })
    renderPage()
    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument()
  })
})
