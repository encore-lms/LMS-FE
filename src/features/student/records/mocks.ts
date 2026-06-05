import { http, HttpResponse } from 'msw'
import type { BlogFormData, RecordsOverview, WeekCell } from './types'

// 기록실 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// 데이터는 Figma 기록실(246:27)·블로그 폼(267:27)·블로그 수정(2208:16414) 시안 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

const mockOverview: RecordsOverview = {
  tabs: [
    { key: 'all', label: '전체', count: 24 },
    { key: 'blog', label: '블로그', count: 12 },
    { key: 'study', label: '스터디', count: 4 },
    { key: 'cert', label: '자격증', count: 3 },
    { key: 'resume', label: '이력서', count: 1 },
  ],
  stats: [
    {
      key: 'total',
      label: '전체 기록',
      value: '24',
      unit: '건',
      sub: '블로그 12 · 스터디 4 · 자격증 3 · 이력서 1',
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

export const handlers = [
  http.get('/api/student/records', () => ok(mockOverview)),
  http.get('/api/student/records/blog-form', () => ok(mockBlogForm)),
  http.get('/api/student/records/blog/:recordId', () => ok(mockBlogEdit)),
]
