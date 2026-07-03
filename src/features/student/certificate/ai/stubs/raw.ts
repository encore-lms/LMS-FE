// 원천(raw) 입력 stub (개발용) — 서버가 CSV/BE에서 조립할 데이터의 예시.
// 나중에 실데이터로 교체. 지금은 이걸로 계산 함수(derive) 검증.
import type { StudentRaw } from '../types'

export const RAW_STUBS: Record<string, StudentRaw> = {
  'stu-001': {
    studentId: 'stu-001',
    achievement: 88,
    cs: 82,
    codingTest: 70,
    exams: [
      { at: '2026-03-10', score: 72 },
      { at: '2026-04-02', score: 85 },
      { at: '2026-04-28', score: 90 },
    ],
    peerEvals: [
      {
        collaboration: 84,
        communication: 74,
        responsibility: 90,
        problemSolving: 88,
        techContribution: 86,
      },
    ],
    attendanceRate: 96,
    certifiedTsCount: 8,
  },
}
