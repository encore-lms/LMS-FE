import { http, HttpResponse } from 'msw'
import type {
  BlogGridRow,
  BlogRecordDetail,
  CertGridRow,
  CertRecordDetail,
  CertType,
  InstructorRecordReviewData,
  ProjectReviewData,
  RecordCellStatus,
  RecordCohortTab,
  RecordCourseTab,
  RecordWeek,
  StudyGridRow,
  StudyRecordDetail,
  TsReviewData,
  ProjectReviewDetail,
  TsReviewDetail,
} from '@/shared/types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── §13 학습 기록 조회 (강사 조회 전용) — 수강생×주차 그리드 + 자격증 매트릭스 ──
// 사진(구 playdata-lms SKN 29기 화면) 기준 mock. 강사는 조회만: 매니저 결정을 표시.
// 실제 BE 연동 시 페어가 shared PR로 교체(카테고리·기수별 조회 API).

// 과정·기수 — SKN 29기만 데이터 채움, 나머지는 빈 그리드(데모).
const toCohorts = (ids: string[]): RecordCohortTab[] =>
  ids.map((id) => ({ id, label: id }))

const RECORD_COURSES: RecordCourseTab[] = [
  {
    id: 'skn',
    label: 'SK네트웍스 Family AI 캠프',
    cohorts: toCohorts([
      '29기',
      '34기',
      '21기',
      '22기',
      '23기',
      '24기',
      '25기',
      '26기',
      '27기',
      '28기',
      '31기',
    ]),
  },
  {
    id: 'da',
    label: '데이터 분석 부트캠프',
    cohorts: toCohorts(['4기', '5기', '6기']),
  },
]

// 그리드 열(주차) — 3월 1주차 ~ 8월 1주차(6월은 5주차까지) = 22주.
const RECORD_WEEKS: RecordWeek[] = (() => {
  const months: { m: string; weeks: number }[] = [
    { m: '3월', weeks: 4 },
    { m: '4월', weeks: 4 },
    { m: '5월', weeks: 4 },
    { m: '6월', weeks: 5 },
    { m: '7월', weeks: 4 },
    { m: '8월', weeks: 1 },
  ]
  const out: RecordWeek[] = []
  let no = 1
  for (const mm of months)
    for (let w = 1; w <= mm.weeks; w++)
      out.push({ no: no++, label: `${mm.m} ${w}주차` })
  return out
})()

// 수강생별 시드 — 사진 수치(완주·연속·자격증·마일리지)를 그대로 반영.
interface RecordSeed {
  name: string
  birth: string
  atRisk?: boolean
  blog: number // 완주(승인) 수
  studyWeeks: number // 스터디 연속 주(0 = 없음)
  studyPaid: boolean // 스터디 마일리지 지급
  certs: Partial<Record<CertType, RecordCellStatus>>
  mileage: number // 자격증 마일리지 합계(P)
  paid: boolean // 자격증 지급 완료
}

