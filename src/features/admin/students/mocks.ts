import { http, HttpResponse } from 'msw'
import type { AttendanceFormData } from '@/shared/types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

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

// 계정 목록(/users/students)·출결(/admin/courses/.../attendance)은 실 BE로 이동(mock 제거).
// 출결 폼 검토 탭은 아직 mock 유지.
export const handlers = [
  http.get('/api/admin/students/attendance-forms', () =>
    ok<AttendanceFormData>(attendanceForms),
  ),
]
