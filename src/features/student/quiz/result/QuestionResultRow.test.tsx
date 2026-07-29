import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { QuizAnswer } from '@/shared/types'
import { QuestionResultRow } from './QuestionResultRow'

// 답안 payload 는 BE 계약(kind 유니온)에 의존한다. 계약이 깨져도 결과 화면 전체가
// 죽지 않아야 한다 — 예전에는 kind 없는 주관식이 빈칸 분기로 떨어져 undefined.join() 으로
// 페이지가 통째로 렌더되지 않았다.
const base: QuizAnswer = {
  questionId: 'q1',
  prompt: '옵티마이저 이름은?',
  categoryId: 'DataFrame',
  maxPoints: 25,
  answer: { kind: 'short_answer', text: 'Catalyst' },
  correctAnswerKey: 'Catalyst',
  earnedPoints: 25,
  isCorrect: true,
}

describe('QuestionResultRow', () => {
  it('주관식 답안을 그대로 보여준다', () => {
    render(<QuestionResultRow num={1} answer={base} />)
    // 내 답안 + 정답 두 곳에 같은 값이 나온다
    expect(screen.getAllByText('Catalyst')).toHaveLength(2)
    expect(screen.getByText('단답')).toBeInTheDocument()
  })

  it('빈칸 답안을 칸별 격자로 보여준다', () => {
    render(
      <QuestionResultRow
        num={2}
        answer={{
          ...base,
          answer: { kind: 'fill_blank', answers: ['스택', '큐'] },
          correctAnswerKey: ['스택', '큐'],
        }}
      />,
    )
    // 빈칸은 칸별 격자로 렌더된다(내 답 → 정답)
    expect(screen.getByText('빈칸 1')).toBeInTheDocument()
    expect(screen.getByText('빈칸 2')).toBeInTheDocument()
    expect(screen.getAllByText('스택')).not.toHaveLength(0)
    expect(screen.getAllByText('큐')).not.toHaveLength(0)
  })

  it('kind 가 유니온에 없어도 렌더가 죽지 않는다', () => {
    const broken = {
      ...base,
      // 구 BE 응답 — kind 없이 제출 payload 를 그대로 내려주던 형태
      answer: { text: 'Catalyst' },
    } as unknown as QuizAnswer
    render(<QuestionResultRow num={3} answer={broken} />)
    expect(screen.getByText('옵티마이저 이름은?')).toBeInTheDocument()
  })

  it('answers 가 비어 있어도 렌더가 죽지 않는다', () => {
    const broken = {
      ...base,
      answer: { kind: 'fill_blank' },
    } as unknown as QuizAnswer
    render(<QuestionResultRow num={4} answer={broken} />)
    expect(screen.getByText('옵티마이저 이름은?')).toBeInTheDocument()
  })
})
