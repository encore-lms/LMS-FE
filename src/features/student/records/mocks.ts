import { http, HttpResponse } from 'msw'
import type {
  BlogFormData,
  BlogRecord,
  CertFormData,
  RecordCategory,
  RecordStatus,
  RecordsOverview,
  StudyFormData,
  WeekCell,
} from './types'

// 기록실 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// 데이터는 Figma 기록실(246:27)·블로그 폼(267:27)·블로그 수정(2208:16414) 시안 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

const mockOverview: RecordsOverview = {
  tabs: [
    { key: 'all', label: '전체', count: 24 },
    { key: 'blog', label: '블로그', count: 12 },
    { key: 'study', label: '스터디', count: 4 },
    { key: 'cert', label: '자격증', count: 3 },
  ],
  stats: [
    {
      key: 'total',
      label: '전체 기록',
      value: '24',
      unit: '건',
      sub: '블로그 12 · 스터디 4 · 자격증 3',
      dotTone: 'success',
    },
    {
      key: 'approved',
      label: '승인 완료',
      value: '18',
      unit: '건',
      sub: '증명서 외부 공개 가능',
      dotTone: 'success',
    },
    {
      key: 'reviewing',
      label: '검토 중',
      value: '3',
      unit: '건',
      sub: '운영자 검토 진행',
      dotTone: 'accent',
    },
    {
      key: 'rejected',
      label: '반려',
      value: '3',
      unit: '건',
      sub: '수정 후 재제출 필요',
      dotTone: 'danger',
    },
  ],
  banner: {
    title: '11주차 블로그 제출',
    sub: '제출 후 승인 전까지 변경이 불가합니다 · 마감 5/18 (월) 23:59',
    actionLabel: '블로그 제출',
  },
  listTitle: '블로그 기록',
  listCount: 12,
  records: [
    {
      id: 'b10',
      category: 'blog',
      weekLabel: '10주차',
      dateRange: '5/6 ~ 5/12',
      status: 'approved',
      statusLabel: '승인',
      title: 'JPA 영속성 컨텍스트의 1차 캐시 정리',
      url: 'https://velog.io/@kim-su/jpa-persistence-context',
      instructor: '운영자 검토',
      submittedAt: '2026.05.10 제출',
      statusAt: '2026.05.12 승인',
      canEdit: false,
      canDelete: false,
    },
    {
      id: 'b9',
      category: 'blog',
      weekLabel: '9주차',
      dateRange: '4/29 ~ 5/5',
      status: 'approved',
      statusLabel: '승인',
      title: 'Spring Security 필터 체인 흐름 분석',
      url: 'https://medium.com/@kim-su/spring-security-filter',
      instructor: '운영자 검토',
      submittedAt: '2026.05.04 제출',
      statusAt: '2026.05.06 승인',
      canEdit: false,
      canDelete: false,
    },
    {
      id: 'b8',
      category: 'blog',
      weekLabel: '8주차',
      dateRange: '4/22 ~ 4/28',
      status: 'rejected',
      statusLabel: '반려',
      title: 'JVM 메모리 구조 정리',
      url: 'https://kcm.sg.library.com/jvm-memory',
      instructor: '운영자 검토',
      submittedAt: '2026.04.27 제출',
      statusAt: '2026.04.28 반려',
      rejectReason: {
        title: '반려 사유 (분석 부재)',
        detail:
          '주요 핵심 주제(스택·트랜잭션)에 대한 블로그 텍스트가 너무 짧고 회고 부분이 부족합니다.',
      },
      canEdit: true,
      canDelete: true,
    },
    {
      id: 'b7',
      category: 'blog',
      weekLabel: '7주차',
      dateRange: '4/15 ~ 4/21',
      status: 'reviewing',
      statusLabel: '검토 중',
      title: 'Java 컬렉션 프레임워크 비교 (List/Set/Map)',
      url: 'https://kcm.sg.library.com/java-collections',
      instructor: '운영자 검토',
      submittedAt: '2026.04.20 제출',
      statusAt: '검토 대기 · 결과 대기 중',
      canEdit: false,
      canDelete: true,
    },
    {
      id: 's4',
      category: 'study',
      weekLabel: '10주차',
      dateRange: '5/6 ~ 5/12',
      status: 'approved',
      statusLabel: '승인',
      title: '운영체제 스터디 — 프로세스 스케줄링 정리',
      url: 'https://www.notion.so/os-study/scheduling',
      instructor: '운영자 검토',
      submittedAt: '2026.05.11 제출',
      statusAt: '2026.05.12 승인',
      canEdit: false,
      canDelete: false,
    },
    {
      id: 's3',
      category: 'study',
      weekLabel: '8주차',
      dateRange: '4/22 ~ 4/28',
      status: 'reviewing',
      statusLabel: '검토 중',
      title: '네트워크 스터디 — TCP 혼잡 제어 회고',
      url: 'https://www.notion.so/net-study/tcp-congestion',
      instructor: '운영자 검토',
      submittedAt: '2026.04.26 제출',
      statusAt: '검토 대기 · 결과 대기 중',
      canEdit: false,
      canDelete: true,
    },
    {
      id: 's2',
      category: 'study',
      weekLabel: '6주차',
      dateRange: '4/8 ~ 4/14',
      status: 'approved',
      statusLabel: '승인',
      title: 'CS 면접 스터디 — 자료구조 5주차 회고',
      url: 'https://github.com/kim-su/cs-interview-study',
      instructor: '운영자 검토',
      submittedAt: '2026.04.13 제출',
      statusAt: '2026.04.14 승인',
      canEdit: false,
      canDelete: false,
    },
    {
      id: 's1',
      category: 'study',
      weekLabel: '5주차',
      dateRange: '4/1 ~ 4/7',
      status: 'rejected',
      statusLabel: '반려',
      title: '디자인 패턴 스터디 — 옵저버·전략 패턴',
      url: 'https://www.notion.so/pattern-study/observer-strategy',
      instructor: '운영자 검토',
      submittedAt: '2026.04.06 제출',
      statusAt: '2026.04.07 반려',
      rejectReason: {
        title: '반려 사유 (출처 부족)',
        detail:
          '스터디 활동 내역에 참고 자료 출처와 개인 회고가 부족합니다. 보완 후 재제출하세요.',
      },
      canEdit: true,
      canDelete: true,
    },
    {
      id: 'c3',
      category: 'cert',
      weekLabel: '취득',
      dateRange: '2026.03',
      status: 'approved',
      statusLabel: '승인',
      title: 'SQLD (SQL 개발자)',
      url: 'https://www.dataq.or.kr/verify/sqld-2026-0312',
      instructor: '운영자 검토',
      submittedAt: '2026.03.20 제출',
      statusAt: '2026.03.22 승인',
      canEdit: false,
      canDelete: false,
    },
    {
      id: 'c2',
      category: 'cert',
      weekLabel: '취득',
      dateRange: '2026.04',
      status: 'rejected',
      statusLabel: '반려',
      title: 'PCCP Lv.2 합격',
      url: 'https://certificate.programmers.co.kr/pccp-2026-0418',
      instructor: '운영자 검토',
      submittedAt: '2026.04.18 제출',
      statusAt: '2026.04.20 반려',
      rejectReason: {
        title: '반려 사유 (캡처 누락)',
        detail:
          '합격 화면 캡처에 응시자명과 합격 일자가 보이지 않습니다. 전체 화면으로 다시 첨부해 주세요.',
      },
      canEdit: true,
      canDelete: true,
    },
    {
      id: 'c1',
      category: 'cert',
      weekLabel: '취득',
      dateRange: '2026.02',
      status: 'approved',
      statusLabel: '승인',
      title: 'AWS Certified Solutions Architect – Associate',
      url: 'https://www.credly.com/badges/aws-saa-kim-su',
      instructor: '운영자 검토',
      submittedAt: '2026.02.15 제출',
      statusAt: '2026.02.17 승인',
      canEdit: false,
      canDelete: false,
    },
  ],
  shownLabel: '12건 중 4건 표시',
}

