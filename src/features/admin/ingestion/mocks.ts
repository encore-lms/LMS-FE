import { http, HttpResponse } from 'msw'
import type {
  IngestionOverview,
  IngestionSession,
  SessionDetail,
} from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 세션 이력 (Figma 1185:6029) ──
const sessions: IngestionSession[] = [
  {
    id: 'sess-1',
    at: '05-19 09:42',
    domain: '학생 명단 (과거)',
    successRows: 1247,
    failedRows: 8,
    status: 'in_progress',
  },
  {
    id: 'sess-2',
    at: '05-18 16:30',
    domain: '프로젝트',
    successRows: 328,
    failedRows: 42,
    status: 'has_failure',
  },
  {
    id: 'sess-3',
    at: '05-17 14:21',
    domain: '이력서',
    successRows: 512,
    failedRows: 0,
    status: 'success',
  },
  {
    id: 'sess-4',
    at: '05-16 11:08',
    domain: '기록실 (블로그)',
    successRows: 2104,
    failedRows: 23,
    status: 'has_failure',
  },
  {
    id: 'sess-5',
    at: '05-15 09:00',
    domain: '트러블슈팅',
    successRows: 184,
    failedRows: 5,
    status: 'discarded',
  },
  {
    id: 'sess-6',
    at: '05-14 18:42',
    domain: '학생 명단 (과거)',
    successRows: 892,
    failedRows: 14,
    status: 'has_failure',
  },
]

// ── 세션별 상세 ──
const details: Record<string, SessionDetail> = {
  'sess-1': {
    sessionId: 'sess-1',
    status: 'in_progress',
    summaryLine: '05-19 09:42 · 학생 명단 (과거) · 1,255행 중 8건 실패',
    categories: [
      { id: 'dup', reason: '중복 UUID', count: 3 },
      { id: 'required', reason: '필수 컬럼 누락', count: 2 },
      { id: 'date', reason: '날짜 형식 오류', count: 2 },
      { id: 'encoding', reason: '인코딩 깨짐', count: 1 },
    ],
    rows: [
      {
        id: 'r42',
        lineNo: 42,
        reason: '중복 UUID',
        detail: 'studentUuid abc-1234 (4행과 중복)',
      },
      {
        id: 'r87',
        lineNo: 87,
        reason: '필수 컬럼 누락',
        detail: 'birthdate 비어 있음',
      },
      {
        id: 'r120',
        lineNo: 120,
        reason: '날짜 형식 오류',
        detail: 'enrolledAt 형식 불일치',
      },
      {
        id: 'r142',
        lineNo: 142,
        reason: '중복 UUID',
        detail: 'studentUuid def-5678 (이미 LMS 존재)',
      },
      {
        id: 'r189',
        lineNo: 189,
        reason: '인코딩 깨짐',
        detail: 'name 필드 UTF-8 디코드 실패',
      },
    ],
  },
  'sess-2': {
    sessionId: 'sess-2',
    status: 'has_failure',
    summaryLine: '05-18 16:30 · 프로젝트 · 370행 중 42건 실패',
    categories: [
      { id: 'required', reason: '필수 컬럼 누락', count: 20 },
      { id: 'date', reason: '날짜 형식 오류', count: 15 },
      { id: 'dup', reason: '중복 UUID', count: 7 },
    ],
    rows: [
      {
        id: 'r5',
        lineNo: 5,
        reason: '필수 컬럼 누락',
        detail: 'repoUrl 비어 있음',
      },
      {
        id: 'r18',
        lineNo: 18,
        reason: '날짜 형식 오류',
        detail: 'submittedAt 형식 불일치',
      },
    ],
  },
  'sess-3': {
    sessionId: 'sess-3',
    status: 'success',
    summaryLine: '05-17 14:21 · 이력서 · 512행 전량 성공',
    categories: [],
    rows: [],
  },
  'sess-4': {
    sessionId: 'sess-4',
    status: 'has_failure',
    summaryLine: '05-16 11:08 · 기록실 (블로그) · 2,127행 중 23건 실패',
    categories: [
      { id: 'url', reason: 'URL 형식 오류', count: 12 },
      { id: 'dup', reason: '중복 제출', count: 8 },
      { id: 'required', reason: '필수 컬럼 누락', count: 3 },
    ],
    rows: [
      {
        id: 'r9',
        lineNo: 9,
        reason: 'URL 형식 오류',
        detail: 'blogUrl 스킴 누락',
      },
      {
        id: 'r31',
        lineNo: 31,
        reason: '중복 제출',
        detail: '동일 주차 중복 제출',
      },
    ],
  },
  'sess-5': {
    sessionId: 'sess-5',
    status: 'discarded',
    summaryLine: '05-15 09:00 · 트러블슈팅 · 폐기됨 (작업 불가)',
    categories: [],
    rows: [],
  },
  'sess-6': {
    sessionId: 'sess-6',
    status: 'has_failure',
    summaryLine: '05-14 18:42 · 학생 명단 (과거) · 906행 중 14건 실패',
    categories: [
      { id: 'dup', reason: '중복 UUID', count: 9 },
      { id: 'encoding', reason: '인코딩 깨짐', count: 5 },
    ],
    rows: [
      {
        id: 'r12',
        lineNo: 12,
        reason: '중복 UUID',
        detail: 'studentUuid ghi-9012 (이미 존재)',
      },
      {
        id: 'r77',
        lineNo: 77,
        reason: '인코딩 깨짐',
        detail: 'address 필드 디코드 실패',
      },
    ],
  },
}

const overview: IngestionOverview = {
  summary: {
    totalSessions: 42,
    totalSessionsHint: '최근 30일',
    successRows: 12847,
    successRowsHint: '총 인입의 96.4%',
    quarantinedRows: 483,
    inProgress: 1,
    inProgressHint: 'AI 캠프 22기 학생 명단',
  },
  sessions,
  details,
}

export const handlers = [
  http.get('/api/admin/ingestion/quarantine', () =>
    ok<IngestionOverview>(overview),
  ),
]
