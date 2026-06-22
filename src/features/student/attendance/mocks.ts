import { http, HttpResponse } from 'msw'
import type {
  AttendanceAttachment,
  AttendanceOverview,
  AttendanceFormMeta,
  AttendanceFormSubmission,
  AttendanceFormPayload,
  HrdAttendanceDay,
  HrdAttendanceStatus,
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
    attachments: [
      { id: 'att-seed-1', fileName: '진단서.pdf', size: 0, contentType: '' },
    ],
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

// 첨부 파일명(string[]) → 첨부 메타(AttendanceAttachment[]). mock은 파일명만 보존.
let attachmentSeq = 0
const toAttachments = (names: string[] = []): AttendanceAttachment[] =>
  names.map((fileName) => ({
    id: `att-${attachmentSeq++}`,
    fileName,
    size: 0,
    contentType: '',
  }))

let submissionSeq = 0

// 자동 수집 규약: features/**/mocks.ts 는 `handlers`를 내보낸다(mocks/handlers.ts가 glob으로 등록).
export const handlers = [
  http.get('/api/student/attendance/overview', () =>
    ok<AttendanceOverview>(mockAttendanceOverview),
  ),

  http.get('/api/student/attendance-forms/:cohortId', () =>
    ok<AttendanceFormMeta>(mockAttendanceFormMeta),
  ),

  // 출결 폼 제출 — 제출 이력(같은 대상일자 1건 덮어쓰기)과 HRD 캘린더에 실제 반영한다.
  http.post(
    '/api/student/attendance-forms/:cohortId/submissions',
    async ({ request, params }) => {
      const body = (await request.json()) as AttendanceFormPayload
      const targetDate = mockAttendanceFormMeta.targetDate
      const submission: AttendanceFormSubmission = {
        id: `af-new-${submissionSeq++}`,
        studentId: 'mock-1',
        cohortId: String(params.cohortId),
        targetDate,
        submittedAt: `${targetDate}T09:00:00Z`,
        attendanceType: body.attendanceType,
        expectedArrivalTime: body.expectedArrivalTime ?? null,
        expectedLeaveTime: body.expectedLeaveTime ?? null,
        outingStartTime: body.outingStartTime ?? null,
        outingEndTime: body.outingEndTime ?? null,
        officialLeaveUsed: body.officialLeaveUsed,
        officialLeaveType: body.officialLeaveType ?? null,
        officialLeaveOtherReason: body.officialLeaveOtherReason ?? null,
        note: body.note ?? null,
        attachments: toAttachments(body.attachmentNames),
      }
      // 제출 이력: 같은 대상일자 기존 1건은 덮어쓰고 최신을 맨 앞에 둔다.
      const prevIdx = mockAttendanceSubmissions.findIndex(
        (s) => s.targetDate === targetDate,
      )
      if (prevIdx >= 0) mockAttendanceSubmissions.splice(prevIdx, 1)
      mockAttendanceSubmissions.unshift(submission)
      // 캘린더: 대상일자 상태를 출결 유형으로 표시(있으면 갱신, 없으면 추가).
      const status: HrdAttendanceStatus = body.attendanceType
      const day = mockCalendarDays.find((d) => d.date === targetDate)
      if (day) day.status = status
      else mockCalendarDays.push({ date: targetDate, status })
      // 폼 메타의 최근 제출도 갱신(다음 진입 시 덮어쓰기 경고에 반영).
      mockAttendanceFormMeta.latestSubmission = {
        attendanceType: submission.attendanceType,
        submittedAt: submission.submittedAt,
      }
      return ok<AttendanceFormSubmission>(submission)
    },
  ),

  // 증빙 첨부만 따로 수정 — 제출 이력에서 사후 증빙 추가/교체(다른 항목은 불변).
  http.patch(
    '/api/student/attendance-forms/:cohortId/submissions/:id/attachments',
    async ({ request, params }) => {
      const body = (await request.json()) as { attachmentNames: string[] }
      const target = mockAttendanceSubmissions.find(
        (s) => s.id === String(params.id),
      )
      if (!target) {
        return HttpResponse.json(
          { message: '제출 이력을 찾을 수 없습니다.' },
          { status: 404 },
        )
      }
      target.attachments = toAttachments(body.attachmentNames)
      return ok<AttendanceFormSubmission>(target)
    },
  ),
]