// ── 데모 페이지네이션용 데이터 보충 ──
// mock 기록이 카테고리당 3~4건뿐이라 페이지가 1개만 나왔다.
// 1·2·3 페이지가 실제로 동작하도록 카테고리별 12건(4건/페이지 × 3페이지)을 채운다.
// 앞쪽(손수 작성) 기록이 1페이지에 그대로 노출되고, 부족분만 합성 기록으로 보충.
const PER_CATEGORY = 12

const FILLERS: Record<RecordCategory, string[]> = {
  blog: [
    'Spring Bean 생명주기와 스코프 정리',
    '트랜잭션 전파(Propagation) 옵션 비교',
    'REST API 설계 원칙과 HTTP 상태코드',
    'N+1 문제와 페치 조인 해결기',
    'DB 인덱스와 실행계획(EXPLAIN) 분석',
    '동시성 제어 — 낙관적 락 vs 비관적 락',
    'DI/IoC 컨테이너 동작 원리 정리',
    'HTTP 캐시와 ETag 적용 회고',
  ],
  study: [
    '알고리즘 스터디 — 다이나믹 프로그래밍',
    'DB 스터디 — 정규화와 반정규화',
    '네트워크 스터디 — HTTP/2 vs HTTP/3',
    '운영체제 스터디 — 가상 메모리와 페이징',
    'CS 면접 스터디 — SOLID 원칙',
    '알고리즘 스터디 — 그래프 탐색(BFS·DFS)',
    '디자인 패턴 스터디 — 팩토리·빌더',
    '보안 스터디 — JWT와 세션 인증 비교',
  ],
  cert: [
    '정보처리기사',
    '리눅스마스터 2급',
    'PCCE 성적 인증',
    'ADsP (데이터분석 준전문가)',
    'AWS Certified Developer – Associate',
    '네트워크관리사 2급',
    'SQLP (SQL 전문가)',
    'CKA (Kubernetes Administrator)',
    '정보보안기사',
  ],
}

