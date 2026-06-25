import { http, HttpResponse } from 'msw'
import {
  QNA_CATEGORIES,
  type QnaAnswer,
  type QnaComment,
  type QnaDetail,
  type QnaListData,
  type QnaQuestion,
  type QnaStatus,
  type Tone,
} from './types'

// QnA 게시판 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// NOTE(정책): 기수 게시판은 폐기 결정(2026-05-21)됐고 BE API·Figma 시안이 없다.
// 본 mock은 FE 화면 검증 전용이며, 모듈 내 메모리 배열로 작성/답변을 세션 동안 보존한다
// (새로고침 시 시드로 복원 — 트러블슈팅 mock과 동일 정책).
const ok = <T>(data: T) => HttpResponse.json({ data })

const STATUS_META: Record<QnaStatus, { label: string; tone: Tone }> = {
  open: { label: '답변 대기', tone: 'warning' },
  answered: { label: '답변 있음', tone: 'info' },
  resolved: { label: '해결됨', tone: 'success' },
}

interface QnaRecord {
  id: string
  title: string
  content: string
  categoryKey: string
  authorName: string
  createdAt: string
  viewCount: number
  tags: string[]
  status: QnaStatus
  answers: QnaAnswer[]
}

// 모듈 메모리 시드 — 클라이언트 신규 작성/답변이 누적된다(세션 내 보존).
const store: QnaRecord[] = [
  {
    id: 'qna1',
    title: 'JPA 양방향 연관관계에서 무한 순환참조는 어떻게 끊나요?',
    content:
      '주문-회원 양방향 매핑에서 JSON 직렬화 시 StackOverflow가 발생합니다. @JsonIgnore와 DTO 변환 중 어떤 방식이 권장되나요? 실무 기준이 궁금합니다.',
    categoryKey: 'lecture',
    authorName: '김수강',
    createdAt: '2026-06-22',
    viewCount: 48,
    tags: ['#JPA', '#순환참조', '#DTO'],
    status: 'resolved',
    answers: [
      {
        id: 'a1',
        questionId: 'qna1',
        content:
          '엔티티를 직접 직렬화하지 말고 응답 전용 DTO로 변환하는 걸 권장해요. @JsonIgnore는 임시 방편이고, 양방향이 꼭 필요한 게 아니면 단방향으로 설계하는 것도 방법입니다.',
        authorName: '이멘토',
        authorRole: '멘토',
        isAccepted: true,
        createdAt: '2026-06-22',
        comments: [
          {
            id: 'c1',
            answerId: 'a1',
            content:
              '@이멘토 답변 감사합니다! DTO 변환 시 MapStruct 같은 매퍼 라이브러리도 추천하시나요?',
            authorName: '김수강',
            authorRole: '수강생',
            createdAt: '2026-06-22',
            mentions: ['이멘토'],
          },
          {
            id: 'c2',
            answerId: 'a1',
            content:
              '@김수강 네, 필드가 많아지면 MapStruct가 보일러플레이트를 크게 줄여줘요. 컴파일 타임 생성이라 런타임 비용도 없고요.',
            authorName: '이멘토',
            authorRole: '멘토',
            createdAt: '2026-06-22',
            mentions: ['김수강'],
          },
        ],
      },
      {
        id: 'a2',
        questionId: 'qna1',
        content:
          '저는 @JsonManagedReference / @JsonBackReference 조합으로 풀었는데, 결국 DTO가 유지보수에 제일 깔끔했습니다.',
        authorName: '박수강',
        authorRole: '수강생',
        isAccepted: false,
        createdAt: '2026-06-22',
        comments: [],
      },
    ],
  },
  {
    id: 'qna2',
    title: '과제 제출 후에도 채점 상태가 "대기"로 남아있어요',
    content:
      '3주차 과제를 제출했는데 하루가 지나도 채점 대기 상태입니다. 재제출을 해야 하나요, 아니면 기다리면 되나요?',
    categoryKey: 'assignment',
    authorName: '최수강',
    createdAt: '2026-06-23',
    viewCount: 21,
    tags: ['#과제', '#채점'],
    status: 'answered',
    answers: [
      {
        id: 'a3',
        questionId: 'qna2',
        content:
          '강사 채점은 영업일 기준 1~2일 소요됩니다. 재제출하면 제출 시각이 갱신되니 기다려 주세요.',
        authorName: '정강사',
        authorRole: '강사',
        isAccepted: false,
        createdAt: '2026-06-23',
        comments: [],
      },
    ],
  },
  {
    id: 'qna3',
    title: 'Docker Desktop이 M1 맥에서 자꾸 죽는데 대안이 있을까요?',
    content:
      'Docker Desktop을 켜면 메모리를 너무 먹고 자주 멈춥니다. Colima 같은 대안을 쓰는 분 계신가요?',
    categoryKey: 'env',
    authorName: '한수강',
    createdAt: '2026-06-24',
    viewCount: 12,
    tags: ['#Docker', '#M1', '#환경설정'],
    status: 'open',
    answers: [],
  },
  {
    id: 'qna4',
    title: '백엔드 신입 포트폴리오에 토이프로젝트 몇 개가 적당할까요?',
    content:
      '취업 준비 중인데, 깊이 있는 프로젝트 1개와 작은 프로젝트 여러 개 중 어느 쪽이 더 좋을지 고민입니다.',
    categoryKey: 'career',
    authorName: '오수강',
    createdAt: '2026-06-24',
    viewCount: 33,
    tags: ['#포트폴리오', '#취업', '#진로'],
    status: 'answered',
    answers: [
      {
        id: 'a4',
        questionId: 'qna4',
        content:
          '깊이 있는 1~2개를 추천합니다. 면접에서 한 프로젝트를 깊게 파고드는 질문이 많아서, 끝까지 책임지고 운영해 본 경험이 더 잘 먹혀요.',
        authorName: '이멘토',
        authorRole: '멘토',
        isAccepted: false,
        createdAt: '2026-06-24',
        comments: [],
      },
    ],
  },
]

