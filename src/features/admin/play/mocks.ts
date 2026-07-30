import { http, HttpResponse } from 'msw'
import type { PlayOverview, TypingPassage } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

const NOTE = '내용 미리보기 80자 기준, 수강생 입력 대상 원문'

// ── 타자 제시문 목록 (Figma 3380:7959) ──
const passages: TypingPassage[] = [
  {
    id: 'p1',
    title: '리팩터링 원칙',
    previewNote: NOTE,
    language: 'Python',
    level: '보통',
    order: 10,
    status: 'active',
  },
  {
    id: 'p2',
    title: 'HTTP 상태 코드',
    previewNote: NOTE,
    language: '영문',
    level: '쉬움',
    order: 20,
    status: 'active',
  },
  {
    id: 'p3',
    title: '데이터 파이프라인 용어',
    previewNote: NOTE,
    language: '한글',
    level: '어려움',
    order: 30,
    status: 'inactive',
  },
  {
    id: 'p4',
    title: 'SQL 윈도우 함수',
    previewNote: NOTE,
    language: '영문',
    level: '보통',
    order: 40,
    status: 'error',
  },
  {
    id: 'p5',
    title: 'API 설계 체크리스트',
    previewNote: NOTE,
    language: '한글',
    level: '쉬움',
    order: 50,
    status: 'active',
  },
]

const overview: PlayOverview = {
  summary: { active: 18, inactive: 4, error: 2, disabledCourses: 2 },
  passages,
  uploadErrorRows: 3,
  uploadValidation: [
    {
      id: 'u2',
      rowNo: 2,
      title: 'HTTP 코드',
      titleError: false,
      content: '정상',
      contentError: false,
      language: '영문',
      level: 'easy',
      result: '저장 가능',
      ok: true,
    },
    {
      id: 'u5',
      rowNo: 5,
      title: '-',
      titleError: true,
      content: '본문 있음',
      contentError: false,
      language: 'Python',
      level: 'medium',
      result: 'title 필수',
      ok: false,
    },
    {
      id: 'u9',
      rowNo: 9,
      title: 'SQL 함수',
      titleError: false,
      content: '-',
      contentError: true,
      language: '영문',
      level: 'hard',
      result: 'content 필수',
      ok: false,
    },
  ],
}

export const handlers = [
  http.get('/api/admin/play/typing-texts', () => ok<PlayOverview>(overview)),
  // 실 API(POST/PATCH) 계약과 동일한 카드 응답 — dev mock 모드에서 저장 흐름이 살아있게 한다.
  http.post('/api/admin/play/typing-texts', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      id: crypto.randomUUID(),
      title: body.title,
      previewNote: String(body.content ?? '').replace(/\s+/g, ' ').slice(0, 80),
      language: body.language,
      level: body.level,
      order: body.order ?? 0,
      status: body.active === false ? 'inactive' : 'active',
      content: body.content,
    })
  }),
  http.patch('/api/admin/play/typing-texts/:id', async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return ok({
      id: params.id,
      title: body.title,
      previewNote: String(body.content ?? '').replace(/\s+/g, ' ').slice(0, 80),
      language: body.language,
      level: body.level,
      order: body.order ?? 0,
      status: body.active === false ? 'inactive' : 'active',
      content: body.content,
    })
  }),
]