const FILL_STATUS: {
  status: RecordStatus
  statusLabel: string
  statusAt: string
}[] = [
  { status: 'approved', statusLabel: '승인', statusAt: '2026.04.12 승인' },
  {
    status: 'reviewing',
    statusLabel: '검토 중',
    statusAt: '검토 대기 · 결과 대기 중',
  },
  { status: 'rejected', statusLabel: '반려', statusAt: '2026.04.12 반려' },
]

// base(손수 작성) 뒤에 합성 기록을 붙여 카테고리당 PER_CATEGORY건을 만든다.
function fillCategory(
  base: BlogRecord[],
  category: RecordCategory,
): BlogRecord[] {
  const out = [...base]
  const pool = FILLERS[category]
  const isCert = category === 'cert'
  // 블로그는 "주차당 1개" 원칙 — 합성 기록도 기존 주차와 겹치지 않게 고유 주차를 배정.
  const usedWeeks = new Set<number>(
    base.map((r) => parseInt(r.weekLabel, 10)).filter((n) => !Number.isNaN(n)),
  )
  let nextWeek = 1
  const uniqueBlogWeek = () => {
    while (usedWeeks.has(nextWeek)) nextWeek++
    usedWeeks.add(nextWeek)
    return `${nextWeek}주차`
  }
  let i = 0
  while (out.length < PER_CATEGORY) {
    const st = FILL_STATUS[i % FILL_STATUS.length]
    out.push({
      id: `${category}-f${i + 1}`,
      category,
      weekLabel: isCert
        ? '취득'
        : category === 'blog'
          ? uniqueBlogWeek()
          : `${((base.length + i) % 12) + 1}주차`,
      dateRange: isCert ? '2026.01' : '4/1 ~ 4/7',
      status: st.status,
      statusLabel: st.statusLabel,
      title: pool[i % pool.length],
      url: `https://example.com/${category}/${i + 1}`,
      instructor: isCert ? '운영자 검토' : '운영자 검토',
      submittedAt: '2026.04.10 제출',
      statusAt: st.statusAt,
      ...(st.status === 'rejected'
        ? {
            rejectReason: {
              title: '반려 사유',
              detail: '내용·출처 보완 후 다시 제출해 주세요.',
            },
          }
        : {}),
      canEdit: st.status === 'rejected',
      canDelete: st.status !== 'approved',
    })
    i++
  }
  return out
}

