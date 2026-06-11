import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import StudentDetailPage from './StudentDetailPage'
import { useStudentDetail } from '../api/console'
import type { StudentDetailData } from '@/shared/types'

vi.mock('../api/console')

const detail: StudentDetailData = {
  id: 'stu-2',
  name: '이서연',
  uuidEmail: 'def-5678 · lee.sy@playdata.io',
  cohortLabel: 'DA 4기',
  certStatus: 'reviewing',
  kpis: [
    { label: '교육시간', value: '512h', hint: '인정 시간 기준' },
    { label: '출석률', value: '96.2%', hint: 'HRD-Net 기준' },
    { label: '퀴즈 평균', value: '84.7', hint: '전체 14건' },
    { label: '제출률', value: '93%', hint: '13 / 14 제출' },
  ],
  skillScores: [
    { label: '기술', score: 82 },
    { label: '책임', score: 76 },
    { label: '소통', score: 88 },
    { label: '성장', score: 79 },
    { label: '팀워크', score: 84 },
    { label: '문해', score: 81 },
  ],
  warningLine1: '결측 0 · 점수 재검토 0',
  warningLine2: '개인정보 위험 0 · 미승인 0',
  reviewComment: '6축 점수 전반 안정. (2026-05-17 황설현)',
  supplements: [
    {
      id: 'sup-1',
      date: '2026-05-16',
      status: 'responded',
      code: 'unapproved_artifact',
      category: '프로젝트',
    },
    {
      id: 'sup-2',
      date: '2026-05-10',
      status: 'waiting',
      code: 'score_review_needed',
      category: '점수',
    },
  ],
  tabs: {
    quiz: {
      title: '퀴즈 제출·채점 이력',
      summary: '전체 14건 · 채점 대기 2건 · 평균 84.7',
      ctaLabel: '퀴즈 관리로 →',
      ctaTo: '/instructor/quizzes',
      items: [
        {
          id: 'sdq-1',
          title: '알고리즘 기초 #3',
          subtitle: '제출 2026-05-17',
          value: null,
          statusLabel: '채점 대기',
          statusTone: 'warning',
          actionLabel: '채점',
          to: '/instructor/quizzes/quiz-algo-3/submissions/sub-2/grade',
        },
        {
          id: 'sdq-2',
          title: '데이터 정제 실습',
          subtitle: '제출 2026-05-15',
          value: '92/100',
          statusLabel: '채점 완료',
          statusTone: 'success',
          actionLabel: '결과',
          to: null,
        },
      ],
    },
    records: {
      title: '기록실 승인 이력',
      summary: '승인 12 · 대기 1 · 반려 0',
      ctaLabel: '검토 화면으로 →',
      ctaTo: null,
      items: [
        {
          id: 'sdr-1',
          title: '회고 블로그 #12',
          subtitle: '제출 2026-05-16 · 블로그',
          value: null,
          statusLabel: '승인 대기',
          statusTone: 'warning',
          actionLabel: '보기',
          to: null,
        },
      ],
    },
    projects: {
      title: '프로젝트 참여 현황',
      summary: '진행 1 · 인증 완료 1',
      ctaLabel: '프로젝트 검토로 →',
      ctaTo: null,
      items: [],
    },
    troubleshooting: {
      title: '트러블슈팅 사례',
      summary: '등록 2 · 승인 대기 1',
      ctaLabel: '트러블슈팅 검토로 →',
      ctaTo: null,
      items: [],
    },
    endorsements: {
      title: '강사 추천서',
      summary: '작성 1 · 스냅샷 반영 1',
      ctaLabel: '추천서 관리로 →',
      ctaTo: '/instructor/endorsements',
      items: [],
    },
  },
}

function renderPage() {
  vi.mocked(useStudentDetail).mockReturnValue({
    data: detail,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useStudentDetail>)
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/instructor/students/stu-2']}>
        <Routes>
          <Route
            path="/instructor/students/:studentId"
            element={<StudentDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('StudentDetailPage (§4)', () => {
  it('학생 정보 strip·KPI 4·6축·경고 플래그를 렌더한다', () => {
    renderPage()
    expect(screen.getByText('이서연')).toBeInTheDocument()
    expect(
      screen.getByText('def-5678 · lee.sy@playdata.io'),
    ).toBeInTheDocument()
    expect(screen.getByText('검토 중')).toBeInTheDocument()
    expect(screen.getByText('512h')).toBeInTheDocument()
    expect(screen.getByText('6축 점수 (SkillScore)')).toBeInTheDocument()
    expect(screen.getByText('팀워크')).toBeInTheDocument()
    expect(screen.getByText('결측 0 · 점수 재검토 0')).toBeInTheDocument()
  })

  it('퀴즈 탭 기본 — 채점 대기 행과 액션을 렌더한다', () => {
    renderPage()
    expect(screen.getByText('퀴즈 제출·채점 이력')).toBeInTheDocument()
    expect(screen.getByText('알고리즘 기초 #3')).toBeInTheDocument()
    expect(screen.getByText('채점 대기')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '채점' })).toBeInTheDocument()
    expect(screen.getByText('92/100')).toBeInTheDocument()
  })

  it('탭 전환 시 해당 탭 콘텐츠로 바뀐다', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /기록실/ }))
    expect(screen.getByText('기록실 승인 이력')).toBeInTheDocument()
    expect(screen.getByText('회고 블로그 #12')).toBeInTheDocument()
    expect(screen.queryByText('알고리즘 기초 #3')).not.toBeInTheDocument()
  })

  it('검토 코멘트는 비공개 안내와 보완 요청 이력을 함께 보여준다', () => {
    renderPage()
    expect(
      screen.getByText('학생에게 비공개 · 운영자/강사만 조회'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('검토 코멘트')).toHaveValue(
      '6축 점수 전반 안정. (2026-05-17 황설현)',
    )
    expect(screen.getByText('unapproved_artifact')).toBeInTheDocument()
    expect(screen.getByText('학생 응답 대기')).toBeInTheDocument()
  })
})
