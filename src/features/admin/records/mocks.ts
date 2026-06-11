import { http, HttpResponse } from 'msw'
import type {
  RecordReviewActionRequest,
  RecordReviewItem,
  RecordReviewQueue,
} from '@/shared/types'
import {
  recordCategoryFromSegment,
  type RecordSubmissionDetailView,
} from './detailMeta'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
// 상태형 mock: 승인/반려/보완 POST가 모듈 레벨 상태를 실제로 바꿔 큐 GET에 반영된다.
const ok = <T>(data: T) => HttpResponse.json({ data })

// Figma "운영 — 학습 기록 검토 큐"(1507:10816) 대표 데이터.
const initialItems: RecordReviewItem[] = [
  {
    id: 'rr_blog_minjune',
    student: { name: '김민준', cohort: '22기' },
    category: 'blog',
    title: 'Airflow 분산 트레이싱 장애 회고',
    summary: 'DAG 실패 원인 추적과 재시도 전략',
    externalUrl: 'velog.io/@minjune/airflow-tracing-incident',
    body: [
      '문제 — 야간 ETL DAG가 갑자기 17회 연속 실패. Airflow 로그만으로 원인 추적이 어려웠고, 외부 RDS 메트릭과 시간대가 맞지 않아 트레이싱이 끊겨 있었음.',
      '해결 — Airflow Task 단위로 X-Trace-Id 주입 + RDS 로그 시간대를 UTC로 통일. 재시도 정책을 exponential backoff로 변경해 일시 장애를 분리.',
    ],
    submittedAt: '2026-05-19 09:42',
    status: 'pending',
    noteCount: 2,
    instructorNote: {
      instructor: '김지훈 강사',
      at: '05-19 10:14',
      body: '실제 인시던트 회고로 구체적 — 회고 양식·재시도 정책 변경 근거가 잘 정리됨. 승인 권장.',
    },
    attachments: [
      { name: 'airflow-trace-flow.png', meta: 'PNG · 480 KB' },
      { name: 'airflow_dag_retry_policy.yaml', meta: 'YAML · 3 KB' },
    ],
  },
  {
    id: 'rr_study_seoyeon',
    student: { name: '이서연', cohort: '22기' },
    category: 'study',
    title: 'NestJS 12주 스터디 — 7주차',
    summary: 'GraphQL Code-first 패턴 정리 발표',
    body: [
      '활동 내용 — 7주차 주제는 GraphQL Code-first. 데코레이터 기반 스키마 선언과 Resolver 분리 패턴을 정리하고, 팀 4명이 각자 모듈을 맡아 코드 리뷰를 진행함.',
      '결과 — 발표 자료 + 예제 레포 정리. 참석자 4명 중 4명 인증 완료.',
    ],
    submittedAt: '2026-05-19 08:18',
    status: 'pending',
    noteCount: 1,
    instructorNote: {
      instructor: '박서준 강사',
      at: '05-19 09:02',
      body: '스터디 운영이 꾸준함 — 발표 자료 충실. 승인 적절.',
    },
    attachments: [
      { name: 'graphql-codefirst-deck.pdf', meta: 'PDF · 2.1 MB' },
      { name: 'study-7w-photo.jpg', meta: 'JPG · 1.4 MB' },
    ],
  },
  {
    id: 'rr_cert_jihoon',
    student: { name: '박지훈', cohort: '22기' },
    category: 'certificate',
    title: '정보처리기사 — 자격증 등록 요청',
    summary: '실기 합격 발표 / 지급 후보',
    body: [
      '자격명 — 정보처리기사(실기) · 응시자 박지훈',
      '취득 — 2026-05-16 합격 발표 · 한국산업인력공단',
      '정책 확인 — 허용 자격증이며 중복 제출 이력 없음. 승인 시 기록실과 마일리지 후보에 반영.',
    ],
    submittedAt: '2026-05-18 17:30',
    status: 'pending',
    noteCount: 3,
    instructorNote: {
      instructor: '김지훈 강사',
      at: '05-18 18:05',
      body: '증빙 명확 — 합격 발표 캡처와 응시자 일치. 승인 권장.',
    },
    attachments: [{ name: 'jeongbo-pass.png', meta: 'PNG · 320 KB' }],
    mileageCandidate: '지급 후보 +15,000',
  },
  {
    id: 'rr_blog_yujin',
    student: { name: '최유진', cohort: '22기' },
    category: 'blog',
    title: 'LangGraph 멀티 에이전트 패턴',
    summary: 'Intent → QA/Recommend 분기 설계',
    externalUrl: 'velog.io/@yujin/langgraph-multi-agent',
    body: [
      '문제 — 단일 프롬프트로 QA와 추천을 동시에 처리하니 응답 품질이 들쭉날쭉했음.',
      '해결 — Intent 분류 노드를 두고 QA/Recommend 서브그래프로 분기. 상태 공유는 TypedDict로 고정.',
    ],
    submittedAt: '2026-05-18 14:11',
    status: 'changes_requested',
    noteCount: 0,
    attachments: [],
  },
  {
    id: 'rr_blog_haneul',
    student: { name: '정하늘', cohort: '22기' },
    category: 'blog',
    title: 'Pandas 메모리 최적화 정리',
    summary: 'category dtype + chunksize 활용',
    externalUrl: 'velog.io/@haneul/pandas-memory',
    body: [
      '문제 — 800만 행 CSV를 read_csv로 한 번에 올리니 메모리 초과.',
      '해결 — category dtype 지정 + chunksize 스트리밍 + usecols로 필요한 열만 로드해 메모리 60% 절감.',
    ],
    submittedAt: '2026-05-17 22:08',
    status: 'pending',
    noteCount: 1,
    instructorNote: {
      instructor: '박서준 강사',
      at: '05-18 09:30',
      body: '실측 수치가 있어 설득력 있음. 승인 권장.',
    },
    attachments: [{ name: 'pandas-bench.png', meta: 'PNG · 210 KB' }],
  },
  {
    id: 'rr_cert_jiho',
    student: { name: '한지호', cohort: '22기' },
    category: 'certificate',
    title: 'SQLD — 자격증 등록 요청',
    summary: '실기 통과 / 지급 후보',
    body: [
      '자격명 — SQLD(SQL 개발자) · 응시자 한지호',
      '취득 — 2026-05-15 · 한국데이터산업진흥원',
      '정책 확인 — 허용 자격증, 중복 없음. 승인 시 마일리지 후보 생성.',
    ],
    submittedAt: '2026-05-17 19:42',
    status: 'pending',
    noteCount: 2,
    instructorNote: {
      instructor: '김지훈 강사',
      at: '05-17 20:10',
      body: '자격 요건 충족 — 승인 권장.',
    },
    attachments: [{ name: 'sqld-cert.png', meta: 'PNG · 290 KB' }],
    mileageCandidate: '지급 후보 +10,000',
  },
]