const SKN29: RecordSeed[] = [
  {
    name: '김은진',
    birth: '1995-09-08',
    blog: 15,
    studyWeeks: 7,
    studyPaid: true,
    certs: { PCCE: 'approved' },
    mileage: 25000,
    paid: true,
  },
  {
    name: '김재홍',
    birth: '1992-10-25',
    blog: 9,
    studyWeeks: 7,
    studyPaid: true,
    certs: { PCCE: 'approved' },
    mileage: 25000,
    paid: true,
  },
  {
    name: '김정민',
    birth: '2003-11-05',
    blog: 16,
    studyWeeks: 7,
    studyPaid: true,
    certs: { PCCE: 'approved' },
    mileage: 25000,
    paid: true,
  },
  {
    name: '김지훈',
    birth: '1998-01-05',
    blog: 1,
    studyWeeks: 0,
    studyPaid: false,
    certs: {},
    mileage: 0,
    paid: false,
  },
  {
    name: '김진욱',
    birth: '1999-07-29',
    blog: 0,
    studyWeeks: 7,
    studyPaid: true,
    certs: { PCCP: 'approved', PCSQL: 'approved' },
    mileage: 50000,
    paid: true,
  },
  {
    name: '박상현',
    birth: '1996-08-21',
    atRisk: true,
    blog: 0,
    studyWeeks: 0,
    studyPaid: false,
    certs: {},
    mileage: 0,
    paid: false,
  },
  {
    name: '박준희',
    birth: '1995-03-18',
    blog: 0,
    studyWeeks: 6,
    studyPaid: true,
    certs: { PCCP: 'approved' },
    mileage: 50000,
    paid: true,
  },
  {
    name: '성주연',
    birth: '2004-01-28',
    blog: 16,
    studyWeeks: 7,
    studyPaid: true,
    certs: { PCCE: 'approved' },
    mileage: 25000,
    paid: true,
  },
  {
    name: '송민지',
    birth: '1999-05-31',
    blog: 0,
    studyWeeks: 7,
    studyPaid: true,
    certs: { PCCE: 'approved' },
    mileage: 25000,
    paid: true,
  },
  {
    name: '양정현',
    birth: '2001-05-16',
    blog: 15,
    studyWeeks: 7,
    studyPaid: true,
    certs: {},
    mileage: 0,
    paid: false,
  },
  {
    name: '우석현',
    birth: '1997-09-07',
    blog: 9,
    studyWeeks: 7,
    studyPaid: true,
    certs: { PCCE: 'approved' },
    mileage: 25000,
    paid: true,
  },
  {
    name: '윤대성',
    birth: '2001-05-09',
    blog: 0,
    studyWeeks: 7,
    studyPaid: true,
    certs: { PCCE: 'approved' },
    mileage: 25000,
    paid: true,
  },
  {
    name: '윤승혁',
    birth: '1999-09-10',
    blog: 2,
    studyWeeks: 6,
    studyPaid: true,
    certs: { PCCP: 'approved' },
    mileage: 50000,
    paid: true,
  },
]

// 주차 → 제출일(2026-03-02 월요일 기준 주 단위) 문자열.
function weekDate(no: number): string {
  const d = new Date(2026, 2, 2 + (no - 1) * 7)
  const p = (n: number) => String(n).padStart(2, '0')
  return `2026-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 매니저 코멘트 — 승인/반려만 코멘트, 검토중은 없음.
function managerComment(status: RecordCellStatus): string | null {
  if (status === 'approved') return '핵심 정리가 충실합니다. 승인 처리했습니다.'
  if (status === 'rejected')
    return '증빙 확인이 어려워 반려했습니다. 공식 자료로 재제출해 주세요.'
  return null
}

function makeBlogDetail(
  studentName: string,
  no: number,
  status: RecordCellStatus,
): BlogRecordDetail {
  return {
    studentName,
    weekLabel: RECORD_WEEKS[no - 1].label,
    status,
    url: `https://blog.naver.com/skn29/${224330000000 + no}`,
    submittedAt: weekDate(no),
    managerComment: managerComment(status),
  }
}

function makeStudyDetail(
  studentName: string,
  session: number,
  status: RecordCellStatus,
  no: number,
): StudyRecordDetail {
  return {
    studentName,
    title: `skn29기 예복습 스터디 ${session}회차`,
    status,
    submittedAt: weekDate(no),
    timeRange: '18:00 ~ 19:00',
    attachmentCount: 1,
    evidenceImageUrl: null,
    managerComment: managerComment(status),
  }
}

// 자격증 상세 — 취득일·등급·파일명·증빙(열람 가능 여부는 운영·수강생 정합 확인 필요).
const CERT_ACQUIRED: Record<CertType, string> = {
  PCCE: '2026-04-18',
  PCCP: '2026-05-12',
  PCSQL: '2026-05-27',
}
const CERT_GRADE: Record<CertType, string> = {
  PCCE: 'Lv.1',
  PCCP: 'Lv.2',
  PCSQL: 'Lv.3',
}
// 자격증 종류별 마일리지 — 마일리지는 최고 등급 1건만 지급(중복 미지급).
const CERT_MILEAGE: Record<CertType, number> = {
  PCCE: 25000,
  PCCP: 50000,
  PCSQL: 25000,
}
function makeCertDetail(
  studentName: string,
  certType: CertType,
  status: RecordCellStatus,
  mileage: number,
  paid: boolean,
  mileageBreakdown: string,
): CertRecordDetail {
  return {
    studentName,
    certType,
    grade: CERT_GRADE[certType],
    status,
    holderName: studentName,
    acquiredAt: CERT_ACQUIRED[certType],
    submittedAt: CERT_ACQUIRED[certType],
    fileName: `${certType}.png`,
    url: `https://cert.playdata.io/verify/${certType.toLowerCase()}-skn29`,
    evidenceImageUrl: null,
    mileage,
    mileageBreakdown,
    paid,
    managerComment: managerComment(status),
  }
}

