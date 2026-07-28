import { http, HttpResponse } from 'msw'
import type {
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
      { id: 'att-seed-1', fileName: '진단서.pdf', fileSize: 24_000 },
    ],
  },
  // 페이지네이션 데모용 과거 제출 — 예전 기록도 넘겨 볼 수 있게 보강.
  {
    id: 'af4',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-05-02',
    submittedAt: '2026-05-02T09:05:00Z',
    attendanceType: 'LATE',
    expectedArrivalTime: '09:40',
    officialLeaveUsed: false,
    officialLeaveType: null,
    note: '지하철 지연',
  },
  {
    id: 'af5',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-04-28',
    submittedAt: '2026-04-28T14:10:00Z',
    attendanceType: 'EARLY_LEAVE',
    expectedLeaveTime: '16:00',
    officialLeaveUsed: false,
    officialLeaveType: null,
    note: '병원 예약',
  },
  {
    id: 'af6',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-04-24',
    submittedAt: '2026-04-24T13:00:00Z',
    attendanceType: 'OUTING',
    outingStartTime: '13:00',
    outingEndTime: '15:00',
    officialLeaveUsed: true,
    officialLeaveType: 'RESERVE',
    note: '예비군 훈련',
  },
  {
    id: 'af7',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-04-20',
    submittedAt: '2026-04-20T08:55:00Z',
    attendanceType: 'ABSENT',
    officialLeaveUsed: true,
    officialLeaveType: 'VACATION',
    note: '가족 경조사',
  },
  {
    id: 'af8',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-04-16',
    submittedAt: '2026-04-16T09:20:00Z',
    attendanceType: 'LATE',
    expectedArrivalTime: '10:00',
    officialLeaveUsed: false,
    officialLeaveType: null,
    note: '교통 체증',
  },
  {
    id: 'af9',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-04-10',
    submittedAt: '2026-04-10T13:30:00Z',
    attendanceType: 'OUTING',
    outingStartTime: '13:30',
    outingEndTime: '16:30',
    officialLeaveUsed: true,
    officialLeaveType: 'INTERVIEW',
    note: '면접',
  },
  {
    id: 'af10',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-04-06',
    submittedAt: '2026-04-06T15:00:00Z',
    attendanceType: 'EARLY_LEAVE',
    expectedLeaveTime: '15:30',
    officialLeaveUsed: false,
    officialLeaveType: null,
    note: '몸살 기운',
  },
  {
    id: 'af11',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-04-02',
    submittedAt: '2026-04-02T09:10:00Z',
    attendanceType: 'LATE',
    expectedArrivalTime: '09:35',
    officialLeaveUsed: false,
    officialLeaveType: null,
    note: '버스 지연',
  },
  {
    id: 'af12',
    studentId: 'mock-1',
    cohortId: 'c1',
    targetDate: '2026-03-27',
    submittedAt: '2026-03-27T08:45:00Z',
    attendanceType: 'ABSENT',
    officialLeaveUsed: true,
    officialLeaveType: 'SICK',
    note: '장염',
  },
]

// 캘린더·대상일자는 현재 월 기준으로 만든다(조회 시 항상 이번 달이 먼저 보이도록).
const now = new Date()
const CUR_YEAR = now.getFullYear()
const CUR_MONTH = now.getMonth() + 1 // 1~12
const TODAY_DATE = now.getDate()
const pad2 = (n: number) => String(n).padStart(2, '0')
const isoDate = (day: number) => `${CUR_YEAR}-${pad2(CUR_MONTH)}-${pad2(day)}`
const TODAY_ISO = isoDate(TODAY_DATE)

// 이번 달 평일 출결 — 대부분 출석, 며칠은 변형. 오늘까지만 채운다.
const SPECIAL_STATUS: Record<number, HrdAttendanceStatus> = {
  4: 'LATE',
  6: 'ABSENT',
  8: 'OUTING',
  11: 'EARLY_LEAVE',
  12: 'LATE',
}
const mockCalendarDays: HrdAttendanceDay[] = []
for (let day = 1; day <= TODAY_DATE; day++) {
  const dow = new Date(CUR_YEAR, CUR_MONTH - 1, day).getDay()
  if (dow === 0 || dow === 6) continue // 주말 제외
  mockCalendarDays.push({
    date: isoDate(day),
    status: SPECIAL_STATUS[day] ?? 'PRESENT',
  })
}

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
  calendar: {
    year: CUR_YEAR,
    month: CUR_MONTH,
    today: TODAY_ISO,
    days: mockCalendarDays,
  },
  submissions: mockAttendanceSubmissions,
}

const mockAttendanceFormMeta: AttendanceFormMeta = {
  ...ATTENDANCE_COHORT,
  targetDate: TODAY_ISO,
  canSubmit: true,
  latestSubmission: {
    attendanceType: 'LATE',
    submittedAt: '2026-05-21T09:42:00Z',
  },
}

// 첨부 파일명(string[]) → 첨부 메타(AttendanceAttachment[]). mock은 파일명만 보존.
let submissionSeq = 0

// 출결 폼(me — 메타/제출/증빙)은 VITE_REAL_AUTH=true면 learning-service 실연동(이 mock 미등록 → proxy).
// 출결 전체(overview·폼)는 VITE_REAL_AUTH=true면 learning-service 실연동(mock 미등록 → proxy).
const realAttendanceForm = import.meta.env.VITE_REAL_AUTH === 'true'

// 자동 수집 규약: features/**/mocks.ts 는 `handlers`를 내보낸다(mocks/handlers.ts가 glob으로 등록).
export const handlers = [
  ...(realAttendanceForm
    ? []
    : [
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
              attachments: [],
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

      ]),
]
