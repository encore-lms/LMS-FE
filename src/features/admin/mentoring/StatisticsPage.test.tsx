import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import StatisticsPage from './StatisticsPage'
import { useMentoringStatistics } from './api'
import type { AdminMentoringStatisticsData } from './types'
import { useMyCohorts } from '../api/dashboard'

vi.mock('./api')
vi.mock('../api/dashboard')

// 멘토 통계 — 조회 전용 렌더 검증(§33). 요약·행 라벨·읽기 전용 문구 노출 +
// 수정·변경 요청·보정 액션 부재 + 필터 동작.

const stats: AdminMentoringStatisticsData = {
  summary: {
    in_progress: 1,
    log_needed: 0,
    change_requested: 1,
    evaluation_needed: 0,
    completed: 1,
  },
  rows: [
    {
      assignmentId: 'asgn_dm',
      teamId: 'team_dm',
      teamName: '데이터마트 팀',
      mentorId: 'mentor_lim',
      mentorName: '임수현',
      courseName: '데이터 분석',
      cohortLabel: 'DA 4기',
      allocatedHours: 10,
      recognizedHours: 10,
      logCount: 4,
      changeRequestCount: 0,
      teamStatus: 'completed',
      evaluation: 'submitted',
      recommendation: 'recommended',
      certificate: 'reflected',
      earlyEnded: false,
    },
    {
      assignmentId: 'asgn_ts',
      teamId: 'team_ts',
      teamName: '트러블슈팅 팀',
      mentorId: 'mentor_kim',
      mentorName: '김효원',
      courseName: 'AI 캠프',
      cohortLabel: 'AI 5기',
      allocatedHours: 8,
      recognizedHours: 3.5,
      logCount: 3,
      changeRequestCount: 1,
      teamStatus: 'change_requested',
      evaluation: 'not_eligible',
      recommendation: 'pending',
      certificate: 'not_target',
      earlyEnded: false,
    },
  ],
}

function renderPage() {
  vi.mocked(useMyCohorts).mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof useMyCohorts>)
  vi.mocked(useMentoringStatistics).mockReturnValue({
    data: stats,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useMentoringStatistics>)
  return render(
    <MemoryRouter>
      <StatisticsPage scopeCohortId="cohort-ai-5" />
    </MemoryRouter>,
  )
}

describe('StatisticsPage (조회 전용)', () => {
  it('현재 기수를 통계 API에 명시한다', () => {
    renderPage()

    expect(useMentoringStatistics).toHaveBeenCalledWith('cohort-ai-5')
  })

  it('상태 요약 5종 + 조회 전용 캡션 + 비공개 기준을 렌더한다', () => {
    renderPage()
    // 요약 라벨은 팀 상태 필터 option 에도 등장 — 요약 카드 스코프(span)로 조회
    expect(
      screen.getByText('진행 중', { selector: 'span' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('일지 필요', { selector: 'span' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '상태는 조회용입니다. 평가·추천 원문 수정, 변경 요청, 직접 보정 액션은 제공하지 않습니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('비공개 기준')).toBeInTheDocument()
    expect(
      screen.getByText(
        '수강생별 5축 평균, 추천 여부, 증명서용 요약만 조회합니다. 5축 원점수와 멘토 원문 코멘트는 통계 화면에 노출하지 않습니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('내부 사용자 전용')).toBeInTheDocument()
  })

  it('멘토/팀 행 — N시간·인정·일지·평가·추천·증명서 반영 라벨을 렌더한다', () => {
    renderPage()
    expect(screen.getByText('임수현 / 데이터마트 팀')).toBeInTheDocument()
    expect(
      screen.getByText('10h', { selector: '.text-brand' }),
    ).toBeInTheDocument()
    expect(screen.getByText('평가 완료 · 추천')).toBeInTheDocument()
    expect(screen.getByText('스냅샷 반영 완료')).toBeInTheDocument()
    expect(screen.getByText('김효원 / 트러블슈팅 팀')).toBeInTheDocument()
    // 'N시간 미달'은 평가 상태 필터 option 에도 등장 — 배지(span) 스코프로 조회
    expect(
      screen.getByText('N시간 미달', { selector: 'span' }),
    ).toBeInTheDocument()
    expect(screen.getByText('대상 외')).toBeInTheDocument()
  })

  it('조회 전용 — 수정·변경 요청·보정·푸시 버튼이 없다', () => {
    renderPage()
    expect(screen.getByText('조회 전용')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /수정/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /변경 요청/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /보정/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /푸시/ })).toBeNull()
  })

  it('멘토 필터 — 선택 시 다른 멘토 행이 사라진다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('멘토 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: '김효원',
      }),
    )
    expect(screen.queryByText('임수현 / 데이터마트 팀')).toBeNull()
    expect(screen.getByText('김효원 / 트러블슈팅 팀')).toBeInTheDocument()
    expect(screen.getByText('총 2팀 · 표시 1팀')).toBeInTheDocument()
  })
})
