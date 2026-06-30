import { http, HttpResponse } from 'msw'
import type {
  InstructorRecordReviewData,
  ProjectReviewData,
  TsReviewData,
} from '@/shared/types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── §13 학습 기록 조회 (Figma 1422:10009) ──
const recordReviews: InstructorRecordReviewData = {
  stats: [
    { label: '제출 현황', value: '14', unit: '건' },
    { label: '보완 요청 중', value: '3', unit: '건' },
    { label: '최근 승인', value: '8', unit: '건' },
    { label: '최근 반려', value: '2', unit: '건' },
  ],
  counts: { all: 32, blog: 12, study: 14, cert: 6 },
  rows: [
    {
      id: 'rr-1',
      studentName: '박지훈',
      cohortLabel: 'DA 4기',
      category: 'blog',
      title: '리액트 useMemo 실전 최적화',
      submittedAt: '05-17 21:14',
      status: 'pending',
      attachments: 1,
      url: 'https://blog.example.com/park-jh/usememo',
      body: 'useMemo 남용 사례와 의존성 배열 점검 체크리스트, 렌더 카운트 측정 결과를 정리했습니다.',
      managerComment: null,
      attachmentFiles: [
        {
          name: 'usememo-benchmark.png',
          url: 'https://files.example.com/rr-1/usememo-benchmark.png',
        },
      ],
    },
    {
      id: 'rr-2',
      studentName: '김서연',
      cohortLabel: 'DA 4기',
      category: 'study',
      title: '주차 5 — SQL 윈도우 함수 스터디',
      submittedAt: '05-17 18:02',
      status: 'pending',
      attachments: 2,
      url: null,
      body: 'ROW_NUMBER·RANK·LAG/LEAD 실습과 파티션 기준 비교, 스터디원 3명 풀이 공유.',
      managerComment: null,
      attachmentFiles: [
        {
          name: 'sql-window-notes.pdf',
          url: 'https://files.example.com/rr-2/sql-window-notes.pdf',
        },
        {
          name: 'study-room.jpg',
          url: 'https://files.example.com/rr-2/study-room.jpg',
        },
      ],
    },
    {
      id: 'rr-3',
      studentName: '이준영',
      cohortLabel: 'DA 4기',
      category: 'cert',
      title: '정보처리기사 필기 합격증',
      submittedAt: '05-16 14:30',
      status: 'changes_requested',
      attachments: 1,
      url: 'https://license.example.com/verify/eng-info',
      body: '정보처리기사 필기 합격 증빙 캡처와 수험번호 첨부.',
      managerComment:
        '합격증 원본(PDF)과 발급 기관에서 조회 가능한 링크를 추가로 제출해 주세요.',
      attachmentFiles: [
        {
          name: 'eng-info-written-pass.png',
          url: 'https://files.example.com/rr-3/eng-info-written-pass.png',
        },
      ],
    },
    {
      id: 'rr-4',
      studentName: '최유진',
      cohortLabel: 'DA 4기',
      category: 'blog',
      title: 'PCA로 차원 축소 실험 회고',
      submittedAt: '05-15 23:45',
      status: 'pending',
      attachments: null,
      url: 'https://blog.example.com/choi-yj/pca',
      body: 'PCA 주성분 수에 따른 분산 보존율과 시각화, 한계를 정리했습니다.',
      managerComment: null,
    },
    {
      id: 'rr-5',
      studentName: '정민호',
      cohortLabel: 'DA 4기',
      category: 'study',
      title: '주차 4 — 추천 시스템 알고리즘',
      submittedAt: '05-15 11:20',
      status: 'approved',
      attachments: 1,
      url: null,
      body: '협업 필터링 vs 콘텐츠 기반 비교, MovieLens 실습 결과 정리.',
      managerComment: '핵심 개념 정리가 충실합니다. 승인합니다.',
      attachmentFiles: [
        {
          name: 'recsys-summary.pdf',
          url: 'https://files.example.com/rr-5/recsys-summary.pdf',
        },
      ],
    },
    {
      id: 'rr-6',
      studentName: '한지원',
      cohortLabel: 'DA 4기',
      category: 'cert',
      title: 'SQLD 자격 취득 증빙',
      submittedAt: null,
      status: 'rejected',
      attachments: null,
      url: null,
      body: 'SQLD 취득 증빙(캡처 1장) 제출.',
      managerComment:
        '제출한 캡처로는 본인·발급일 확인이 어렵습니다. 공식 증빙으로 재제출이 필요해 반려했습니다.',
    },
    {
      id: 'rr-7',
      studentName: '한소율',
      cohortLabel: 'FE 7기',
      category: 'blog',
      title: 'Next.js 서버 컴포넌트 전환 회고',
      submittedAt: '05-17 09:40',
      status: 'pending',
      attachments: 1,
      url: 'https://blog.example.com/han-sy/rsc',
      body: 'RSC 도입 시 데이터 패칭·번들 변화와 클라이언트 경계 설계를 회고했습니다.',
      managerComment: null,
      attachmentFiles: [
        {
          name: 'rsc-bundle-graph.png',
          url: 'https://files.example.com/rr-7/rsc-bundle-graph.png',
        },
      ],
    },
    {
      id: 'rr-8',
      studentName: '윤재호',
      cohortLabel: 'FE 7기',
      category: 'study',
      title: '주차 6 — Tailwind 디자인 토큰 스터디',
      submittedAt: '05-16 20:15',
      status: 'approved',
      attachments: 2,
      url: null,
      body: '@theme 토큰 설계와 다크모드 대응, 팀 컨벤션 제안 정리.',
      managerComment: '토큰 설계 근거가 명확합니다. 승인합니다.',
      attachmentFiles: [
        {
          name: 'theme-tokens.md',
          url: 'https://files.example.com/rr-8/theme-tokens.md',
        },
        {
          name: 'darkmode-demo.png',
          url: 'https://files.example.com/rr-8/darkmode-demo.png',
        },
      ],
    },
  ],
}

