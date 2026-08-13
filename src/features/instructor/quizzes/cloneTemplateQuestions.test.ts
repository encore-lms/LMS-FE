import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api'
import type { TemplateQuestionsData } from '@/shared/types'
import { cloneTemplateQuestions } from './cloneTemplateQuestions'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const base = {
  order: 1,
  summary: '',
  modelAnswer: '',
  explanation: '',
  category: '',
  difficulty: 'normal' as const,
  createdAt: '',
  updatedAt: '',
  respondedCount: 0,
  totalCount: 0,
  avgScore: null,
}

const pool: TemplateQuestionsData = {
  templateName: '알고리즘 기초',
  gradingMode: 'MIXED',
  totalPoints: 40,
  targetPoints: 40,
  useCount: 0,
  derivedActiveCount: 0,
  questions: [
    {
      ...base,
      id: 'tq-1',
      type: 'multiple_choice',
      points: 10,
      body: '스택의 특성은?',
      choices: ['LIFO', 'FIFO'],
      answerKey: '0',
      explanation: '후입선출.',
      category: '자료구조',
    },
    {
      ...base,
      id: 'tq-2',
      type: 'short_answer',
      points: 10,
      body: '큐 꺼내기 연산은?',
      answerKey: 'dequeue',
    },
    {
      ...base,
      id: 'tq-3',
      type: 'fill_blank',
      points: 10,
      body: '___와 ___',
      answerKey: '{"answers":["스택","큐"],"scores":[3,7]}',
    },
    {
      ...base,
      id: 'tq-4',
      type: 'essay',
      points: 10,
      body: '서술하시오.',
      modelAnswer: '채점 기준',
    },
  ],
}

describe('cloneTemplateQuestions', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.post).mockReset()
  })

  it('유형별 정답을 퀴즈 문항 계약으로 변환해 순서대로 복제하고 사용 마킹한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: pool } as never)
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} } as never)

    const r = await cloneTemplateQuestions('tpl-1', 'quiz-9')

    expect(r).toEqual({ copied: 4, skipped: 0, failed: 0, total: 4 })
    const calls = vi.mocked(apiClient.post).mock.calls
    // 문항 4개 + 사용 마킹 1회
    expect(calls).toHaveLength(5)
    expect(calls[0][0]).toBe('/instructor/quizzes/quiz-9/questions')
    expect(calls[0][1]).toMatchObject({
      type: 'multiple_choice',
      prompt: '스택의 특성은?',
      choices: ['LIFO', 'FIFO'],
      answerIndex: 0,
      category: '자료구조',
      explanation: '후입선출.',
    })
    expect(calls[1][1]).toMatchObject({ answerText: 'dequeue' })
    expect(calls[2][1]).toMatchObject({
      answers: ['스택', '큐'],
      blankScores: [3, 7],
    })
    // 서술형 채점 기준은 modelAnswer → answerText
    expect(calls[3][1]).toMatchObject({
      type: 'essay',
      answerText: '채점 기준',
    })
    expect(calls[4][0]).toBe('/instructor/quiz-templates/tpl-1/use')
  })

  it('정답 미보관 문항은 건너뛰고, 사용 마킹 실패는 무시한다', async () => {
    const legacy: TemplateQuestionsData = {
      ...pool,
      questions: [
        { ...base, id: 'x', type: 'multiple_choice', points: 10, body: '?' }, // choices 없음
        ...pool.questions.slice(1, 2),
      ],
    }
    vi.mocked(apiClient.get).mockResolvedValue({ data: legacy } as never)
    vi.mocked(apiClient.post).mockImplementation((url: string) =>
      url.endsWith('/use')
        ? Promise.reject(new Error('404'))
        : Promise.resolve({ data: {} } as never),
    )

    const r = await cloneTemplateQuestions('tpl-1', 'quiz-9')

    expect(r).toEqual({ copied: 1, skipped: 1, failed: 0, total: 2 })
  })

  // 정답 미보관과 저장 실패는 원인이 달라 안내 문구도 달라야 한다.
  it('저장이 실패한 문항은 failed로 따로 센다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: pool } as never)
    let n = 0
    vi.mocked(apiClient.post).mockImplementation((url: string) => {
      if (url.endsWith('/use')) return Promise.resolve({ data: {} } as never)
      n += 1
      return n === 2
        ? Promise.reject(new Error('500'))
        : Promise.resolve({ data: {} } as never)
    })

    const r = await cloneTemplateQuestions('tpl-1', 'quiz-9')

    expect(r).toEqual({ copied: 3, skipped: 1, failed: 1, total: 4 })
  })
})
