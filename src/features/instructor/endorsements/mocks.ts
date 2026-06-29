import { http, HttpResponse } from 'msw'
import type {
  Endorsement,
  EndorsementHistory,
  EndorsementQueue,
} from '@/shared/types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
// 강사 추천서 3화면(목록·상세·전체보기) 대표 데이터. (Figma 2117/2141/2149)
const ok = <T>(data: T) => HttpResponse.json({ data })

const queue: EndorsementQueue = {
  cohort: 'DA 4기',
  instructor: '김강사',
  pending: [
    {
      student: {
        id: 'st_yerin',
        name: '최예린',
        cohort: 'DA 4기',
        track: '데이터 분석',
      },
      observationMonths: 4,
      dueDays: 3,
    },
    {
      student: {
        id: 'st_dohyun',
        name: '윤도현',
        cohort: 'FE 7기',
        track: '프론트엔드',
      },
      observationMonths: 5,
      dueDays: 7,
    },
    {
      student: {
        id: 'st_seoyun',
        name: '강서윤',
        cohort: 'BE 9기',
        track: '백엔드',
      },
      observationMonths: 3,
      dueDays: 12,
    },
  ],
  recentTotal: 18,
  recent: [
    {
      id: 'en_jeongminseo',
      student: { id: 'st_jeongminseo', name: '정민서', cohort: 'DA 4기' },
      summary: '모델링 근거 정리',
      comment:
        '정민서는 가설을 세우고 근거를 정량적으로 정리하는 데 강점이 있었습니다. 모델 비교 과정에서 평가 지표 선택 이유를 명확히 설명했습니다.',
      createdAt: '2026-05-12',
      snapshotStatus: 'snapshot_applied',
    },
    {
      id: 'en_hanjiwon',
      student: { id: 'st_hanjiwon', name: '한지원', cohort: 'DA 4기' },
      summary: 'SQL 응용 이해 입증',
      comment:
        '한지원은 SQL 응용 문제를 꾸준히 풀며 윈도우 함수와 인덱스 설계를 실무 수준으로 이해했습니다.',
      createdAt: '2026-05-08',
      snapshotStatus: 'pending_certification',
    },
    {
      id: 'en_oseohyun',
      student: { id: 'st_oseohyun', name: '오세현', cohort: 'DA 4기' },
      summary: '발표 근거 정량 제시',
      comment:
        '오세현은 중간 발표에서 모델 선택 근거를 정량적으로 제시했고, 팀 피드백을 반영해 워크플로를 개선했습니다.',
      createdAt: '2026-04-29',
      snapshotStatus: 'pending_refresh',
    },
    {
      id: 'en_munseoyun',
      student: { id: 'st_munseoyun', name: '문서윤', cohort: 'DA 4기' },
      summary: 'PCA 지표 선택 설명',
      comment:
        '문서윤은 차원 축소 과정에서 PCA 지표 선택 근거를 명확히 설명하고 트레이드오프를 정리했습니다.',
      createdAt: '2026-04-21',
      snapshotStatus: 'snapshot_applied',
    },
  ],
}

const history: EndorsementHistory = {
  stats: { total: 14, thisMonth: 3, snapshotApplied: 8, pendingRefresh: 2 },
  items: [
    mk(
      '박지훈',
      '모델링 근거 정리',
      '2026-05-17',
      'pending_refresh',
      14 * 60 + 23,
    ),
    mk('김서연', '피드백 수용 관찰', '2026-05-17', 'snapshot_applied'),
    mk('이준영', '발표 근거 정량 제시', '2026-05-16', 'pending_certification'),
    mk('최유진', 'PCA 지표 선택', '2026-05-15', 'snapshot_applied'),
    mk('정민호', '설계 가설 보강 필요', '2026-05-15', 'pending_refresh'),
    mk('한지원', 'SQL 응용 이해 입증', '2026-05-12', 'snapshot_applied'),
  ],
}

