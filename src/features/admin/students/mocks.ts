import { http, HttpResponse } from 'msw'
import type {
  StudentAccountQueue,
  StudentAttendanceData,
  AttendanceFormData,
} from '@/shared/types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 계정 탭 (Figma 1457:10648) ──
const accounts: StudentAccountQueue = {
  cohortLabel: 'AI 캠프 22기',
  summary: {
    total: 121,
    normal: 118,
    loginBlocked: 3,
    lastSyncAt: '09:42',
    syncCreated: 5,
    syncExisting: 116,
  },
  items: [
    {
      id: 'stu-0027',
      name: '김민준',
      studentUuid: '2024-AIB3-0027',
      birthDate: '1998-03-12',
      joinedAt: '05-01',
      lastLoginAt: '오늘 09:18',
      trainingStatus: 'active',
      loginBlocked: false,
    },
    {
      id: 'stu-0028',
      name: '이서연',
      studentUuid: '2024-AIB3-0028',
      birthDate: '1997-11-02',
      joinedAt: '05-01',
      lastLoginAt: '어제 18:30',
      trainingStatus: 'active',
      loginBlocked: false,
    },
    {
      id: 'stu-0029',
      name: '박지훈',
      studentUuid: '2024-AIB3-0029',
      birthDate: '1999-01-18',
      joinedAt: '05-02',
      lastLoginAt: '7일 전',
      trainingStatus: 'dropout',
      loginBlocked: true,
    },
    {
      id: 'stu-0030',
      name: '최유진',
      studentUuid: '2024-AIB3-0030',
      birthDate: '1998-08-21',
      joinedAt: '05-04',
      lastLoginAt: '오늘 08:42',
      trainingStatus: 'active',
      loginBlocked: false,
    },
    {
      id: 'stu-0031',
      name: '정하늘',
      studentUuid: '2024-AIB3-0031',
      birthDate: '1996-05-14',
      joinedAt: '05-04',
      lastLoginAt: '05-12 16:08',
      trainingStatus: 'active',
      loginBlocked: true,
    },
    {
      id: 'stu-0032',
      name: '한지호',
      studentUuid: '2024-AIB3-0032',
      birthDate: '1999-09-30',
      joinedAt: '05-05',
      lastLoginAt: '오늘 07:55',
      trainingStatus: 'active',
      loginBlocked: false,
    },
  ],
}

// ── 출결 탭 (Figma 1457:10799) ──
const attendance: StudentAttendanceData = {
  cohortLabel: 'AI 백엔드 3기',
  summary: {
    present: 92,
    late: 8,
    earlyLeaveOuting: 5,
    absent: 4,
    hrdMismatch: 3,
  },
  rows: [
    {
      id: 'att-1',
      studentName: '김민준',
      checkIn: '09:04',
      checkOut: '18:02',
      hrdStatus: 'normal',
      formLink: 'none',
      verify: {
        mismatchType: '없음',
        recommendedAction: 'HRD 원본 정상 — 조치 불필요',
        evidenceNeeded: '-',
        assignee: '운영 매니저',
      },
    },
    {
      id: 'att-2',
      studentName: '이서연',
      checkIn: '09:31',
      checkOut: '18:01',
      hrdStatus: 'late',
      formLink: 'submitted',
      verify: {
        mismatchType: '지각 (사유 폼 제출됨)',
        recommendedAction: '출결 폼 검토 후 정상 처리',
        evidenceNeeded: '교통 지연 캡처',
        assignee: '운영 매니저',
      },
    },
    {
      id: 'att-3',
      studentName: '박지훈',
      checkIn: null,
      checkOut: null,
      hrdStatus: 'absent',
      formLink: 'not_submitted',
      verify: {
        mismatchType: '결석 (사유 폼 미제출)',
        recommendedAction: '학생에게 출결 폼 작성 요청',
        evidenceNeeded: '결석 사유 증빙',
        assignee: '운영 매니저',
      },
    },
    {
      id: 'att-4',
      studentName: '최유진',
      checkIn: '09:00',
      checkOut: '15:20',
      hrdStatus: 'early_leave',
      formLink: 'pending',
      verify: {
        mismatchType: '조퇴 (승인 대기)',
        recommendedAction: '증빙 확인 후 승인',
        evidenceNeeded: '병원 확인서',
        assignee: '운영 매니저',
      },
    },
    {
      id: 'att-5',
      studentName: '한지원',
      checkIn: '09:06',
      checkOut: null,
      hrdStatus: 'leave_missing',
      formLink: 'none',
      verify: {
        mismatchType: '퇴실 누락',
        recommendedAction: '재동기화 후 수동 확인',
        evidenceNeeded: '강의장 출입 로그',
        assignee: '운영 매니저',
      },
    },
  ],
}

// ── 출결 폼 탭 (Figma 1457:10955) ──
const attendanceForms: AttendanceFormData = {
  cohortLabel: 'AI 백엔드 3기',
  summary: {
    totalSubmitted: 42,
    late: 16,
    earlyLeaveOuting: 9,
    absent: 7,
    officialLeaveUsed: 10,
  },
  rows: [
    {
      id: 'form-1',
      submitter: '이서연',
      targetDate: '2026-05-19',
      type: 'late',
      officialLeaveUsed: false,
      evidence: '교통 지연 캡처',
      status: 'pending',
      reason: '지하철 지연으로 27분 늦게 입실',
      evidenceFiles: 1,
    },
    {
      id: 'form-2',
      submitter: '최유진',
      targetDate: '2026-05-19',
      type: 'early_leave',
      officialLeaveUsed: true,
      evidence: '병원 확인서',
      status: 'approval_pending',
      reason: '오후 진료 예약으로 15:20 조퇴',
      evidenceFiles: 1,
    },
    {
      id: 'form-3',
      submitter: '박지훈',
      targetDate: '2026-05-18',
      type: 'absent',
      officialLeaveUsed: true,
      evidence: '진료 확인서',
      status: 'confirmed',
      reason: '독감으로 하루 결석 (공가 신청)',
      evidenceFiles: 2,
    },
    {
      id: 'form-4',
      submitter: '한지원',
      targetDate: '2026-05-17',
      type: 'outing',
      officialLeaveUsed: false,
      evidence: '면담 기록',
      status: 'changes',
      reason: '취업 상담 외출 — 증빙 보완 필요',
      evidenceFiles: 0,
    },
  ],
}

export const handlers = [
  http.get('/api/admin/students', () => ok<StudentAccountQueue>(accounts)),
  http.get('/api/admin/students/attendance', () =>
    ok<StudentAttendanceData>(attendance),
  ),
  http.get('/api/admin/students/attendance-forms', () =>
    ok<AttendanceFormData>(attendanceForms),
  ),
]