// ── §14 프로젝트 검토 (Figma 1422:10276) ──
// 모듈 레벨 가변 상태 — 인증/보완 핸들러가 in-memory로 갱신, GET이 읽는다. (새로고침 시 초기화)
let projectReviews: ProjectReviewData = {
  stats: [
    { label: '인증 요청 대기', value: '7', unit: '건' },
    { label: '보완 중', value: '4', unit: '건' },
    { label: '이번 달 인증', value: '12', unit: '건' },
    { label: '평균 검토 일수', value: '3.2', unit: '일' },
  ],
  counts: { all: 23, requested: 7, supplementing: 4, certified: 12 },
  rows: [
    {
      id: 'pr-1',
      name: '팀 Nexus · 데이터 파이프라인',
      cohortLabel: 'DA 4기',
      team: '5명 (PM 박지훈)',
      stack: 'Airflow · BigQuery · dbt',
      artifacts: 'GitHub · 발표',
      status: 'requested',
    },
    {
      id: 'pr-2',
      name: '팀 Beacon · 추천 시스템 API',
      cohortLabel: 'DA 4기',
      team: '4명 (PM 김서연)',
      stack: 'FastAPI · Redis · K8s',
      artifacts: 'GitHub · 시연',
      status: 'requested',
    },
    {
      id: 'pr-3',
      name: '팀 Aurora · LLM RAG 검색',
      cohortLabel: 'DA 4기',
      team: '6명 (PM 이준영)',
      stack: 'LangChain · Qdrant',
      artifacts: 'GitHub · 발표 · 영상',
      status: 'supplementing',
    },
    {
      id: 'pr-4',
      name: '팀 Stellar · 출결 자동화',
      cohortLabel: 'FE 7기',
      team: '3명 (PM 최유진)',
      stack: 'Next.js · Supabase',
      artifacts: 'GitHub · 발표',
      status: 'supplementing',
    },
    {
      id: 'pr-5',
      name: '팀 Quantum · 학습 기록 분석',
      cohortLabel: 'DA 4기',
      team: '5명 (PM 정민호)',
      stack: 'Streamlit · DuckDB',
      artifacts: 'GitHub · 발표',
      status: 'certified',
    },
    {
      id: 'pr-6',
      name: '팀 Orbit · 멘토링 매칭',
      cohortLabel: 'FE 7기',
      team: '4명 (PM 한지원)',
      stack: '-',
      artifacts: null,
      status: 'certified',
    },
  ],
}