// 과정·기수 데이터 조립 — SKN 29기만 채우고 그 외는 빈 그리드.
function buildRecordData(
  courseId: string,
  cohortId: string,
): InstructorRecordReviewData {
  const base = {
    courses: RECORD_COURSES,
    activeCourseId: courseId,
    activeCohortId: cohortId,
    weeks: RECORD_WEEKS,
  }
  if (courseId !== 'skn' || cohortId !== '29기') {
    return {
      ...base,
      blog: [],
      study: [],
      cert: [],
      blogDetails: {},
      studyDetails: {},
      certDetails: {},
    }
  }

  const blog: BlogGridRow[] = []
  const study: StudyGridRow[] = []
  const cert: CertGridRow[] = []
  const blogDetails: Record<string, BlogRecordDetail> = {}
  const studyDetails: Record<string, StudyRecordDetail> = {}
  const certDetails: Record<string, CertRecordDetail> = {}
  const maxWeek = RECORD_WEEKS.length

  SKN29.forEach((s, i) => {
    const student = {
      id: `skn29-${i + 1}`,
      name: s.name,
      birth: s.birth,
      atRisk: s.atRisk,
    }

    // 블로그 — 1주차부터 완주 수만큼 승인.
    const bCells: Record<number, RecordCellStatus> = {}
    const bIds: Record<number, string> = {}
    for (let k = 0; k < s.blog && k < maxWeek; k++) {
      const no = k + 1
      const id = `29-blog-${student.id}-w${no}`
      bCells[no] = 'approved'
      bIds[no] = id
      blogDetails[id] = makeBlogDetail(s.name, no, 'approved')
    }
    blog.push({
      student,
      cells: bCells,
      submissionIds: bIds,
      completed: s.blog,
      total: 26,
    })

    // 스터디 — 3주차부터 연속 승인. 윤승혁은 첫 주 검토중(주황) 데모.
    const stCells: Record<number, RecordCellStatus> = {}
    const stIds: Record<number, string> = {}
    let runStart = 3
    let session = 1
    if (s.name === '윤승혁' && s.studyWeeks > 0) {
      const p = 3
      const pid = `29-study-${student.id}-w${p}`
      stCells[p] = 'pending'
      stIds[p] = pid
      studyDetails[pid] = makeStudyDetail(s.name, session++, 'pending', p)
      runStart = 4
    }
    for (let k = 0; k < s.studyWeeks && runStart + k <= maxWeek; k++) {
      const no = runStart + k
      const id = `29-study-${student.id}-w${no}`
      stCells[no] = 'approved'
      stIds[no] = id
      studyDetails[id] = makeStudyDetail(s.name, session++, 'approved', no)
    }
    study.push({
      student,
      cells: stCells,
      submissionIds: stIds,
      streakWeeks: s.studyWeeks,
      mileagePaid: s.studyPaid,
    })

    // 자격증 — 종류별 상태 매트릭스 + 제출 있는 종류는 상세 패널 연결.
    const certs: Record<CertType, RecordCellStatus> = {
      PCCE: s.certs.PCCE ?? 'none',
      PCCP: s.certs.PCCP ?? 'none',
      PCSQL: s.certs.PCSQL ?? 'none',
    }
    // 지급 근거 자격증 = 승인된 것 중 마일리지 최고 1건.
    const earning = (Object.keys(certs) as CertType[])
      .filter((t) => certs[t] === 'approved')
      .sort((a, b) => CERT_MILEAGE[b] - CERT_MILEAGE[a])[0]
    const breakdown =
      earning && s.mileage > 0
        ? `${earning} ${CERT_MILEAGE[earning].toLocaleString()}P`
        : ''
    const certIds: Partial<Record<CertType, string>> = {}
    ;(Object.keys(certs) as CertType[]).forEach((t) => {
      if (certs[t] === 'none') return
      const id = `29-cert-${student.id}-${t}`
      certIds[t] = id
      certDetails[id] = makeCertDetail(
        s.name,
        t,
        certs[t],
        s.mileage,
        s.paid,
        breakdown,
      )
    })
    cert.push({
      student,
      certs,
      submissionIds: certIds,
      mileage: s.mileage,
      paid: s.paid,
    })
  })

  return { ...base, blog, study, cert, blogDetails, studyDetails, certDetails }
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

// 인증/보완 액션 본문 — certify(사유 없음) / request_changes(사유 필수).
type ReviewAction =
  | { action: 'certify' }
  | { action: 'request_changes'; reason: string }

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

// ── §14·§15 검토 상세 — 목록 시드에서 파생(로컬 데모). 실 BE는 InstructorReviewDetailController. ──
function buildProjectDetail(id: string): ProjectReviewDetail | null {
  const row = projectReviews.rows.find((r) => r.id === id)
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    cohortId: row.cohortId ?? 'cohort-mock',
    cohortLabel: row.cohortLabel,
    status: row.status,
    createdAt: '2026.06.01',
    updatedAt: '2026.07.18',
    requestedAt: '2026.07.15',
    certifiedAt: row.status === 'certified' ? '2026.07.20' : null,
    reviewComment:
      row.status === 'supplementing'
        ? 'README에 아키텍처 다이어그램을 보강해 주세요.'
        : null,
    members: [
      { userId: 'stu-1', role: 'LEADER' },
      { userId: 'stu-2', role: null },
      { userId: 'stu-3', role: null },
    ],
    stack: row.stack === '-' ? [] : row.stack.split(' · '),
    artifacts: (row.artifacts ?? '')
      .split(' · ')
      .filter(Boolean)
      .map((type, i) => ({
        type,
        title: `${row.name.split(' · ')[1] ?? row.name} ${type}`,
        url: i === 0 ? 'https://github.com/example/repo' : null,
        fileName: i === 0 ? null : '발표자료.pdf',
      })),
  }
}