function mk(
  name: string,
  summary: string,
  createdAt: string,
  snapshotStatus: Endorsement['snapshotStatus'],
  editableUntilMinutes?: number,
): Endorsement {
  const id = `en_${createdAt.replace(/-/g, '')}_${name}`
  return {
    id,
    student: {
      id: `st_${name}`,
      name,
      cohort: 'DA 4기',
      track: '데이터 분석',
      email: `${name}@playdata.io`,
    },
    summary,
    comment: `${name}은(는) ${summary}에서 강점을 보였습니다. 구체적 사례 기반으로 본인 언어로 설계 근거를 정리했고, 팀 협업에서도 트레이드오프를 정리해 공유했습니다. 입사 후 해당 직무에서 즉시 기여할 수 있는 수준으로 판단합니다.`,
    createdAt,
    snapshotStatus,
    editableUntilMinutes,
  }
}

// id로 1건 조회 — queue.recent + history.items 합쳐서 탐색, 없으면 history 첫 건.
const byId = (id: string): Endorsement =>
  [...queue.recent.map(toDetail), ...history.items].find((e) => e.id === id) ??
  history.items[0]

function toDetail(e: Endorsement): Endorsement {
  return {
    ...e,
    student: {
      ...e.student,
      track: e.student.track ?? '데이터 분석',
      email: e.student.email ?? `${e.student.name}@playdata.io`,
    },
    editableUntilMinutes: e.editableUntilMinutes ?? 14 * 60 + 23,
  }
}

// 코멘트 첫 줄을 목록/전체 보기 요약(summary)으로 축약.
function summarize(comment: string): string {
  const firstLine = comment.trim().split('\n')[0] ?? ''
  return firstLine.length > 18 ? `${firstLine.slice(0, 18)}…` : firstLine
}

export const handlers = [
  http.get('/api/instructor/endorsements/history', () =>
    ok<EndorsementHistory>(history),
  ),
  http.get('/api/instructor/endorsements/:id', ({ params }) =>
    ok<Endorsement>(byId(String(params.id))),
  ),
  http.get('/api/instructor/endorsements', () => ok<EndorsementQueue>(queue)),

  // 제출 — 작성 대기에서 제거, 최근/전체 보기에 추가. (mock 상태는 새로고침 시 초기화)
  http.post('/api/instructor/endorsements', async ({ request }) => {
    const body = (await request.json()) as {
      studentId: string
      comment: string
    }
    const p = queue.pending.find((x) => x.student.id === body.studentId)
    const today = new Date().toISOString().slice(0, 10)
    const created: Endorsement = {
      id: `en_${Date.now()}`,
      student: {
        id: body.studentId,
        name: p?.student.name ?? '학생',
        cohort: p?.student.cohort ?? queue.cohort,
        track: p?.student.track,
        email: p ? `${p.student.name}@playdata.io` : undefined,
      },
      summary: summarize(body.comment),
      comment: body.comment,
      createdAt: today,
      snapshotStatus: 'pending_certification',
      editableUntilMinutes: 24 * 60,
    }
    queue.pending = queue.pending.filter((x) => x.student.id !== body.studentId)
    queue.recent = [created, ...queue.recent]
    queue.recentTotal += 1
    history.items = [created, ...history.items]
    history.stats = {
      ...history.stats,
      total: history.stats.total + 1,
      thisMonth: history.stats.thisMonth + 1,
    }
    return ok<Endorsement>(created)
  }),

  // 수정 — 코멘트/요약 갱신 + 최신화 대기로 전환.
  http.patch(
    '/api/instructor/endorsements/:id',
    async ({ params, request }) => {
      const id = String(params.id)
      const body = (await request.json()) as { comment: string }
      const apply = (e: Endorsement): Endorsement =>
        e.id === id
          ? {
              ...e,
              comment: body.comment,
              summary: summarize(body.comment),
              snapshotStatus: 'pending_refresh',
            }
          : e
      queue.recent = queue.recent.map(apply)
      history.items = history.items.map(apply)
      return ok<Endorsement>(byId(id))
    },
  ),

  // 삭제 — 최근/전체 보기에서 제거.
  http.delete('/api/instructor/endorsements/:id', ({ params }) => {
    const id = String(params.id)
    const existed =
      queue.recent.some((e) => e.id === id) ||
      history.items.some((e) => e.id === id)
    queue.recent = queue.recent.filter((e) => e.id !== id)
    history.items = history.items.filter((e) => e.id !== id)
    if (existed) {
      queue.recentTotal = Math.max(0, queue.recentTotal - 1)
      history.stats = {
        ...history.stats,
        total: Math.max(0, history.stats.total - 1),
      }
    }
    return HttpResponse.json({ data: null })
  }),
]