const filledRecords: BlogRecord[] = [
  ...fillCategory(
    mockOverview.records.filter((r) => r.category === 'blog'),
    'blog',
  ),
  ...fillCategory(
    mockOverview.records.filter((r) => r.category === 'study'),
    'study',
  ),
  ...fillCategory(
    mockOverview.records.filter((r) => r.category === 'cert'),
    'cert',
  ),
]
mockOverview.records = filledRecords

// 탭 배지·요약 통계를 현재 records에서 다시 계산 — 등록(생성)/삭제 후에도 일관 유지.
function syncRecordAggregates() {
  const catCount = (c: RecordCategory) =>
    mockOverview.records.filter((r) => r.category === c).length
  const statusCount = (s: RecordStatus) =>
    mockOverview.records.filter((r) => r.status === s).length
  mockOverview.listCount = catCount('blog')
  mockOverview.tabs = [
    { key: 'all', label: '전체', count: mockOverview.records.length },
    { key: 'blog', label: '블로그', count: catCount('blog') },
    { key: 'study', label: '스터디', count: catCount('study') },
    { key: 'cert', label: '자격증', count: catCount('cert') },
  ]
  mockOverview.stats = [
    {
      key: 'total',
      label: '전체 기록',
      value: String(mockOverview.records.length),
      unit: '건',
      sub: `블로그 ${catCount('blog')} · 스터디 ${catCount('study')} · 자격증 ${catCount('cert')}`,
      dotTone: 'success',
    },
    {
      key: 'approved',
      label: '승인 완료',
      value: String(statusCount('approved')),
      unit: '건',
      sub: '증명서 외부 공개 가능',
      dotTone: 'success',
    },
    {
      key: 'reviewing',
      label: '검토 중',
      value: String(statusCount('reviewing')),
      unit: '건',
      sub: '운영자 검토 진행',
      dotTone: 'accent',
    },
    {
      key: 'rejected',
      label: '반려',
      value: String(statusCount('rejected')),
      unit: '건',
      sub: '수정 후 재제출 필요',
      dotTone: 'danger',
    },
  ]
}
syncRecordAggregates()

// 블로그 등록 폼 주차 그리드(생성 컨텍스트).
const createWeeks: WeekCell[] = [
  { no: 1, label: '1주차', range: '3/4 ~ 3/10', state: 'none' },
  { no: 2, label: '2주차', range: '3/11 ~ 3/17', state: 'none' },
  {
    no: 3,
    label: '3주차',
    range: '3/18 ~ 3/24',
    state: 'approved',
    note: '승인됨',
  },
  { no: 4, label: '4주차', range: '3/25 ~ 3/31', state: 'none' },
  {
    no: 5,
    label: '5주차',
    range: '4/1 ~ 4/7',
    state: 'rejected',
    note: '반려 재제출 필요',
  },
  { no: 6, label: '6주차', range: '4/8 ~ 4/14', state: 'none' },
  { no: 12, label: '12주차', range: '5/13 ~ 5/19', state: 'none' },
  { no: 13, label: '13주차', range: '5/20 ~ 5/26', state: 'none' },
]