function toQuestion(r: QnaRecord): QnaQuestion {
  const cat = QNA_CATEGORIES.find((c) => c.key === r.categoryKey)
  return {
    id: r.id,
    title: r.title,
    excerpt: r.content.length > 90 ? `${r.content.slice(0, 90)}…` : r.content,
    category: cat?.label ?? '기타',
    categoryKey: r.categoryKey,
    categoryTone: cat?.tone ?? 'warning',
    status: r.status,
    statusLabel: STATUS_META[r.status].label,
    authorName: r.authorName,
    createdAt: r.createdAt,
    answerCount: r.answers.length,
    viewCount: r.viewCount,
    tags: r.tags,
  }
}

function toDetail(r: QnaRecord): QnaDetail {
  const cat = QNA_CATEGORIES.find((c) => c.key === r.categoryKey)
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    category: cat?.label ?? '기타',
    categoryTone: cat?.tone ?? 'warning',
    status: r.status,
    statusLabel: STATUS_META[r.status].label,
    authorName: r.authorName,
    createdAt: r.createdAt,
    viewCount: r.viewCount,
    tags: r.tags,
    answers: r.answers,
  }
}

function buildList(): QnaListData {
  const total = store.length
  const resolved = store.filter((q) => q.status === 'resolved').length
  const open = store.filter((q) => q.status === 'open').length
  const answers = store.reduce((n, q) => n + q.answers.length, 0)
  const filters = [
    { key: 'all', label: '전체', count: total },
    ...QNA_CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      count: store.filter((q) => q.categoryKey === c.key).length,
    })),
  ]
  return {
    stats: [
      {
        key: 'total',
        label: '총 질문',
        value: String(total),
        unit: '건',
        sub: '기수 동료들이 올린 질문',
        tone: 'brand',
        barPct: 100,
      },
      {
        key: 'resolved',
        label: '해결됨',
        value: String(resolved),
        unit: '건',
        sub: '채택 답변이 달린 질문',
        tone: 'success',
        barPct: total ? Math.round((resolved / total) * 100) : 0,
      },
      {
        key: 'answers',
        label: '누적 답변',
        value: String(answers),
        unit: '개',
        sub: '동료·멘토·강사의 답변',
        tone: 'info',
        barPct: 70,
      },
      {
        key: 'open',
        label: '답변 대기',
        value: String(open),
        unit: '건',
        sub: '아직 답변이 없는 질문',
        tone: 'warning',
        barPct: total ? Math.round((open / total) * 100) : 0,
      },
    ],
    filters,
    statusFilters: [
      { key: 'resolved', label: '해결됨', count: resolved, tone: 'success' },
      {
        key: 'answered',
        label: '답변 있음',
        count: store.filter((q) => q.status === 'answered').length,
        tone: 'info',
      },
      { key: 'open', label: '답변 대기', count: open, tone: 'warning' },
    ],
    questions: store.map(toQuestion),
  }
}