// 모듈 레벨 가변 상태 — POST 3종이 큐·요약·상세를 함께 갱신한다.
const state: { queue: RecordReviewQueue } = {
  queue: {
    cohort: 'AI 캠프 22기',
    instructor: '김지훈',
    pendingTotal: 28,
    weekProcessed: 94,
    avgHours: 6.4,
    unassigned: 6,
    over24h: 3,
    changesRequested: 12,
    approvedToday: 18,
    payoutCandidates: 8,
    rejectedThisWeek: 5,
    byCategory: { blog: 14, study: 8, certificate: 6 },
    items: [...initialItems],
  },
}

// 검토 상세 — 큐 6건 전부 + 카테고리별 3건 이상이 되도록 Figma 대표 데이터
// (블로그 1515:10927 · 스터디 1515:11144 · 자격증 1515:11361)를 직접 URL 진입용으로 추가.
const details = new Map<string, RecordSubmissionDetailView>([
  // ── 블로그 3건 (큐와 동일 id) ──
  [
    'rr_blog_minjune',
    {
      id: 'rr_blog_minjune',
      category: 'blog',
      student: { name: '김민준', cohort: '22기' },
      submissionLabel: '5주차 회고',
      statusCaption: '5주차 블로그',
      submittedAt: '2026-05-19 09:42',
      status: 'pending',
      reviewNote: '',
      mileageCandidate: '후보 +2,000',
      externalUrl: 'https://velog.io/@minjune/airflow-tracing-incident',
      previewSummary:
        'Airflow 야간 ETL DAG 연속 실패의 원인을 추적하고, X-Trace-Id 주입과 재시도 정책 변경으로 해결한 과정을 회고했습니다. 코드 블록과 실행 결과가 포함되어 있습니다.',
      urlCheck: { passed: true, label: '정상', note: '응답 200' },
      privacyCheck: { passed: true, label: '없음', note: '자동 검사 통과' },
      certificateCandidates: [
        '학습 성실성',
        '문제 해결 과정',
        '데이터 파이프라인 역량',
      ],
    },
  ],
  [
    'rr_blog_yujin',
    {
      id: 'rr_blog_yujin',
      category: 'blog',
      student: { name: '최유진', cohort: '22기' },
      submissionLabel: '7주차 회고',
      statusCaption: '7주차 블로그',
      submittedAt: '2026-05-18 14:11',
      status: 'changes_requested',
      reviewNote: '',
      externalUrl: 'https://velog.io/@yujin/langgraph-multi-agent',
      previewSummary:
        'LangGraph 멀티 에이전트에서 Intent 분류 노드를 두고 QA/Recommend 서브그래프로 분기한 설계를 정리했습니다. 상태 공유 구조 다이어그램이 포함되어 있습니다.',
      urlCheck: { passed: true, label: '정상', note: '응답 200' },
      privacyCheck: { passed: true, label: '없음', note: '자동 검사 통과' },
      certificateCandidates: ['학습 성실성', 'LLM 응용 설계 역량'],
    },
  ],
  [
    'rr_blog_haneul',
    {
      id: 'rr_blog_haneul',
      category: 'blog',
      student: { name: '정하늘', cohort: '22기' },
      submissionLabel: '6주차 회고',
      statusCaption: '6주차 블로그',
      submittedAt: '2026-05-17 22:08',
      status: 'pending',
      reviewNote: '',
      mileageCandidate: '후보 +2,000',
      externalUrl: 'https://velog.io/@haneul/pandas-memory',
      previewSummary:
        'Pandas로 800만 행 CSV를 다룰 때의 메모리 초과를 category dtype 지정과 chunksize 스트리밍으로 60% 절감한 과정을 정리했습니다. 벤치마크 수치가 포함되어 있습니다.',
      urlCheck: { passed: true, label: '정상', note: '응답 200' },
      privacyCheck: { passed: true, label: '없음', note: '자동 검사 통과' },
      certificateCandidates: ['학습 성실성', '데이터 처리 최적화 역량'],
    },
  ],
  // ── 스터디 3건 (큐 1건 + 직접 진입용 2건 — 박서연은 Figma 1515:11144 대표값) ──
  [
    'rr_study_seoyeon',
    {
      id: 'rr_study_seoyeon',
      category: 'study',
      student: { name: '이서연', cohort: '22기' },
      submissionLabel: 'NestJS 스터디 7주차',
      statusCaption: '이미지 2장',
      submittedAt: '2026-05-19 08:18',
      status: 'pending',
      reviewNote: '',
      activityHours: 2,
      activityTimeRange: '20:00~22:00',
      streakCount: 7,
      evidenceQuality: { level: 'ok', note: '문제 없음' },
      evidenceImages: [
        { id: 'ev_sy_1', url: '/mock/study-seoyeon-1.jpg', quality: 'ok' },
        { id: 'ev_sy_2', url: '/mock/study-seoyeon-2.jpg', quality: 'ok' },
      ],
      activityNote:
        'GraphQL Code-first 패턴 정리 발표와 모듈별 코드 리뷰를 진행했습니다. 참석자 4명 중 4명 인증 완료.',
    },
  ],
  [
    'rr_study_parkseo',
    {
      id: 'rr_study_parkseo',
      category: 'study',
      student: { name: '박서연', cohort: 'FE 7기' },
      submissionLabel: '코테 스터디 3회',
      statusCaption: '이미지 2장',
      submittedAt: '2026-05-18 22:10',
      status: 'changes_requested',
      reviewNote: '',
      activityHours: 2,
      activityTimeRange: '20:00~22:00',
      streakCount: 3,
      evidenceQuality: { level: 'warning', note: '한 장 흐림' },
      evidenceImages: [
        { id: 'ev_ps_1', url: '/mock/study-parkseo-1.jpg', quality: 'ok' },
        {
          id: 'ev_ps_2',
          url: '/mock/study-parkseo-2.jpg',
          quality: 'blurry',
          note: '흐림 · 재제출 권장',
        },
        { id: 'ev_ps_3', url: '/mock/study-parkseo-3.jpg', quality: 'ok' },
      ],
      activityNote:
        '알고리즘 DP 문제 4개 풀이와 코드 리뷰를 진행했습니다. 참석자 4명 중 3명 인증 완료.',
    },
  ],
  [
    'rr_study_juwon',
    {
      id: 'rr_study_juwon',
      category: 'study',
      student: { name: '김주원', cohort: '22기' },
      submissionLabel: 'CS 스터디 5회',
      statusCaption: '이미지 2장',
      submittedAt: '2026-05-17 21:02',
      status: 'pending',
      reviewNote: '',
      activityHours: 1.5,
      activityTimeRange: '21:00~22:30',
      streakCount: 5,
      evidenceQuality: { level: 'ok', note: '문제 없음' },
      evidenceImages: [
        { id: 'ev_jw_1', url: '/mock/study-juwon-1.jpg', quality: 'ok' },
        { id: 'ev_jw_2', url: '/mock/study-juwon-2.jpg', quality: 'ok' },
      ],
      activityNote:
        'CS 네트워크 파트 발표와 질의응답을 진행했습니다. 참석자 5명 전원 인증 완료.',
    },
  ],
  // ── 자격증 3건 (큐 2건 + 직접 진입용 1건 — 정도윤은 Figma 1515:11361 대표값) ──
  [
    'rr_cert_jihoon',
    {
      id: 'rr_cert_jihoon',
      category: 'certificate',
      student: { name: '박지훈', cohort: '22기' },
      submissionLabel: '정보처리기사(실기)',
      submittedAt: '2026-05-18 17:30',
      status: 'pending',
      reviewNote: '',
      mileageCandidate: '+15,000',
      evidenceImages: [
        { id: 'ev_jh_1', url: '/mock/cert-jeongbo.png', quality: 'ok' },
      ],
      ocr: {
        certificateName: '정보처리기사',
        grade: '실기',
        holderName: '박지훈',
        acquiredAt: '2026-05-16',
      },
      policyAllowed: true,
      allowedCertificates: ['정보처리기사', 'SQLD', 'PCCP'],
      duplicateSubmission: false,
      policyNote:
        '허용 자격증이며, 중복 제출 이력이 없습니다. 승인 시 기록실과 마일리지 후보에 반영됩니다.',
    },
  ],
  [
    'rr_cert_jiho',
    {
      id: 'rr_cert_jiho',
      category: 'certificate',
      student: { name: '한지호', cohort: '22기' },
      submissionLabel: 'SQLD',
      submittedAt: '2026-05-17 19:42',
      status: 'pending',
      reviewNote: '',
      mileageCandidate: '+10,000',
      evidenceImages: [
        { id: 'ev_jho_1', url: '/mock/cert-sqld.png', quality: 'ok' },
      ],
      ocr: {
        certificateName: 'SQLD',
        holderName: '한지호',
        acquiredAt: '2026-05-15',
      },
      policyAllowed: true,
      allowedCertificates: ['정보처리기사', 'SQLD', 'PCCP'],
      duplicateSubmission: false,
      policyNote:
        '허용 자격증이며, 중복 제출 이력이 없습니다. 승인 시 기록실과 마일리지 후보에 반영됩니다.',
    },
  ],
  [
    'rr_cert_doyun',
    {
      id: 'rr_cert_doyun',
      category: 'certificate',
      student: { name: '정도윤', cohort: 'AI 3기' },
      submissionLabel: 'PCCP Lv.2',
      submittedAt: '2026-05-16 11:24',
      status: 'pending',
      reviewNote: '',
      mileageCandidate: '+15,000',
      evidenceImages: [
        { id: 'ev_dy_1', url: '/mock/cert-pccp.png', quality: 'ok' },
      ],
      ocr: {
        certificateName: 'PCCP',
        grade: 'Lv.2',
        holderName: '정도윤',
        acquiredAt: '2026-05-12',
      },
      policyAllowed: true,
      allowedCertificates: ['PCCE', 'PCCP', 'PCSQL'],
      duplicateSubmission: false,
      policyNote:
        '허용 자격증이며, 중복 제출 이력이 없습니다. 승인 시 기록실과 마일리지 후보에 반영됩니다.',
    },
  ],
])