// 사례별 STAR 본문 — 목록 제목과 짝이 맞아야 한다.
// 예전에는 모든 id가 같은 OOM 본문을 돌려줘 "검토 버튼이 전부 같은 상세로 간다"로 보였다(2026-08-13 QA).
const tsBodies: Record<
  string,
  { situation: string; resolution: string; result: string; stack: string[] }
> = {
  'ts-1': {
    situation:
      '배치 파이프라인 실행 중 워커 메모리가 지속 증가해 OOM으로 태스크가 실패했다.',
    resolution:
      '힙 덤프로 누수 지점을 특정하고 커넥션 풀 반환 누락을 수정, 배치 크기를 조정했다.',
    result: '메모리 사용량이 안정화되어 전체 파이프라인이 재실행 없이 완주했다.',
    stack: ['Python', 'Airflow'],
  },
  'ts-2': {
    situation:
      '배포 직후 파드가 반복해서 OOMKilled로 재시작해 서비스가 간헐적으로 끊겼다.',
    resolution:
      'requests/limits와 JVM 힙 설정이 어긋난 것을 확인해 컨테이너 메모리 한도에 맞춰 힙을 다시 잡았다.',
    result: '재시작이 멈추고 파드가 하루 이상 무중단으로 유지됐다.',
    stack: ['Kubernetes', 'Java'],
  },
  'ts-3': {
    situation:
      '문서를 늘렸는데 오히려 RAG 응답의 근거 문단이 어긋나 정확도가 떨어졌다.',
    resolution:
      '청크 경계가 문장을 자르는 것을 확인해 분할 기준을 문단 단위로 바꾸고 임베딩 모델을 교체해 재색인했다.',
    result: '샘플 질의 50건의 근거 적중률이 눈에 띄게 올라가 재색인 기준을 문서로 남겼다.',
    stack: ['Python', 'LangChain'],
  },
  'ts-4': {
    situation:
      '팀원마다 같은 화면에서 서로 다른 목록이 보이거나 저장이 거부됐다.',
    resolution:
      'RLS 정책이 역할별로 중복 정의돼 서로를 가리는 것을 찾아 정책을 하나로 합치고 테스트 계정으로 검증했다.',
    result: '역할별 접근 범위가 의도대로 정리되고 저장 거부가 사라졌다.',
    stack: ['Supabase', 'PostgreSQL'],
  },
  'ts-5': {
    situation:
      '월별 누적 집계 쿼리가 데이터가 늘면서 응답이 수십 초까지 늘어졌다.',
    resolution:
      '윈도우 함수의 정렬 범위를 좁히고 사전 집계 테이블을 두어 스캔량을 줄였다.',
    result: '같은 결과를 유지하면서 조회 시간이 크게 줄어 대시보드가 즉시 뜨게 됐다.',
    stack: ['DuckDB', 'SQL'],
  },
  'ts-6': {
    situation:
      '동시 주문 처리에서 간헐적으로 deadlock이 나 결제 트랜잭션이 실패했다.',
    resolution:
      '로그에서 잠금 획득 순서가 트랜잭션마다 다른 것을 확인해 갱신 순서를 한 방향으로 통일했다.',
    result: '재현 스크립트로 동시 100건을 돌려도 deadlock이 나지 않았다.',
    stack: ['MySQL', 'Spring'],
  },
}