// '더보기'로 펼칠 추가 주차(14~21) — WeekPicker가 처음엔 8개만 보이고 더보기로 노출한다.
const COHORT_START = new Date(2026, 2, 4) // 3/4
const fmtMD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
function weekRange(no: number): string {
  const s = new Date(COHORT_START)
  s.setDate(s.getDate() + (no - 1) * 7)
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  return `${fmtMD(s)} ~ ${fmtMD(e)}`
}
for (let no = 14; no <= 21; no++) {
  createWeeks.push({
    no,
    label: `${no}주차`,
    range: weekRange(no),
    state: 'none',
  })
}

const mockBlogForm: BlogFormData = {
  cohortLabel: '기수 기간 2026-03-04 ~ 2026-08-29 · 26주차',
  weeks: createWeeks,
  moreLabel: '더보기 14~21',
  selectedNo: 12,
  title: '',
  url: '',
}

// 블로그 수정 폼 주차 그리드(반려 기록 컨텍스트).
const editWeeks: WeekCell[] = [
  { no: 1, label: '1주차', range: '3/4 ~ 3/10', state: 'none' },
  { no: 2, label: '2주차', range: '3/11 ~ 3/17', state: 'none' },
  {
    no: 3,
    label: '3주차',
    range: '3/18 ~ 3/24',
    state: 'approved',
    note: '승인됨',
  },
  { no: 4, label: '4주차', range: '3/25 ~ 3/31', state: 'none' },
  {
    no: 8,
    label: '8주차',
    range: '4/22 ~ 4/28',
    state: 'rejected',
    note: '반려 재제출 필요',
  },
  { no: 6, label: '6주차', range: '4/8 ~ 4/14', state: 'none' },
  {
    no: 12,
    label: '12주차',
    range: '5/13 ~ 5/19',
    state: 'completed',
    note: '완료',
  },
  { no: 13, label: '13주차', range: '5/20 ~ 5/26', state: 'none' },
]

const mockBlogEdit: BlogFormData = {
  cohortLabel: '기수 기간 2026-03-04 ~ 2026-08-29 · 26주차',
  weeks: editWeeks,
  moreLabel: '더보기 13~21',
  selectedNo: 8,
  title: 'JVM 메모리 구조 정리',
  url: 'https://kcm.sg.library.com/jvm-memory',
  rejectReason: {
    title: '반려 사유',
    detail:
      '주요 핵심 주제 분석이 부족합니다. URL 또는 본문 보완 후 다시 제출하세요.',
  },
}

// 블로그 수정 폼 데이터 — recordId로 실제 기록을 찾아 그 주차·제목·URL·반려 사유로 구성.
// (수정 시 주차는 그 기록의 주차로 고정 — 1주 1개라 다른 주차 선택 불가)
function blogEditData(recordId: string): BlogFormData {
  const rec = findRecord(recordId)
  if (!rec || rec.category !== 'blog') return mockBlogEdit
  const weekNo = parseInt(rec.weekLabel, 10) || mockBlogEdit.selectedNo
  const rejected = rec.status === 'rejected'
  const weeks: WeekCell[] = Array.from({ length: 21 }, (_, i) => {
    const no = i + 1
    const selected = no === weekNo
    return {
      no,
      label: `${no}주차`,
      range: weekRange(no),
      state: selected && rejected ? 'rejected' : 'none',
      note: selected && rejected ? '반려 재제출 필요' : undefined,
    }
  })
  return {
    cohortLabel: mockBlogEdit.cohortLabel,
    weeks,
    moreLabel: '',
    selectedNo: weekNo,
    title: rec.title,
    url: rec.url,
    rejectReason: rec.rejectReason,
  }
}

