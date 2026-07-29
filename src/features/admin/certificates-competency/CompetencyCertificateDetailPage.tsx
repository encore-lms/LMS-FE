import { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { usePageHeader } from '@/shared/store'
import { CertHero } from '@/features/student/certificate/components/CertHero'
import { CertTabs } from '@/features/student/certificate/CertTabs'
import { SummaryTab } from '@/features/student/certificate/tabs/SummaryTab'
import { TechTab } from '@/features/student/certificate/tabs/TechTab'
import { ProjectsTab } from '@/features/student/certificate/tabs/ProjectsTab'
import { ProblemTab } from '@/features/student/certificate/tabs/ProblemTab'
import { GrowthTab } from '@/features/student/certificate/tabs/GrowthTab'
import { AiTab } from '@/features/student/certificate/tabs/AiTab'
import { CERT_V2 } from '@/features/student/certificate/config'
import {
  applyCertificateDemoStudent,
  getCertificateDemoStudent,
} from '@/features/student/certificate/demoStudents'
import { mockOverview } from '@/features/student/certificate/mocks'
import type { CertTab } from '@/features/student/certificate/types'

// 매니저 역량 증명서 상세 (/admin/certificates/:studentId) — 읽기 전용.
// 수강생이 보는 증명서와 같은 탭 구성을 그대로 띄운다 — 매니저가 보는 것과
// 실제 공개되는 것이 다르면 확인의 의미가 없다.
//
// 탭 전환은 이 화면 안에서 끝난다. 수강생용 CertPreview 를 쓰면 탭을 누를 때
// /student/certificate 로 튕겨 나가 매니저는 종합 요약밖에 못 본다.
//
// 이력서 탭은 뺐다 — 이력서는 로그인한 본인 것만 조회되는 API 라, 매니저가 열면
// 남의 증명서 자리에 자기 이력서가 뜬다.
const MANAGER_TABS: CertTab[] = [
  'summary',
  'tech',
  'projects',
  'problem-solving',
  'growth-reputation',
  ...(CERT_V2 ? (['ai-analysis'] as CertTab[]) : []),
]

// 지금은 데모 데이터다(?demo= 로 인물 지정). BE 가 붙으면 이 조립만 실제 조회로 바꾼다.

export default function CompetencyCertificateDetailPage() {
  const { studentId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<CertTab>('summary')

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
        {/* 실제 공개 전환은 수강생 본인이 한다 — 여기선 상태만 보여준다. */}
        <span className="text-fg-subtle ml-auto text-[12px]">
          수강생 ID {studentId.slice(0, 8)}
        </span>
      </div>

      <CertHero header={data.header} status="issued" />
      <CertTabs active={tab} onChange={setTab} only={MANAGER_TABS} />

      {tab === 'summary' && (
        <SummaryTab
          s={data.summary}
          studentId={student.id}
          recommendations={data.growth.recommendations}
        />
      )}
      {tab === 'tech' && <TechTab studentId={student.id} />}
      {tab === 'projects' && <ProjectsTab p={data.projects} />}
      {tab === 'problem-solving' && <ProblemTab studentId={student.id} />}
      {tab === 'growth-reputation' && <GrowthTab g={data.growth} />}
      {tab === 'ai-analysis' && CERT_V2 && <AiTab studentId={student.id} />}
    </div>
  )
}
