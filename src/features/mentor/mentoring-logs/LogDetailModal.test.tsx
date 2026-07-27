import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LogDetailModal from './LogDetailModal'
import { useMentoringLogDetail } from '../api/logs'
import { buildMentoringLogDetail } from '../mockDb'

vi.mock('../api/logs')

function mockDetail(v: unknown) {
  vi.mocked(useMentoringLogDetail).mockReturnValue(
    v as ReturnType<typeof useMentoringLogDetail>,
  )
}

function renderModal(logId: string) {
  return render(
    <MemoryRouter initialEntries={[`/mentor/mentoring-logs/${logId}`]}>
      <Routes>
        <Route
          path="/mentor/mentoring-logs/:logId"
          element={<LogDetailModal />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LogDetailModal', () => {
  it('유효 일지 — 회차·자동 유효·기본 정보·항목 답변, 수정 버튼 없음(제출 후 수정 불가)', () => {
    mockDetail({
      isPending: false,
      isError: false,
      data: buildMentoringLogDetail('log_rec_4'),
    })
    renderModal('log_rec_4')
    expect(screen.getByText('멘토링 일지 상세')).toBeInTheDocument()
    expect(screen.getByText('4회차')).toBeInTheDocument()
    expect(screen.getByText('유효')).toBeInTheDocument()
    expect(screen.getByText('유효 · 매니저 승인 완료')).toBeInTheDocument()
    // 기본 정보 — 누적/배정/잔여 + 시간 차감 자동 산정
    expect(
      screen.getByText('4회차 멘토링 · 누적 8h / 배정 N시간 12h · 잔여 4h'),
    ).toBeInTheDocument()
    expect(screen.getByText('시간 차감 자동 산정')).toBeInTheDocument()
    // 템플릿 항목 원문 답변(스냅샷 렌더링)
    expect(screen.getByText('주요 아젠다')).toBeInTheDocument()
    expect(screen.getByText(/프로젝트 전체 진행 현황/)).toBeInTheDocument()
    expect(
      screen.getByText('필수 항목 3 / 3 작성 완료 · 인정 시간 1.5h 자동 산정'),
    ).toBeInTheDocument()
    // 활동 기록 타임스탬프 — 기록 ID(UUID)는 사용자에게 의미가 없어 노출하지 않는다
    expect(screen.getByText('2장 · 타임스탬프 확인됨')).toBeInTheDocument()
    expect(screen.queryByText('log_rec_4')).not.toBeInTheDocument()
    // 제출 즉시 자동 유효 — 유효 일지엔 수정 진입 없음(정책)
    expect(screen.queryByText('일지 수정')).not.toBeInTheDocument()
    // 비용·정산·매출 표현 금지
    expect(document.body.textContent ?? '').not.toMatch(/비용|정산|매출/)
  })

  it('수정 요청 일지 — 사유 배너 + 일지 수정(재제출) 진입', () => {
    mockDetail({
      isPending: false,
      isError: false,
      data: buildMentoringLogDetail('log_ts_3'),
    })
    renderModal('log_ts_3')
    expect(
      screen.getByText('운영자 수정 요청 — 항목 답변 불충분'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /일지 수정/ })).toHaveAttribute(
      'href',
      '/mentor/mentoring-logs/new?logId=log_ts_3',
    )
  })

  it('미존재 일지 — 빈 상태를 표시한다', () => {
    mockDetail({ isPending: false, isError: true, data: undefined })
    renderModal('log_unknown')
    expect(screen.getByText('일지를 찾을 수 없어요')).toBeInTheDocument()
  })
})
