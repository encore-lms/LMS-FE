import { http, HttpResponse } from 'msw'
import type { RecordReviewQueue } from '@/shared/types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// Figma "운영 — 학습 기록 검토 큐"(1507:10816) 대표 데이터.
const queue: RecordReviewQueue = {
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
  items: [
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
  ],
}

export const handlers = [
  http.get('/api/admin/records/review', () => ok<RecordReviewQueue>(queue)),
]