// ── §15 트러블슈팅 검토 (Figma 1422:10543) ──
let tsReviews: TsReviewData = {
  stats: [
    { label: '검토 대기', value: '5', unit: '건' },
    { label: '독립해결 비율', value: '68', unit: '%' },
    { label: '평균 소요일수', value: '4.5', unit: '일' },
    { label: '이번 달 인증', value: '9', unit: '건' },
  ],
  counts: { all: 18, pending: 5, supplementing: 4, certified: 9 },
  rows: [
    {
      id: 'ts-1',
      studentName: '박지훈',
      cohortLabel: 'DA 4기',
      title: 'Airflow DAG 메모리 누수 추적',
      category: '성능최적화',
      solvedBy: '독립',
      durationDays: '3일',
      project: '팀 Nexus',
      status: 'pending',
    },
    {
      id: 'ts-2',
      studentName: '김서연',
      cohortLabel: 'DA 4기',
      title: 'K8s OOMKilled 디버깅',
      category: '배포이슈',
      solvedBy: '독립',
      durationDays: '5일',
      project: '팀 Beacon',
      status: 'pending',
    },
    {
      id: 'ts-3',
      studentName: '이준영',
      cohortLabel: 'DA 4기',
      title: 'RAG 임베딩 정확도 저하',
      category: '모델',
      solvedBy: '협업',
      durationDays: '7일',
      project: '팀 Aurora',
      status: 'supplementing',
    },
    {
      id: 'ts-4',
      studentName: '최유진',
      cohortLabel: 'FE 7기',
      title: 'Supabase RLS 정책 충돌',
      category: '데이터',
      solvedBy: '독립',
      durationDays: '2일',
      project: '팀 Stellar',
      status: 'supplementing',
    },
    {
      id: 'ts-5',
      studentName: '정민호',
      cohortLabel: 'DA 4기',
      title: 'DuckDB 윈도우 쿼리 최적화',
      category: '성능최적화',
      solvedBy: '독립',
      durationDays: '4일',
      project: '팀 Quantum',
      status: 'certified',
    },
    {
      id: 'ts-6',
      studentName: '한지원',
      cohortLabel: 'FE 7기',
      title: 'MySQL deadlock 재현·해소',
      category: '인프라',
      solvedBy: null,
      durationDays: null,
      project: null,
      status: 'certified',
    },
  ],
}

// 인증/보완 액션 본문 — certify(사유 없음) / requestChanges(사유 필수).
type ReviewAction =
  | { action: 'certify' }
  | { action: 'requestChanges'; reason: string }

// 프로젝트 카운트 재계산 — requested/supplementing/certified 분포.
function recountProjects(
  rows: ProjectReviewData['rows'],
): ProjectReviewData['counts'] {
  return {
    all: rows.length,
    requested: rows.filter((r) => r.status === 'requested').length,
    supplementing: rows.filter((r) => r.status === 'supplementing').length,
    certified: rows.filter((r) => r.status === 'certified').length,
  }
}

// 트러블슈팅 카운트 재계산 — pending/supplementing/certified 분포.
function recountTs(rows: TsReviewData['rows']): TsReviewData['counts'] {
  return {
    all: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    supplementing: rows.filter((r) => r.status === 'supplementing').length,
    certified: rows.filter((r) => r.status === 'certified').length,
  }
}

export const handlers = [
  http.get('/api/instructor/records/review', () =>
    ok<InstructorRecordReviewData>(recordReviews),
  ),
  http.get('/api/instructor/projects/review', () =>
    ok<ProjectReviewData>(projectReviews),
  ),
  http.get('/api/instructor/troubleshooting/review', () =>
    ok<TsReviewData>(tsReviews),
  ),

  // §14 프로젝트 인증/보완 — certify: requested→certified / requestChanges: →supplementing(보완 중).
  http.patch(
    '/api/instructor/projects/review/:id',
    async ({ params, request }) => {
      const id = String(params.id)
      const body = (await request.json()) as ReviewAction
      const next: ProjectReviewData['rows'] = projectReviews.rows.map((r) =>
        r.id === id
          ? {
              ...r,
              status: body.action === 'certify' ? 'certified' : 'supplementing',
            }
          : r,
      )
      projectReviews = {
        ...projectReviews,
        rows: next,
        counts: recountProjects(next),
      }
      return HttpResponse.json({ data: null })
    },
  ),

  // §15 트러블슈팅 인증/보완 — certify: pending→certified / requestChanges: →supplementing(보완 중).
  http.patch(
    '/api/instructor/troubleshooting/review/:id',
    async ({ params, request }) => {
      const id = String(params.id)
      const body = (await request.json()) as ReviewAction
      const next: TsReviewData['rows'] = tsReviews.rows.map((r) =>
        r.id === id
          ? {
              ...r,
              status: body.action === 'certify' ? 'certified' : 'supplementing',
            }
          : r,
      )
      tsReviews = { ...tsReviews, rows: next, counts: recountTs(next) }
      return HttpResponse.json({ data: null })
    },
  ),
]