const reasonRequired = () =>
  HttpResponse.json(
    {
      code: 'REVIEW_REASON_REQUIRED',
      message: '반려·보완 요청 시 사유(검토 메모)가 필요합니다.',
    },
    { status: 422 },
  )

const notFound = () =>
  HttpResponse.json(
    { code: 'RECORD_NOT_FOUND', message: '검토 대상을 찾을 수 없습니다.' },
    { status: 404 },
  )

/** 큐에서 제거(승인·반려 — 처리 후 큐에서 빠짐) + 요약 카운트 차감 */
function removeFromQueue(recordId: string) {
  const item = state.queue.items.find((it) => it.id === recordId)
  if (!item) return null
  state.queue.items = state.queue.items.filter((it) => it.id !== recordId)
  state.queue.pendingTotal = Math.max(0, state.queue.pendingTotal - 1)
  state.queue.byCategory[item.category] = Math.max(
    0,
    state.queue.byCategory[item.category] - 1,
  )
  return item
}

export const handlers = [
  // 정적 /review 경로를 :category/:submissionId 파라미터 핸들러보다 먼저 배치.
  http.get('/api/admin/records/review', () =>
    ok<RecordReviewQueue>(state.queue),
  ),

  // 검토 처리 3종 — 상태를 실제로 바꿔 큐 GET·상세 GET에 반영(invalidateQueries로 재조회).
  http.post<{ recordId: string }, RecordReviewActionRequest>(
    '/api/admin/records/review/:recordId/approve',
    async ({ params }) => {
      const recordId = String(params.recordId)
      const item = removeFromQueue(recordId)
      const detail = details.get(recordId)
      if (!item && !detail) return notFound()
      if (item?.mileageCandidate || detail?.mileageCandidate) {
        state.queue.payoutCandidates += 1
      }
      state.queue.approvedToday += 1
      details.delete(recordId) // 승인 후 상세 재진입은 미정의(대기 상태만 디자인) — 큐와 함께 제거
      return ok({ id: recordId, status: 'approved' })
    },
  ),
  http.post<{ recordId: string }, RecordReviewActionRequest>(
    '/api/admin/records/review/:recordId/request-changes',
    async ({ params, request }) => {
      const recordId = String(params.recordId)
      const body = (await request.json()) as RecordReviewActionRequest
      if (!body?.studentVisibleComment?.trim()) return reasonRequired()
      const item = state.queue.items.find((it) => it.id === recordId)
      const detail = details.get(recordId)
      if (!item && !detail) return notFound()
      if (item && item.status !== 'changes_requested') {
        item.status = 'changes_requested'
        state.queue.changesRequested += 1
      }
      if (detail) {
        detail.status = 'changes_requested'
        detail.reviewNote = body.studentVisibleComment
      }
      return ok({ id: recordId, status: 'changes_requested' })
    },
  ),
  http.post<{ recordId: string }, RecordReviewActionRequest>(
    '/api/admin/records/review/:recordId/reject',
    async ({ params, request }) => {
      const recordId = String(params.recordId)
      const body = (await request.json()) as RecordReviewActionRequest
      if (!body?.studentVisibleComment?.trim()) return reasonRequired()
      const item = removeFromQueue(recordId)
      const detail = details.get(recordId)
      if (!item && !detail) return notFound()
      state.queue.rejectedThisWeek += 1
      details.delete(recordId)
      return ok({ id: recordId, status: 'rejected' })
    },
  ),

  // 검토 상세 — 세그먼트(blog|study|certificates)를 RecordCategory로 매핑해 검증.
  http.get('/api/admin/records/:category/:submissionId', ({ params }) => {
    const category = recordCategoryFromSegment(String(params.category))
    if (!category) {
      return HttpResponse.json(
        {
          code: 'UNSUPPORTED_CATEGORY',
          message: '지원하지 않는 카테고리입니다.',
        },
        { status: 404 },
      )
    }
    const detail = details.get(String(params.submissionId))
    if (!detail || detail.category !== category) return notFound()
    return ok<RecordSubmissionDetailView>(detail)
  }),
]
