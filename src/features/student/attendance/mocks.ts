import { http, HttpResponse } from 'msw'
import type {
  AttendanceOverview,
  AttendanceFormMeta,
  AttendanceFormSubmission,
  AttendanceFormPayload,
  HrdAttendanceDay,
} from './types'

// 출결 mock — 기능 로컬. mocks/handlers.ts에서 import 후 spread로 등록(공유 핸들러 파일 최소 터치).
// 데이터는 Figma 시안(2026년 5월) 그대로 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

const ATTENDANCE_COHORT = {
  cohortId: 'c1',
  courseName: 'AI 엔지니어 양성 과정',
  cohortName: '5기',
}

const mockAttendanceSubmissions: AttendanceFormSubmission[] = [
  {
    id: 'af1',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-05-12',
    submittedAt: '2026-05-12T09:14:00Z',
    attendanceType: 'LATE',
    expectedArrivalTime: '10:30',
    officialLeaveUsed: false,
    officialLeaveType: null,
    note: '버스 지연으로 늦었습니다',
  },
  {
    id: 'af2',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-05-08',
    submittedAt: '2026-05-08T13:02:00Z',
    attendanceType: 'OUTING',
    outingStartTime: '13:00',
    outingEndTime: '17:00',
    officialLeaveUsed: true,
    officialLeaveType: 'INTERVIEW',
    note: '오후 채용 면접 일정',
  },
  {
    id: 'af3',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-05-06',
    submittedAt: '2026-05-06T08:50:00Z',
    attendanceType: 'ABSENT',
    officialLeaveUsed: true,
    officialLeaveType: 'SICK',
    note: '감기 몸살로 결석',
  },
]

const mockCalendarDays: HrdAttendanceDay[] = [
  { date: '2026-05-01', status: 'PRESENT' },
  { date: '2026-05-04', status: 'LATE' },
  { date: '2026-05-05', status: 'PRESENT' },
  { date: '2026-05-06', status: 'ABSENT' },
  { date: '2026-05-07', status: 'PRESENT' },
  { date: '2026-05-08', status: 'OUTING' },
  { date: '2026-05-11', status: 'EARLY_LEAVE' },
  { date: '2026-05-12', status: 'LATE' },
  { date: '2026-05-13', status: 'PRESENT' },
  { date: '2026-05-14', status: 'PRESENT' },
]

const mockAttendanceOverview: AttendanceOverview = {
  ...ATTENDANCE_COHORT,
  summary: {
    attendanceRate: 92,
    presentDays: 85,
    totalDays: 92,
    lateCount: 2,
    earlyLeaveCount: 1,
    outingCount: 0,
    absentCount: 1,
  },
  calendar: { year: 2026, month: 5, days: mockCalendarDays },
  submissions: mockAttendanceSubmissions,
}

const mockAttendanceFormMeta: AttendanceFormMeta = {
  ...ATTENDANCE_COHORT,
  targetDate: '2026-05-22',
  canSubmit: true,
  latestSubmission: {
    attendanceType: 'LATE',
    submittedAt: '2026-05-21T09:42:00Z',
  },
}

// 자동 수집 규약: features/**/mocks.ts 는 `handlers`를 내보낸다(mocks/handlers.ts가 glob으로 등록).
export const handlers = [
  http.get('/api/student/attendance/overview', () =>
    ok<AttendanceOverview>(mockAttendanceOverview),
  ),

  http.get('/api/student/attendance-forms/:cohortId', () =>
    ok<AttendanceFormMeta>(mockAttendanceFormMeta),
  ),

  http.post(
    '/api/student/attendance-forms/:cohortId/submissions',
    async ({ request, params }) => {
      const body = (await request.json()) as AttendanceFormPayload
      return ok<AttendanceFormSubmission>({
        id: 'af-new',
        studentId: 'mock-1',
        cohortId: String(params.cohortId),
        targetDate: mockAttendanceFormMeta.targetDate,
        submittedAt: '2026-05-22T09:00:00Z',
        attendanceType: body.attendanceType,
        expectedArrivalTime: body.expectedArrivalTime ?? null,
        expectedLeaveTime: body.expectedLeaveTime ?? null,
        outingStartTime: body.outingStartTime ?? null,
        outingEndTime: body.outingEndTime ?? null,
        officialLeaveUsed: body.officialLeaveUsed,
        officialLeaveType: body.officialLeaveType ?? null,
        officialLeaveOtherReason: body.officialLeaveOtherReason ?? null,
        note: body.note ?? null,
        attachments: null,
      })
    },
  ),
]
