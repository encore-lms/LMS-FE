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

/**
 * 다섯 상태를 고르게 뿌린다.
 *
 * <p>기수 종료일로 '기수 미종료'를 가리던 방식은 뺐다 — 등록된 기수가 모두 진행 중이라
 * 어느 기수를 열어도 전원 '기수 미종료'가 되어 나머지 네 상태를 확인할 수 없었다.
 * BE 가 붙으면 이 배분을 실제 준비 상태로 바꾼다.</p>
 */
const STATUS_CYCLE: CompetencyCertStatus[] = [
  'issued',
  'data_ready',
  'cohort_open',
  'issued',
  'data_pending',
  'issued',
  'cohort_open',
]

export function demoOf(studentId: string): CertificateDemoStudent {
  const list = CERTIFICATE_DEMO_STUDENTS
  return list[hash(studentId) % list.length]
}

/**
 * 로스터 한 명 → 증명서 목록 한 줄.
 *
 * 증명서가 나온 건에서만 점수·공개·상세 열람이 열린다 — 준비 중인 사람에게
 * 없는 점수를 붙이거나 빈 상세를 열어 주지 않는다.
 */
export function toCertRow(
  student: StudentAccount,
  cohortLabel: string,
): CompetencyCertRow {
  const demo = demoOf(student.id)
  const seed = hash(student.id)
  const status = STATUS_CYCLE[seed % STATUS_CYCLE.length]
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
