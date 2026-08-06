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
 * 모든 상태를 고르게 뿌린다.
 *
 * <p>기수 종료일로 '기수 미종료'를 가리던 방식은 뺐다 — 등록된 기수가 모두 진행 중이라
 * 어느 기수를 열어도 전원 '기수 미종료'가 되어 나머지 상태를 확인할 수 없었다.
 * BE 가 붙으면 이 배분을 실제 준비·인증 상태로 바꾼다.</p>
 */
const STATUS_CYCLE: CompetencyCertStatus[] = [
  'certified',
  'data_ready',
  'cohort_open',
  'requested',
  'data_pending',
  'reviewing',
  'certified',
  'changes_requested',
  'cohort_open',
]

/** 수강생 한 명의 진행 상태 — 목록과 상세가 같은 값을 보게 한 곳에서 정한다. */
export function statusOf(studentId: string): CompetencyCertStatus {
  return STATUS_CYCLE[hash(studentId) % STATUS_CYCLE.length]
}

export function demoOf(studentId: string): CertificateDemoStudent {
  const list = CERTIFICATE_DEMO_STUDENTS
  return list[hash(studentId) % list.length]
}

/**
 * 로스터 한 명 → 증명서 목록 한 줄.
 *
 * 재료가 갖춰진 뒤부터 점수·상세 열람이 열린다 — 검토하려면 먼저 증명서를 봐야 하니
 * 인증 전에도 열 수 있어야 한다. 공개 토글만 정식 인증 뒤로 묶는다.
 */
export function toCertRow(
  student: StudentAccount,
  cohortLabel: string,
): CompetencyCertRow {
  const demo = demoOf(student.id)
  const seed = hash(student.id)
  const status = statusOf(student.id)
  const certified = status === 'certified'
  // 재료가 덜 모인 두 단계 전에는 보여줄 것이 없다.
  const ready = status !== 'cohort_open' && status !== 'data_pending'
  return {
    studentId: student.id,
    studentName: student.name,
    studentUuid: student.studentUuid,
    cohortLabel,
    status,
    // 공개는 정식 인증 뒤에만 켜진다.
    published: certified && seed % 3 === 0,
    overallScore: ready ? demo.overallScore : null,
    openable: ready,
    demoStudentId: demo.id,
  }
}