// 스터디 수정 폼 프리필(반려 기록 s1 컨텍스트).
const mockStudyEdit: StudyFormData = {
  title: '디자인 패턴 스터디 — 옵저버·전략 패턴',
  date: '2026-06-04(목)',
  startTime: '19:00',
  endTime: '21:00',
  body: '옵저버/전략 패턴을 예제 코드로 비교하고 실제 프로젝트 적용 사례를 정리했습니다. 다음 스터디 전까지 데코레이터 패턴 예제를 각자 준비합니다.',
  files: [
    { id: 'e1', name: '스터디 보드.jpg', size: '2.1MB' },
    { id: 'e2', name: '참여자 인증.jpg', size: '1.9MB' },
  ],
  rejectReason: {
    title: '반려 사유 (출처 부족)',
    detail:
      '스터디 활동 내역에 참고 자료 출처와 개인 회고가 부족합니다. 보완 후 재제출하세요.',
  },
}

// 자격증 수정 폼 프리필(반려 기록 c2 컨텍스트).
const mockCertEdit: CertFormData = {
  certType: 'PCCP',
  title: 'PCCP Lv.2 합격',
  fileName: 'pccp_certificate.png',
  fileSize: '2.4MB',
  rejectReason: {
    title: '반려 사유 (캡처 누락)',
    detail:
      '합격 화면 캡처에 응시자명과 합격 일자가 보이지 않습니다. 전체 화면으로 다시 첨부해 주세요.',
  },
}

// 스터디/자격증 수정 프리필 — 실제 기록의 제목·반려 사유를 반영(나머지 상세는 mock 유지).
// 임시저장(draft) 기록은 반려 사유가 없어 폼에서 반려 배너가 뜨지 않는다.
function studyEditData(recordId: string): StudyFormData {
  const rec = findRecord(recordId)
  if (!rec || rec.category !== 'study') return mockStudyEdit
  return { ...mockStudyEdit, title: rec.title, rejectReason: rec.rejectReason }
}
function certEditData(recordId: string): CertFormData {
  const rec = findRecord(recordId)
  if (!rec || rec.category !== 'cert') return mockCertEdit
  return { ...mockCertEdit, title: rec.title, rejectReason: rec.rejectReason }
}

// 등록 시 합성할 기록 id 시퀀스 + 보조 변환.
let recordSeq = 0
// 블로그 제목은 폼에 따로 없어 URL에서 유추(마지막 경로 세그먼트 → 없으면 호스트).
function deriveBlogTitle(url: string): string {
  try {
    const u = new URL(url)
    const seg = u.pathname.split('/').filter(Boolean).pop()
    return seg ? decodeURIComponent(seg).replace(/[-_]/g, ' ') : u.hostname
  } catch {
    return '새 블로그 기록'
  }
}
// 스터디는 주차가 없어 날짜로 기수 주차를 유추(정렬·표시에 쓰임).
function weekLabelFromDate(dateStr: string): string {
  const m = dateStr.match(/\d{4}-\d{2}-\d{2}/)
  if (!m) return '스터디'
  const d = new Date(m[0])
  const diff = Math.floor(
    (d.getTime() - COHORT_START.getTime()) / (7 * 86400000),
  )
  const no = diff + 1
  return no >= 1 ? `${no}주차` : '스터디'
}
// 수정 재제출 — 변경 외 공통 처리(검토 중 전환·반려 사유 제거·검토 대기 표기).
function markResubmitted(rec: BlogRecord) {
  rec.status = 'reviewing'
  rec.statusLabel = '검토 중'
  rec.statusAt = '검토 대기 · 결과 대기 중'
  rec.submittedAt = '방금 수정'
  rec.rejectReason = undefined
  rec.canEdit = false
  rec.canDelete = true
}
function findRecord(id: string): BlogRecord | undefined {
  return mockOverview.records.find((r) => r.id === id)
}
// 등록 시 상태 — draft(임시저장)는 작성 중·수강생 본인만 노출(검토 큐 미상정), 그 외 검토 중.
function recordStateFor(draft?: boolean) {
  return draft
    ? {
        status: 'draft' as const,
        statusLabel: '작성 중',
        submittedAt: '임시저장',
        statusAt: '증빙 추가 후 제출하세요',
        canEdit: true,
      }
    : {
        status: 'reviewing' as const,
        statusLabel: '검토 중',
        submittedAt: '방금 제출',
        statusAt: '검토 대기 · 결과 대기 중',
        canEdit: false,
      }
}
// 수정 저장 — draft 플래그가 오면 임시저장(작성 중) 유지/전환, 없으면 반려 재제출(검토 중).
function applyResubmit(rec: BlogRecord, draft?: boolean) {
  if (typeof draft === 'boolean') {
    Object.assign(rec, recordStateFor(draft))
    rec.rejectReason = undefined
  } else {
    markResubmitted(rec)
  }
}

