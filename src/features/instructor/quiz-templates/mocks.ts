import { http, HttpResponse } from 'msw'
import type {
  QuizTemplateListData,
  QuizTemplateDetail,
  TemplateQuestionsData,
} from '@/shared/types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── §10 템플릿 목록 (Figma 1354:9948) ──
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
      id: 'tpl-js',
      name: 'JS 클로저·스코프 기본',
      description: '프론트엔드 입문 4주차 표준 · 만점 80',
      isNew: false,
      category: 'JavaScript',
      questionCount: 6,
      totalPoints: 80,
      lastUsedAt: '2026-05-15',
      useCount: 4,
    },
    {
      id: 'tpl-da',
      name: '데이터 분석 입문 (CSV·정제·시각화)',
      description: 'DA 4기 1주차 진단 평가 · 만점 120',
      isNew: false,
      category: '데이터분석',
      questionCount: 6,
      totalPoints: 120,
      lastUsedAt: '2026-05-08',
      useCount: 3,
    },
    {
      id: 'tpl-sql',
      name: 'SQL JOIN 마스터',
      description: 'DA 4기 5주차 심화 · 만점 100',
      isNew: false,
      category: 'SQL',
      questionCount: 8,
      totalPoints: 100,
      lastUsedAt: '2026-04-22',
      useCount: 1,
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

// ── §10 템플릿 생성/편집 (Figma 1392:10014) ──
const templateDetails: Record<string, QuizTemplateDetail> = {
  'tpl-algo': {
    id: 'tpl-algo',
    name: '알고리즘 기초 — 재귀·DP·그리디',
    category: '알고리즘',
    description:
      '재귀·동적 계획법·그리디 기본 개념 확인 퀴즈 풀. 카테고리/배점/난이도 메타가 함께 보관됨.',
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
  },
  'tpl-react': {
    id: 'tpl-react',
    name: 'React Hooks 핵심',
    category: 'React',
    description: 'useState·useEffect·커스텀 훅 — FE 7기 3주차 신규 작성.',
    gradingMode: 'AUTO',
    resultReveal: 'immediate',
    shuffleQuestions: true,
    shuffleChoices: false,
    totalPoints: 100,
    questionCount: 5,
    defaultTimeLimitMin: 0,
    createdAt: '2026-06-08',
    lastUsedAt: null,
    derivedActiveCount: 0,
  },
}

// ── §10 템플릿 문항 관리 (Figma 3547:2247) — 퀴즈 §7과 동일 문제 풀 ──
const templateQuestions: TemplateQuestionsData = {
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
      modelAnswer: '베이스 케이스 + 범위 종료 모두 명시 = 만점.',
      explanation: '종료 조건 누락은 무한 재귀로 이어진다.',
      category: '알고리즘 · 재귀',
      difficulty: 'easy',
      createdAt: '2026-05-12',
      updatedAt: '2026-05-14',
      respondedCount: 0,
      totalCount: 0,
      avgScore: null,
    },
    {
      id: 'tq-2',
      order: 2,
      type: 'short_answer',
      points: 15,
      summary: '시간 복잡도 표기법',
      body: '최악의 경우 수행 시간을 표기하는 점근 표기법의 이름을 쓰시오.',
      modelAnswer: '빅오 표기법 (Big-O)',
      explanation: '상한 표기 — 빅오. 하한은 빅오메가, 상·하한은 빅세타.',
      category: '알고리즘 · 재귀',
      difficulty: 'easy',
      createdAt: '2026-05-12',
      updatedAt: '2026-05-12',
      respondedCount: 0,
      totalCount: 0,
      avgScore: null,
    },
    {
      id: 'tq-3',
      order: 3,
      type: 'essay',
      points: 30,
      summary: '동적 계획법 vs 메모이제이션 차이 설명',
      body: '동적 계획법(DP)과 메모이제이션의 차이를 두 가지 이상의 관점에서 설명하시오. 예시 코드를 포함해도 좋습니다.',
      modelAnswer:
        '1) 메모이제이션은 Top-down + 재귀 + 캐시 / DP는 Bottom-up + 반복문 2) 메모이제이션은 부분 문제만 캐싱 / DP는 모든 부분 문제 테이블 채움 채점: 두 관점 + 예시 코드 = 만점 30 / 한 관점 + 코드 = 부분점수 20',
      explanation:
        '메모이제이션은 직관적이지만 깊은 재귀에서 스택 오버플로 위험. DP는 공간 최적화 가능.',
      category: '알고리즘 · DP',
      difficulty: 'hard',
      createdAt: '2026-05-12',
      updatedAt: '2026-05-17',
      respondedCount: 0,
      totalCount: 0,
      avgScore: null,
    },
    {
      id: 'tq-4',
      order: 4,
      type: 'fill_blank',
      points: 20,
      summary: '그리디 알고리즘의 ___ 선택',
      body: '그리디 알고리즘은 매 단계에서 ___ 선택을 한다.',
      modelAnswer: '국소 최적(locally optimal)',
      explanation: '그리디는 국소 최적이 전역 최적이 되는 구조에서만 성립.',
      category: '알고리즘 · 재귀',
      difficulty: 'normal',
      createdAt: '2026-05-12',
      updatedAt: '2026-05-13',
      respondedCount: 0,
      totalCount: 0,
      avgScore: null,
    },
    {
      id: 'tq-5',
      order: 5,
      type: 'essay',
      points: 20,
      summary: '시간 복잡도 분석 — 다음 코드의 O(?)',
      body: '다음 코드의 시간 복잡도를 빅오 표기로 나타내고 근거를 설명하시오.\n```python\nfor i in range(n):\n    for j in range(i, n):\n        print(i, j)\n```',
      modelAnswer:
        '시간 복잡도 O(n²) + 정확한 카운팅 근거(등차수열 합) = 만점 20 / 결과만 정답 = 10 / 결과만 + 일반론 = 12',
      explanation: 'n + (n-1) + … + 1 = n(n+1)/2 → O(n²).',
      category: '알고리즘 · DP',
      difficulty: 'normal',
      createdAt: '2026-05-12',
      updatedAt: '2026-05-16',
      respondedCount: 0,
      totalCount: 0,
      avgScore: null,
    },
  ],
}

export const handlers = [
  http.get('/api/instructor/quiz-templates', () =>
    ok<QuizTemplateListData>(templates),
  ),
  // 구체 경로(questions)가 상세(:templateId)보다 먼저 매칭되도록 순서 유지.
  http.get('/api/instructor/quiz-templates/:templateId/questions', () =>
    ok<TemplateQuestionsData>(templateQuestions),
  ),
  http.get('/api/instructor/quiz-templates/:templateId', ({ params }) => {
    const detail =
      templateDetails[String(params.templateId)] ?? templateDetails['tpl-algo']
    return ok<QuizTemplateDetail>(detail)
  }),
]
