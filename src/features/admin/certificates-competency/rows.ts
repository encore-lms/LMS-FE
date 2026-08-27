import type { StudentAccount } from '@/shared/types'
import type { CompetencyCertRow } from './types'

/** 서버 심사 행이 아직 없는 실제 로스터 수강생을 안전한 초기 상태로 만든다. */
export function toCertRow(
  student: StudentAccount,
  cohortLabel: string,
): CompetencyCertRow {
  return {
    studentId: student.id,
    studentName: student.name,
    studentUuid: student.studentUuid,
    cohortLabel,
    status: 'cohort_open',
    published: false,
    openable: false,
    goldStatus: 'UNKNOWN',
    goldIssues: [],
    goldCheckedAt: null,
    goldManagerNotifiedAt: null,
    analysisStatus: 'UNKNOWN',
    analysisRunId: null,
    analysisSourceVersion: null,
    analysisFailure: null,
    analysisCheckedAt: null,
    analysisManagerNotifiedAt: null,
  }
}