let seq = 100

export const handlers = [
  http.get('/api/student/qna', () => ok(buildList())),

  http.get('/api/student/qna/:id', ({ params }) => {
    const id = String(params.id)
    const found = store.find((q) => q.id === id)
    if (!found)
      return HttpResponse.json({ error: 'not found' }, { status: 404 })
    found.viewCount += 1
    return ok(toDetail(found))
  }),

  http.post('/api/student/qna', async ({ request }) => {
    const body = (await request.json()) as {
      title?: string
      content?: string
      categoryKey?: string
      tags?: string[]
      authorName?: string
    }
    const id = `qna_${++seq}`
    const today = new Date().toISOString().slice(0, 10)
    const record: QnaRecord = {
      id,
      title: body.title?.trim() || '제목 없는 질문',
      content: body.content?.trim() || '',
      categoryKey: body.categoryKey || 'etc',
      authorName: body.authorName || '나',
      createdAt: today,
      viewCount: 0,
      tags: body.tags ?? [],
      status: 'open',
      answers: [],
    }
    store.unshift(record)
    return ok(toDetail(record))
  }),

  http.post('/api/student/qna/:id/answers', async ({ params, request }) => {
    const id = String(params.id)
    const found = store.find((q) => q.id === id)
    if (!found)
      return HttpResponse.json({ error: 'not found' }, { status: 404 })
    const body = (await request.json()) as {
      content?: string
      authorName?: string
    }
    const answer: QnaAnswer = {
      id: `a_${++seq}`,
      questionId: id,
      content: body.content?.trim() || '',
      authorName: body.authorName || '나',
      authorRole: '수강생',
      isAccepted: false,
      createdAt: new Date().toISOString().slice(0, 10),
      comments: [],
    }
    found.answers.push(answer)
    if (found.status === 'open') found.status = 'answered'
    return ok(toDetail(found))
  }),

  // 답변 스레드 댓글 — 2단계(답변 아래) + @멘션. 메모리 누적 후 상세 반환.
  http.post(
    '/api/student/qna/:id/answers/:answerId/comments',
    async ({ params, request }) => {
      const id = String(params.id)
      const answerId = String(params.answerId)
      const found = store.find((q) => q.id === id)
      if (!found)
        return HttpResponse.json({ error: 'not found' }, { status: 404 })
      const answer = found.answers.find((a) => a.id === answerId)
      if (!answer)
        return HttpResponse.json({ error: 'not found' }, { status: 404 })
      const body = (await request.json()) as {
        content?: string
        mentions?: string[]
        authorName?: string
      }
      const comment: QnaComment = {
        id: `c_${++seq}`,
        answerId,
        content: body.content?.trim() || '',
        authorName: body.authorName || '나',
        authorRole: '수강생',
        createdAt: new Date().toISOString().slice(0, 10),
        mentions: body.mentions ?? [],
      }
      answer.comments.push(comment)
      return ok(toDetail(found))
    },
  ),

  http.post('/api/student/qna/:id/answers/:answerId/accept', ({ params }) => {
    const id = String(params.id)
    const answerId = String(params.answerId)
    const found = store.find((q) => q.id === id)
    if (!found)
      return HttpResponse.json({ error: 'not found' }, { status: 404 })
    found.answers = found.answers.map((a) => ({
      ...a,
      isAccepted: a.id === answerId,
    }))
    found.status = 'resolved'
    return ok(toDetail(found))
  }),
]