function buildTsDetail(id: string): TsReviewDetail | null {
  const row = tsReviews.rows.find((r) => r.id === id)
  if (!row) return null
  const body = tsBodies[row.id] ?? tsBodies['ts-1']
  return {
    id: row.id,
    title: row.title,
    studentUserId: `stu-${row.id.replace('ts-', '')}`,
    studentName: row.studentName,
    cohortLabel: row.cohortLabel,
    status: row.status,
    independent: row.solvedBy === '독립',
    daysSpent: Number.parseInt(row.durationDays ?? '0', 10) || 0,
    createdAt: '2026.07.10',
    situation: body.situation,
    resolution: body.resolution,
    result: body.result,
    tags: [row.category],
    stack: body.stack,
    attachments: [
      {
        id: 'att-1',
        label: '원인 분석 노트',
        kind: 'link',
        url: 'https://blog.example.com/oom-debug',
        fileName: null,
      },
    ],
    project: row.project,
    certifiedAt: row.status === 'certified' ? '2026.07.19' : null,
    reviewComment:
      row.status === 'supplementing'
        ? '해결 과정의 재현 절차를 단계별로 보강해 주세요.'
        : null,
  }
}

export const handlers = [
  http.get('/api/instructor/records/review', ({ request }) => {
    const sp = new URL(request.url).searchParams
    const courseId = sp.get('courseId') || 'skn'
    const cohortId = sp.get('cohortId') || '29기'
    return ok<InstructorRecordReviewData>(buildRecordData(courseId, cohortId))
  }),
  http.get('/api/instructor/projects/review', () =>
    ok<ProjectReviewData>(projectReviews),
  ),
  http.get('/api/instructor/troubleshooting/review', () =>
    ok<TsReviewData>(tsReviews),
  ),
  http.get('/api/instructor/projects/review/:id', ({ params }) => {
    const detail = buildProjectDetail(String(params.id))
    return detail
      ? ok<ProjectReviewDetail>(detail)
      : HttpResponse.json({ message: 'not found' }, { status: 404 })
  }),
  http.get('/api/instructor/troubleshooting/review/:id', ({ params }) => {
    const detail = buildTsDetail(String(params.id))
    return detail
      ? ok<TsReviewDetail>(detail)
      : HttpResponse.json({ message: 'not found' }, { status: 404 })
  }),

  // §14 프로젝트 인증/보완 — certify: requested→certified / request_changes: →supplementing(보완 중).
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

  // §15 트러블슈팅 인증/보완 — certify: pending→certified / request_changes: →supplementing(보완 중).
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
