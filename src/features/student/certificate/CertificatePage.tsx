import { useSearchParams } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { usePageHeader } from '@/shared/store'
import { useCertificateOverview } from '../api/certificate'
import { CertHero } from './components/CertHero'
import { CertificateDemoStudentFab } from './components/CertificateDemoStudentFab'
import { CertPublishBar } from './components/CertPublishBar'
import { CertTabs } from './CertTabs'
import { SummaryTab } from './tabs/SummaryTab'
import { TechTab } from './tabs/TechTab'
import { ProjectsTab } from './tabs/ProjectsTab'
import { ProblemTab } from './tabs/ProblemTab'
import { GrowthTab } from './tabs/GrowthTab'
import { ResumeTab } from './tabs/ResumeTab'
import { AiTab } from './tabs/AiTab'
import { CERT_V2 } from './config'
import {
  applyCertificateDemoStudent,
  CERTIFICATE_DEMO_STUDENTS,
  getCertificateDemoStudent,
} from './demoStudents'
import { useCertFlow } from './useCertFlow'
import type { CertTab } from './types'

const CERTIFICATE_DEMO_MODE =
  import.meta.env.DEV && import.meta.env.VITE_CERTIFICATE_DEMO_MODE === 'true'

/**
 * 수강 역량 증명서 (/student/certificate) — 인셸 작업 화면.
 * - 사이드바 진입 = 종합요약 탭(기본). 슬림 히어로 + 탭 콘텐츠.
 * - 미리보기는 별도 전체화면 라우트(/student/certificate/preview, 사이드바 없음)에서 본다.
 */
export default function CertificatePage() {
  const [params, setParams] = useSearchParams()
  const { data, isPending, isError, refetch } = useCertificateOverview()
  const status = useCertFlow((s) => s.status)
  usePageHeader('수강 역량 증명서')

  // ?tab 없으면 종합요약 탭 기본. AI 탭은 CERT_V2 플래그 ON일 때만.
  const tab = (params.get('tab') as CertTab | null) ?? 'summary'
  const selectedStudent = getCertificateDemoStudent(
    CERTIFICATE_DEMO_MODE ? params.get('demoStudent') : null,
  )
  const certificateData =
    data && CERTIFICATE_DEMO_MODE
      ? applyCertificateDemoStudent(data, selectedStudent)
      : data
  const setTab = (nextTab: CertTab) => {
    const next = new URLSearchParams(params)
    next.set('tab', nextTab)
    setParams(next)
  }
  const selectDemoStudent = (studentId: string) => {
    const next = new URLSearchParams(params)
    next.set('demoStudent', studentId)
    setParams(next)
  }

  return (
    <div className="flex flex-col gap-5 p-8 pb-28">
      {/* 히어로는 데이터 의존 → 있을 때만. 탭 네비(CertTabs)는 항상 유지. */}
      {certificateData && (
        <CertHero header={certificateData.header} status={status} />
      )}
      <CertTabs active={tab} onChange={setTab} />

      {/* 이력서 탭은 증명서 overview 가 아닌 이력서 API 를 쓴다 — 자체 DataBoundary 보유 */}
      {tab === 'resume' ? (
        <ResumeTab />
      ) : (
        <DataBoundary
          isPending={isPending}
          isError={isError || !certificateData}
          onRetry={refetch}
          errorTitle="증명서를 불러오지 못했어요"
          errorDescription="잠시 후 다시 시도해 주세요."
        >
          {certificateData && (
            <>
              {tab === 'summary' && (
                <SummaryTab
                  s={certificateData.summary}
                  studentId={selectedStudent.id}
                  recommendations={certificateData.growth.recommendations}
                />
              )}
              {tab === 'tech' && <TechTab studentId={selectedStudent.id} />}
              {tab === 'projects' && (
                <ProjectsTab p={certificateData.projects} />
              )}
              {tab === 'problem-solving' && (
                <ProblemTab studentId={selectedStudent.id} />
              )}
              {tab === 'growth-reputation' && (
                <GrowthTab g={certificateData.growth} />
              )}
              {tab === 'ai-analysis' && CERT_V2 && (
                <AiTab studentId={selectedStudent.id} />
              )}
            </>
          )}
        </DataBoundary>
      )}

      {CERTIFICATE_DEMO_MODE && (
        <CertificateDemoStudentFab
          students={CERTIFICATE_DEMO_STUDENTS}
          selectedStudentId={selectedStudent.id}
          onSelect={selectDemoStudent}
        />
      )}

      {/* 외부 검증 URL 공개 스위치 — 화면을 벗어나지 않고 바로 켜고 끈다. */}
      <CertPublishBar />
    </div>
  )
}
