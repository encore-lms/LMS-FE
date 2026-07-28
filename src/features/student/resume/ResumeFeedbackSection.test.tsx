import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ResumeFeedbackItem } from '@/features/admin/education/types'
import { ResumeFeedbackSection } from './ResumeFeedbackSection'

// 수강생은 받은 피드백을 읽기만 한다 — 작성·삭제는 강사·운영만 BE가 허용한다.
// onSubmit 을 넘기지 않으면 읽기 전용으로 동작해야 한다.
const feedbacks: ResumeFeedbackItem[] = [
  {
    id: 'f1',
    authorUserId: 'u1',
    authorName: '김강사',
    body: '프로젝트 성과를 수치로 덧붙이면 더 좋겠습니다.',
    createdAt: '2026-07-28T01:00:00Z',
  },
]

describe('ResumeFeedbackSection', () => {
  it('읽기 전용이면 작성 폼과 삭제 버튼을 렌더하지 않는다', () => {
    render(<ResumeFeedbackSection feedbacks={feedbacks} />)
    expect(screen.getByText('김강사')).toBeInTheDocument()
    expect(
      screen.getByText('프로젝트 성과를 수치로 덧붙이면 더 좋겠습니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('피드백을 입력하세요')).toBeNull()
    expect(screen.queryByRole('button', { name: '피드백 삭제' })).toBeNull()
  })

  it('읽기 전용 빈 상태는 수강생 관점 문구를 보여준다', () => {
    render(<ResumeFeedbackSection feedbacks={[]} />)
    expect(screen.getByText(/아직 받은 피드백이 없어요/)).toBeInTheDocument()
  })

  it('작성 핸들러를 넘기면 작성 폼과 삭제 버튼이 나온다', () => {
    render(
      <ResumeFeedbackSection
        feedbacks={feedbacks}
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onDelete={vi.fn()}
        canDelete={() => true}
      />,
    )
    expect(
      screen.getByPlaceholderText('피드백을 입력하세요'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '피드백 삭제' }),
    ).toBeInTheDocument()
  })
})
