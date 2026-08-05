import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MenteeDetailPage from './MenteeDetailPage'
import { useMenteeDetail } from '../api/mentees'
import { buildMenteeDetail } from '../mockDb'
import { usePageHeaderStore } from '@/shared/store'
import { reachable } from '../routeReach'

vi.mock('../api/mentees')

function mockDetail(v: unknown) {
  vi.mocked(useMenteeDetail).mockReturnValue(
    v as ReturnType<typeof useMenteeDetail>,
  )
}

function renderPage(studentId: string) {
  return render(
    <MemoryRouter initialEntries={[`/mentor/mentees/${studentId}`]}>
      <Routes>
        <Route
          path="/mentor/mentees/:studentId"
          element={<MenteeDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MenteeDetailPage', () => {
  it('추천 대상 학생 — 히어로·평가 5축·추천 카드·참석 이력(조회 전용)', () => {
    mockDetail({
      isPending: false,
      isError: false,
      data: buildMenteeDetail('stu_han_y'),
    })
    renderPage('stu_han_y')
    expect(usePageHeaderStore.getState().title).toBe('수강생 상세')
    // 히어로 + 권한 칩
    expect(screen.getByText('한예린')).toBeInTheDocument()
    expect(screen.getByText('STUDENT DETAIL · 멘토 관점')).toBeInTheDocument()
    expect(screen.getByText('배정 팀 팀원 한정 조회')).toBeInTheDocument()
    // 노출 범위 안내 원문
    expect(
      screen.getByText('멘토에게 노출되는 수강생 정보 범위'),
    ).toBeInTheDocument()
    expect(screen.getByText(/HRD-Net 출결/)).toBeInTheDocument()
    // 평가 4축 — 고정 축 + 평균
    expect(screen.getByText('멘토 평가 4축')).toBeInTheDocument()
    expect(screen.getByText('4.8')).toBeInTheDocument()
    for (const axis of [
      '기술/기술기여',
      '소통·협업·팀워크',
      '문제해결',
      '책임감',
    ]) {
      expect(screen.getByText(axis)).toBeInTheDocument()
    }
    expect(screen.getByText('멘토 코멘트')).toBeInTheDocument()
    // 추천 카드 — 팀당 1명 추천 정책
    expect(screen.getByText('추천 확정')).toBeInTheDocument()
    expect(
      screen.getByText(
        '팀당 1명 추천 정책에 따라 본 수강생이 추천 대상으로 선정됨',
      ),
    ).toBeInTheDocument()
    // 참석 이력 — 제출 일지 파생(인정 완료 칩)
    expect(screen.getByText('멘토링 참석 이력')).toBeInTheDocument()
    expect(screen.getAllByText('인정 완료')).toHaveLength(4)
    // 하단 액션 — 평가·추천 페이지로 이동(조회 전용 화면)
    expect(
      screen.getByText(
        '수강생 상세는 조회 전용 화면이며, 변경은 평가/추천 단계에서 처리합니다',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /평가로 이동/ })).toHaveAttribute(
      'href',
      '/mentor/teams/team_nlp?tab=evaluation',
    )
    expect(screen.getByRole('link', { name: /추천으로 이동/ })).toHaveAttribute(
      'href',
      '/mentor/teams/team_nlp?tab=evaluation',
    )
  })

  it('평가 전 학생 — 평가·추천 카드 대신 빈 상태를 표시한다', () => {
    mockDetail({
      isPending: false,
      isError: false,
      data: buildMenteeDetail('stu_kim'),
    })
    renderPage('stu_kim')
    expect(screen.getByText('김수강')).toBeInTheDocument()
    expect(screen.getByText('아직 제출한 평가가 없어요')).toBeInTheDocument()
    expect(screen.queryByText('추천 확정')).not.toBeInTheDocument()
  })

  it('비용·정산·매출 표현이 없다', () => {
    mockDetail({
      isPending: false,
      isError: false,
      data: buildMenteeDetail('stu_han_y'),
    })
    const { container } = renderPage('stu_han_y')
    expect(container.textContent ?? '').not.toMatch(/비용|정산|매출/)
  })

  it('로딩·에러(미배정 학생) 상태를 표시한다', () => {
    mockDetail({ isPending: true })
    const { unmount } = renderPage('stu_unknown')
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
    unmount()
    mockDetail({ isPending: false, isError: true, refetch: vi.fn() })
    renderPage('stu_unknown')
    expect(
      screen.getByText('배정 팀의 팀원만 조회할 수 있어요.'),
    ).toBeInTheDocument()
  })

  it('그리는 모든 링크가 살아 있는 라우트를 가리킨다', () => {
    // 화면을 걷어낼 때 링크를 함께 훑지 않으면 '찾을 수 없는 주소'로 떨어진다(2026-08-04).
    mockDetail({
      isPending: false,
      isError: false,
      data: buildMenteeDetail('stu_han_y'),
    })
    const { container } = renderPage('stu_han_y')
    const dead = [...container.querySelectorAll('a')]
      .map((a) => a.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('/mentor'))
      .filter((href) => !reachable(href))
    expect(dead).toEqual([])
  })
})
