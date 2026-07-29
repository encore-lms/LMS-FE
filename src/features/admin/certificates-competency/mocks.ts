import {
  CERTIFICATE_DEMO_STUDENTS,
  type CertificateDemoStudent,
} from '@/features/student/certificate/demoStudents'
import type { StudentAccount } from '@/shared/types'
import type { CompetencyCertRow, CompetencyCertStatus } from './types'

// 명단은 실제 로스터, 증명서 값은 데모 — BE 가 붙기 전까지의 임시 조합이다.
// 수강생 id 로 데모를 고르므로 새로고침해도 같은 사람에게 같은 값이 붙는다.

/** 문자열을 안정적인 양의 정수로 — 같은 수강생이면 늘 같은 값이 나온다. */
function hash(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const STATUS_CYCLE: CompetencyCertStatus[] = [
  'certified',
  'reviewing',
  'draft',
  'certified',
  'changes_requested',
]

export function demoOf(studentId: string): CertificateDemoStudent {
  const list = CERTIFICATE_DEMO_STUDENTS
  return list[hash(studentId) % list.length]
}

/**
 * 로스터 한 명 → 증명서 목록 한 줄.
 *
 * 인증 완료(certified)인 사람만 공개될 수 있다 — 검토가 끝나지 않은 증명서를
 * 외부에 여는 일은 없어야 한다.
 */
export function toCertRow(
  student: StudentAccount,
  cohortLabel: string,
): CompetencyCertRow {
  const demo = demoOf(student.id)
  const seed = hash(student.id)
  const status = STATUS_CYCLE[seed % STATUS_CYCLE.length]
  return {
    studentId: student.id,
    studentName: student.name,
    studentUuid: student.studentUuid,
    cohortLabel,
    status,
    // 공개는 인증 완료 건에서만 켜진다.
    published: status === 'certified' && seed % 3 === 0,
    overallScore: demo.overallScore,
    profileLabel: demo.profileLabel,
    updatedAt: demo.periodLabel.split('—')[1]?.trim() ?? '',
  }
}
