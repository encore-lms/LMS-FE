import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LogsPage from './LogsPage'
import { useMentoringLogs } from '../api/logs'
import { buildMentoringLogsData } from '../mockDb'
import { LOG_SUBMITTED_TOAST } from './logMeta'
import { ToastProvider } from '@/components/ui/Toast'
import { usePageHeaderStore } from '@/shared/store'

vi.mock('../api/logs')
// 상세 모달 자체는 여기서 검증하지 않는다 — '어디에' 열리는지만 본다.
vi.mock('./LogDetailModal', () => ({
  default: ({ logId }: { logId?: string }) => (
    <div>그 자리 상세 모달 {logId}</div>
  ),
}))

type ListHook = ReturnType<typeof useMentoringLogs>

function mockList(v: Partial<ListHook>) {
  vi.mocked(useMentoringLogs).mockReturnValue(v as unknown as ListHook)
}

function renderPage(entry = '/mentor/mentoring-logs') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ToastProvider>
        <LogsPage />
      </ToastProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LogsPage', () => {
  it('필터·KPI·8컬럼 테이블·페이지네이션을 렌더한다', () => {
    mockList({
      data: buildMentoringLogsData(),
      isPending: false,
      isError: false,
    })
    renderPage()
    expect(usePageHeaderStore.getState().title).toBe('멘토링 일지')
    // KPI 캡션(승인 단계 도입 반영)
    expect(
      screen.getByText('매니저 승인 완료 · 인정 시간 산입'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('멘토가 전체 수정 후 재제출 필요'),
    ).toBeInTheDocument()
    expect(screen.getByText('매니저 승인 후 인정')).toBeInTheDocument()
    // 테이블 행 — 팀명·요지·상태 칩
    expect(screen.getAllByText('추천시스템 팀').length).toBeGreaterThan(0)
    expect(
      screen.getByText('추천 모델 v2 평가 지표 검토 + 다음 액션 정리'),
    ).toBeInTheDocument()
    // 수정 요청 사유는 칩 아래 별도 줄(칩이 상태 컬럼을 밀지 않도록 분리)
    expect(screen.getByText('일지 보강 필요')).toBeInTheDocument()
    // 페이지네이션 — 페이지당 8건(공통 Pagination), 전체 건수 대비 표시 건수 안내
    expect(screen.getByText(/건 중 8건 표시/)).toBeInTheDocument()
    // 상태 연동 액션 — 열기(상세 모달) / 수정(재제출 폼 딥링크)
    expect(
      screen.getAllByRole('link', { name: /열기/ }).length,
    ).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /^수정/ })).toHaveAttribute(
      'href',
      '/mentor/mentoring-logs/new?logId=log_ts_3',
    )
    expect(screen.getByRole('link', { name: /새 일지 작성/ })).toHaveAttribute(
      'href',
      '/mentor/mentoring-logs/new',
    )
  })

  it('상태·팀 필터와 검색으로 목록을 거른다', async () => {
    mockList({
      data: buildMentoringLogsData(),
      isPending: false,
      isError: false,
    })
    const user = userEvent.setup()
    renderPage()
    // 상태=수정 요청 → 수정 요청 행만
    await user.click(screen.getByLabelText('상태 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: '수정 요청',
      }),
    )
    expect(screen.getByText('일지 보강 필요')).toBeInTheDocument()
    expect(
      screen.queryByText('추천 모델 v2 평가 지표 검토 + 다음 액션 정리'),
    ).not.toBeInTheDocument()
    // 검색 — 요지 키워드(M1 mock 더미 보존 — Figma 목록 요지와 일부 드리프트)
    await user.click(screen.getByLabelText('상태 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: '전체',
      }),
    )
    await user.type(screen.getByLabelText('팀명·일지 요지 검색'), '임베딩')
    expect(
      screen.getByText('임베딩 모델 비교 실험 결과 리뷰'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('장애 재현 시나리오 점검'),
    ).not.toBeInTheDocument()
  })

  it('?teamId= 딥링크 — 팀 필터 프리셀렉트(M1 일지 수정 진입)', () => {
    mockList({
      data: buildMentoringLogsData(),
      isPending: false,
      isError: false,
    })
    renderPage('/mentor/mentoring-logs?teamId=team_ts')
    expect(screen.getByText('장애 재현 시나리오 점검')).toBeInTheDocument()
    expect(
      screen.queryByText('추천 모델 v2 평가 지표 검토 + 다음 액션 정리'),
    ).not.toBeInTheDocument()
  })

  it('?toast=submitted — 제출 완료 토스트를 1회 표시한다', async () => {
    mockList({
      data: buildMentoringLogsData(),
      isPending: false,
      isError: false,
    })
    renderPage('/mentor/mentoring-logs?toast=submitted')
    expect(await screen.findByText(LOG_SUBMITTED_TOAST)).toBeInTheDocument()
  })

  it('비용·정산·매출 표현이 없다', () => {
    mockList({
      data: buildMentoringLogsData(),
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

  it('팀 안에서는 열기가 페이지를 옮기지 않고 그 자리에 상세를 띄운다', async () => {
    // 예전에는 /mentor/mentoring-logs/:logId 로 나가, 사이드바에서 사라진 전체 목록 위에
    // 모달이 떴다 — 팀 밖으로 튕겨 나가고 배경도 다른 팀 일지였다.
    mockList({
      data: buildMentoringLogsData(),
      isPending: false,
      isError: false,
    })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/mentor/teams/team_ts?tab=logs']}>
        <ToastProvider>
          <LogsPage embedded teamId="team_ts" />
        </ToastProvider>
      </MemoryRouter>,
    )
    const open = screen.getAllByRole('button', { name: /열기/ })[0]
    await user.click(open)
    expect(screen.getByText(/그 자리 상세 모달/)).toBeInTheDocument()
  })

  it('팀 안의 새 일지 작성은 돌아올 팀 주소를 달고 나간다', () => {
    mockList({
      data: buildMentoringLogsData(),
      isPending: false,
      isError: false,
    })
    render(
      <MemoryRouter initialEntries={['/mentor/teams/team_ts?tab=logs']}>
        <ToastProvider>
          <LogsPage embedded teamId="team_ts" />
        </ToastProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /새 일지 작성/ })).toHaveAttribute(
      'href',
      expect.stringContaining(
        `from=${encodeURIComponent('/mentor/teams/team_ts?tab=logs')}`,
      ),
    )
  })
})