export const handlers = [
  http.get('/api/student/records', () => ok(mockOverview)),
  http.get('/api/student/records/blog-form', () => ok(mockBlogForm)),
  http.get('/api/student/records/blog/:recordId', ({ params }) =>
    ok(blogEditData(String(params.recordId))),
  ),
  http.get('/api/student/records/study/:recordId', ({ params }) =>
    ok(studyEditData(String(params.recordId))),
  ),
  http.get('/api/student/records/certificate/:recordId', ({ params }) =>
    ok(certEditData(String(params.recordId))),
  ),

  // 블로그 등록 — 새 기록(검토 중)을 목록 맨 앞에 추가하고 집계 갱신.
  http.post('/api/student/records/blog', async ({ request }) => {
    const body = (await request.json()) as {
      weekNo: number
      weekLabel: string
      dateRange: string
      title: string
      url: string
    }
    // 주차당 1개 — 같은 주차에 블로그가 있으면(상태 불문) 새 등록 차단(409).
    // 반려 건도 그 주차를 점유하므로 새로 만들지 말고 수정 후 재제출해야 한다.
    const existing = mockOverview.records.find(
      (r) => r.category === 'blog' && r.weekLabel === body.weekLabel,
    )
    if (existing) {
      const tail =
        existing.status === 'rejected'
          ? ' 반려된 기록을 수정 후 재제출해 주세요.'
          : ''
      return HttpResponse.json(
        {
          message: `${body.weekLabel}에는 이미 블로그가 있어요. 한 주에 1개만 등록할 수 있습니다.${tail}`,
        },
        { status: 409 },
      )
    }
    const record: BlogRecord = {
      id: `blog-new-${recordSeq++}`,
      category: 'blog',
      weekLabel: body.weekLabel,
      dateRange: body.dateRange,
      title: body.title?.trim() || deriveBlogTitle(body.url),
      url: body.url,
      instructor: '운영자 검토',
      canDelete: true,
      ...recordStateFor(false),
    }
    mockOverview.records = [record, ...mockOverview.records]
    syncRecordAggregates()
    return ok<BlogRecord>(record)
  }),

  // 스터디 등록 — 새 기록을 목록 맨 앞에 추가(draft면 작성 중)하고 집계 갱신.
  http.post('/api/student/records/study', async ({ request }) => {
    const body = (await request.json()) as {
      title: string
      date: string
      startTime: string
      endTime: string
      fileCount: number
      draft?: boolean
    }
    const record: BlogRecord = {
      id: `study-new-${recordSeq++}`,
      category: 'study',
      weekLabel: weekLabelFromDate(body.date),
      dateRange: body.date,
      title: body.title,
      url: '',
      instructor: '운영자 검토',
      canDelete: true,
      ...recordStateFor(body.draft),
    }
    mockOverview.records = [record, ...mockOverview.records]
    syncRecordAggregates()
    return ok<BlogRecord>(record)
  }),

  // 자격증 등록 — 새 기록을 목록 맨 앞에 추가(draft면 작성 중)하고 집계 갱신.
  http.post('/api/student/records/certificate', async ({ request }) => {
    const body = (await request.json()) as {
      certType: string
      title: string
      otherCertName?: string
      draft?: boolean
    }
    const record: BlogRecord = {
      id: `cert-new-${recordSeq++}`,
      category: 'cert',
      weekLabel: '취득',
      dateRange: '직접 입력',
      title: body.title,
      url: '',
      instructor: '운영자 검토',
      canDelete: true,
      ...recordStateFor(body.draft),
    }
    mockOverview.records = [record, ...mockOverview.records]
    syncRecordAggregates()
    return ok<BlogRecord>(record)
  }),

  // 블로그 수정(재제출) — URL 변경 반영 + 검토 중 전환.
  http.patch(
    '/api/student/records/blog/:recordId',
    async ({ request, params }) => {
      const body = (await request.json()) as { url: string; title?: string }
      const rec = findRecord(String(params.recordId))
      if (!rec) {
        return HttpResponse.json(
          { message: '기록을 찾을 수 없습니다.' },
          { status: 404 },
        )
      }
      rec.url = body.url
      if (body.title?.trim()) rec.title = body.title.trim()
      applyResubmit(rec)
      syncRecordAggregates()
      return ok<BlogRecord>(rec)
    },
  ),

  // 스터디 수정(재제출) — 제목·일정 변경 반영 + 검토 중 전환.
  http.patch(
    '/api/student/records/study/:recordId',
    async ({ request, params }) => {
      const body = (await request.json()) as {
        title: string
        date: string
        draft?: boolean
      }
      const rec = findRecord(String(params.recordId))
      if (!rec) {
        return HttpResponse.json(
          { message: '기록을 찾을 수 없습니다.' },
          { status: 404 },
        )
      }
      rec.title = body.title
      if (body.date) rec.dateRange = body.date
      applyResubmit(rec, body.draft)
      syncRecordAggregates()
      return ok<BlogRecord>(rec)
    },
  ),

  // 자격증 수정(재제출) — 제목 변경 반영 + 검토 중 전환.
  http.patch(
    '/api/student/records/certificate/:recordId',
    async ({ request, params }) => {
      const body = (await request.json()) as {
        certType: string
        title: string
        otherCertName?: string
        draft?: boolean
      }
      const rec = findRecord(String(params.recordId))
      if (!rec) {
        return HttpResponse.json(
          { message: '기록을 찾을 수 없습니다.' },
          { status: 404 },
        )
      }
      rec.title = body.title
      applyResubmit(rec, body.draft)
      syncRecordAggregates()
      return ok<BlogRecord>(rec)
    },
  ),

  // (테스트 UI 전용) 운영자 검토 시뮬레이션 — 지정한 기록 1건을 승인/반려한다.
  // BE 연동 시 운영 콘솔(P0_17 검토 큐)이 처리하므로 이 핸들러는 테스트 UI와 함께 제거한다.
  http.post('/api/student/records/sim/review', async ({ request }) => {
    const { id, action } = (await request.json()) as {
      id: string
      action: 'approve' | 'reject'
    }
    const rec = findRecord(id)
    if (!rec) return ok<{ record: BlogRecord | null }>({ record: null })
    if (action === 'approve') {
      rec.status = 'approved'
      rec.statusLabel = '승인'
      rec.statusAt = '방금 승인'
      rec.rejectReason = undefined
      rec.canEdit = false
      rec.canDelete = false
    } else {
      rec.status = 'rejected'
      rec.statusLabel = '반려'
      rec.statusAt = '방금 반려'
      rec.rejectReason = {
        title: '반려 사유 (운영자 검토)',
        detail:
          '제출 내용에 보완이 필요합니다. 사유를 확인하고 수정 후 재제출해 주세요.',
      }
      rec.canEdit = true
      rec.canDelete = true
    }
    syncRecordAggregates()
    return ok<{ record: BlogRecord }>({ record: rec })
  }),
]
