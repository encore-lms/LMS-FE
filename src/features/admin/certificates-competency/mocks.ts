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

/** 기수가 끝난 뒤의 상태들 — 재료 수집 → 발급 흐름. */
const AFTER_COHORT: CompetencyCertStatus[] = [
  'issued',
  'data_ready',
  'data_pending',
  'issued',
  'data_rebuilding',
]

export function demoOf(studentId: string): CertificateDemoStudent {
  const list = CERTIFICATE_DEMO_STUDENTS
  return list[hash(studentId) % list.length]
}

/** 기수 종료일이 지났는지 — 안 지났으면 증명서를 만들 시점이 아니다. */
export function isCohortEnded(endDate: string | null | undefined, now = new Date()) {
  if (!endDate) return false
  const end = new Date(endDate)
  if (Number.isNaN(end.getTime())) return false
  return end.getTime() < now.getTime()
}

/**
 * 로스터 한 명 → 증명서 목록 한 줄.
 *
 * 기수가 안 끝났으면 전원 '기수 미종료'다 — 실제 종료일을 쓰므로 진행 중인 기수가
 * 발급된 것처럼 보이는 일은 없다. 그 뒤 상태와 점수는 아직 데모 값이다.
 */
export function toCertRow(
  student: StudentAccount,
  cohortLabel: string,
  cohortEndDate: string | null | undefined,
  now = new Date(),
): CompetencyCertRow {
  const demo = demoOf(student.id)
  const seed = hash(student.id)
  const status: CompetencyCertStatus = isCohortEnded(cohortEndDate, now)
    ? AFTER_COHORT[seed % AFTER_COHORT.length]
    : 'cohort_open'
  const issued = status === 'issued'
  return {
    studentId: student.id,
    studentName: student.name,
    studentUuid: student.studentUuid,
    cohortLabel,
    status,
    // 공개는 증명서가 나온 뒤에만 켜진다.
    published: issued && seed % 3 === 0,
    // 발급 전에는 보여줄 점수가 없다.
    overallScore: issued ? demo.overallScore : null,
    openable: issued,
    demoStudentId: demo.id,
  }
}
