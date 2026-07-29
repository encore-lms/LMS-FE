import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { usePageHeader } from '@/shared/store'
import { CertPreview } from '@/features/student/certificate/components/CertPreview'
import {
  applyCertificateDemoStudent,
  getCertificateDemoStudent,
} from '@/features/student/certificate/demoStudents'
import { mockOverview } from '@/features/student/certificate/mocks'

// 매니저 역량 증명서 상세 (/admin/certificates/:studentId) — 읽기 전용.
// 수강생이 보는 증명서와 같은 화면을 그대로 띄운다 — 매니저가 보는 것과
// 실제 공개되는 것이 다르면 확인의 의미가 없다.
//
// 지금은 데모 데이터다(?demo= 로 인물 지정). BE 가 붙으면 이 조립만 실제 조회로 바꾼다.

export default function CompetencyCertificateDetailPage() {
  const { studentId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const student = getCertificateDemoStudent(params.get('demo'))
  const data = useMemo(
    () => applyCertificateDemoStudent(mockOverview, student),
    [student],
  )

  usePageHeader(
    `${student.name} 역량 증명서`,
    '수강생에게 보이는 증명서를 그대로 확인합니다',
  )

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border-border text-fg inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          목록으로
        </button>
        <span className="text-fg text-[15px] font-bold">{student.name}</span>
        <span className="text-fg-subtle text-[12px]">
          {student.cohortName} · {student.periodLabel}
        </span>
        <StatusBadge tone="success" label="증명서 완료" />
        {/* 실제 공개 전환은 후속 — 지금은 상태만 보여준다. */}
        <span className="text-fg-subtle ml-auto text-[12px]">
          수강생 ID {studentId.slice(0, 8)}
        </span>
      </div>

      <CertPreview data={data} />
    </div>
  )
}
