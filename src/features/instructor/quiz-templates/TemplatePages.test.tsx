import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import TemplateListPage from './TemplateListPage'
import TemplateFormPage from './TemplateFormPage'
import TemplateQuestionsPage from './TemplateQuestionsPage'
import {
  useQuizTemplates,
  useQuizTemplateDetail,
  useTemplateQuestions,
} from '../api/quizTemplates'
import type {
  QuizTemplateListData,
  QuizTemplateDetail,
  TemplateQuestionsData,
} from '@/shared/types'

vi.mock('../api/quizTemplates')

const templates: QuizTemplateListData = {
  total: 5,
  totalUseCount: 10,
  items: [
    {
      id: 'tpl-algo',
      name: '알고리즘 기초 (재귀·DP·그리디)',
      description: '4기 알고리즘 강의용 · 만점 100',
      isNew: false,
      category: '알고리즘',
      questionCount: 5,
      totalPoints: 100,
      lastUsedAt: '2026-05-17',
      useCount: 2,
    },
    {
      id: 'tpl-react',
      name: 'React Hooks 핵심',
      description: 'FE 7기 3주차 신규 작성 · 만점 100',
      isNew: true,
      category: 'React',
      questionCount: 5,
      totalPoints: 100,
      lastUsedAt: null,
      useCount: 0,
    },
  ],
}

const detail: QuizTemplateDetail = {
  id: 'tpl-algo',
  name: '알고리즘 기초 — 재귀·DP·그리디',
  category: '알고리즘',
  description: '재귀·동적 계획법·그리디 기본 개념 확인 퀴즈 풀.',
  gradingMode: 'MANUAL',
  resultReveal: 'after_grading',
  shuffleQuestions: true,
  shuffleChoices: true,
  totalPoints: 100,
  questionCount: 5,
  defaultTimeLimitMin: 60,
  createdAt: '2026-04-10',
  lastUsedAt: '2026-05-15',
  derivedActiveCount: 3,
}

const questions: TemplateQuestionsData = {
  templateName: '알고리즘 기초 템플릿',
  gradingMode: 'MANUAL',
  totalPoints: 100,
  targetPoints: 100,
  useCount: 2,
  derivedActiveCount: 3,
  questions: [
    {
      id: 'tq-1',
      order: 1,
      type: 'multiple_choice',
      points: 15,
      summary: '재귀 함수의 종료 조건',
      body: '재귀 함수의 종료 조건을 두 가지 예시와 함께 설명하시오.',
      modelAnswer: '베이스 케이스 명시.',
      explanation: '종료 조건 누락은 무한 재귀.',
      category: '알고리즘 · 재귀',
      difficulty: 'easy',
      createdAt: '2026-05-12',
      updatedAt: '2026-05-14',
      respondedCount: 0,
      totalCount: 0,
      avgScore: null,
    },
    {
      id: 'tq-3',
      order: 2,
      type: 'essay',
      points: 30,
      summary: 'DP vs 메모이제이션',
      body: 'DP와 메모이제이션의 차이를 설명하시오.',
      modelAnswer: 'Top-down vs Bottom-up.',
      explanation: '스택 오버플로 위험.',
      category: '알고리즘 · DP',
      difficulty: 'hard',
      createdAt: '2026-05-12',
      updatedAt: '2026-05-17',
      respondedCount: 0,
      totalCount: 0,
      avgScore: null,
    },
  ],
}

function ok(data: unknown) {
  return { data, isPending: false, isError: false }
}

function mockAll() {
  vi.mocked(useQuizTemplates).mockReturnValue(
    ok(templates) as unknown as ReturnType<typeof useQuizTemplates>,
  )
  vi.mocked(useQuizTemplateDetail).mockReturnValue(
    ok(detail) as unknown as ReturnType<typeof useQuizTemplateDetail>,
  )
  vi.mocked(useTemplateQuestions).mockReturnValue(
    ok(questions) as unknown as ReturnType<typeof useTemplateQuestions>,
  )
}

function renderAt(path: string, overrideMocks?: () => void) {
  mockAll()
  overrideMocks?.()
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/instructor/quiz-templates"
            element={<TemplateListPage />}
          />
          <Route
            path="/instructor/quiz-templates/new"
            element={<TemplateFormPage />}
          />
          <Route
            path="/instructor/quiz-templates/:templateId/edit"
            element={<TemplateFormPage />}
          />
          <Route
            path="/instructor/quiz-templates/:templateId/questions"
            element={<TemplateQuestionsPage />}
          />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('TemplateListPage (§10 목록)', () => {
  it('템플릿 목록·NEW 배지·사용 횟수를 렌더한다', () => {
    renderAt('/instructor/quiz-templates')
    expect(
      screen.getByText('알고리즘 기초 (재귀·DP·그리디)'),
    ).toBeInTheDocument()
    expect(screen.getByText('NEW')).toBeInTheDocument()
    expect(
      screen.getByText(/총 5개 템플릿 · 누적 사용 10회/),
    ).toBeInTheDocument()
  })

  it('사용 중 템플릿은 삭제 비활성, 미사용은 활성', () => {
    renderAt('/instructor/quiz-templates')
    const deleteButtons = screen.getAllByRole('button', { name: '삭제' })
    expect(deleteButtons[0]).toBeDisabled() // useCount 2
    expect(deleteButtons[1]).toBeEnabled() // useCount 0
  })
})

describe('TemplateFormPage (§10 생성/편집)', () => {
  it('편집 모드는 메타 strip과 소급 미반영 경고를 렌더한다', () => {
    renderAt('/instructor/quiz-templates/tpl-algo/edit')
    expect(
      screen.getByText(
        /생성 2026-04-10 · 최근 사용 2026-05-15 · 파생 활성 퀴즈 3건/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/다음 복제부터 반영됩니다/)).toBeInTheDocument()
  })

  it('생성 모드 빈 제출은 검증 에러, 메타 strip 미노출', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/quiz-templates/new', () => {
      vi.mocked(useQuizTemplateDetail).mockReturnValue(
        ok(undefined) as unknown as ReturnType<typeof useQuizTemplateDetail>,
      )
    })
    expect(screen.queryByText(/파생 활성 퀴즈/)).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: /저장 \+ 템플릿 문항/ }),
    )
    expect(
      await screen.findByText('템플릿명을 입력해주세요'),
    ).toBeInTheDocument()
  })
})

describe('TemplateQuestionsPage (§10 문항 관리)', () => {
  it('워크벤치에 템플릿 문맥(메타·안내)을 렌더한다', async () => {
    const user = userEvent.setup()
    renderAt('/instructor/quiz-templates/tpl-algo/questions')
    expect(screen.getByText('템플릿 문항 목록')).toBeInTheDocument()
    expect(screen.getByText('알고리즘 기초 템플릿')).toBeInTheDocument()
    expect(screen.getByText('· 사용 횟수: 2회')).toBeInTheDocument()
    expect(screen.getByText('· 파생 활성 퀴즈: 3건')).toBeInTheDocument()
    // 주관식 선택 시 템플릿 전용 수동 채점 안내
    await user.click(screen.getByText('DP vs 메모이제이션'))
    expect(
      screen.getByText('복제된 퀴즈에서 수동 채점으로 연결'),
    ).toBeInTheDocument()
  })
})
