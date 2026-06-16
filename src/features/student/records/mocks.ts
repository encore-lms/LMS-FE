import { http, HttpResponse } from 'msw'
import type {
  BlogFormData,
  CertFormData,
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
      instructor: '강사 이정훈',
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
      instructor: '강사 이정훈',
      submittedAt: '2026.05.04 제출',
      statusAt: '2026.05.06 승인',
      canEdit: false,
      canDelete: false,
    },
    {
      id: 'b8',
      category: 'blog',
      weekLabel: '9주차',
      dateRange: '4/22 ~ 4/28',
      status: 'rejected',
      statusLabel: '반려',
      title: 'JVM 메모리 구조 정리',
      url: 'https://kcm.sg.library.com/jvm-memory',
      instructor: '강사 이정훈',
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
      instructor: '강사 이정훈',
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
      instructor: '강사 이정훈',
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
      instructor: '강사 이정훈',
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
      instructor: '강사 이정훈',
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
      instructor: '강사 이정훈',
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

const mockBlogForm: BlogFormData = {
  cohortLabel: '기수 기간 2026-03-04 ~ 2026-08-29 · 26주차',
  weeks: createWeeks,
  moreLabel: '더보기 13~21',
  selectedNo: 12,
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
    no: 9,
    label: '9주차',
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
  selectedNo: 9,
  url: 'https://kcm.sg.library.com/jvm-memory',
  rejectReason: {
    title: '반려 사유',
    detail:
      '주요 핵심 주제 분석이 부족합니다. URL 또는 본문 보완 후 다시 제출하세요.',
  },
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

export const handlers = [
  http.get('/api/student/records', () => ok(mockOverview)),
  http.get('/api/student/records/blog-form', () => ok(mockBlogForm)),
  http.get('/api/student/records/blog/:recordId', () => ok(mockBlogEdit)),
  http.get('/api/student/records/study/:recordId', () => ok(mockStudyEdit)),
  http.get('/api/student/records/certificate/:recordId', () =>
    ok(mockCertEdit),
  ),
]
