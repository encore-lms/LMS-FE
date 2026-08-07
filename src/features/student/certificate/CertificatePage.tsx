import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { usePageHeader } from '@/shared/store'
import { useCertStatus, useCertificateOverview } from '../api/certificate'
import { CertHero } from './components/CertHero'
import { CertificateDemoStudentFab } from './components/CertificateDemoStudentFab'
import { CertPublishBar } from './components/CertPublishBar'
import { CertTabs } from './CertTabs'
import { SummaryTab } from './tabs/SummaryTab'
import { TechTab } from './tabs/TechTab'
import { ProjectsTab } from './tabs/ProjectsTab'
import { ProblemTab } from './tabs/ProblemTab'
import { GrowthTabData } from './tabs/GrowthTab'
import { ResumeTab } from './tabs/ResumeTab'
import { AiTab } from './tabs/AiTab'
import { CERT_V2 } from './config'
import {
  applyCertificateDemoStudent,
  CERTIFICATE_DEMO_STUDENTS,
  getCertificateDemoStudent,
} from './demoStudents'
import type { CertTab } from './types'
import { TERMS } from '@/shared/constants'

const CERTIFICATE_DEMO_MODE =
  import.meta.env.DEV && import.meta.env.VITE_CERTIFICATE_DEMO_MODE === 'true'

/**
 * 수강 역량 증명서 (/student/certificate) — 인셸 작업 화면.
 * - 사이드바 진입 = 종합요약 탭(기본). 슬림 히어로 + 탭 콘텐츠.
 * - 미리보기는 별도 전체화면 라우트(/student/certificate/preview, 사이드바 없음)에서 본다.
 */
export default function CertificatePage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data, isPending, isError, refetch } = useCertificateOverview()
  const { data: cert } = useCertStatus()
  usePageHeader(TERMS.certificate)

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
        <CertHero header={certificateData.header} status={cert?.stage ?? 'before'} />
      )}

      {/* 보완 요청 진입 — 그동안 이 화면이 있는데 가는 길이 없었다(2026-08-07 연결). */}
      {cert?.stage === 'changes_requested' && (
        <button
          type="button"
          onClick={() => navigate('/student/certificate/changes-requested')}
          className="bg-danger-bg flex items-center justify-between gap-4 rounded-2xl px-6 py-4 text-left"
        >
          <span className="flex items-center gap-3">
            <AlertTriangle className="text-danger h-5 w-5 shrink-0" />
            <span className="flex flex-col">
              <span className="text-danger text-[14px] font-bold">
                보완 요청이 있어요
              </span>
              <span className="text-fg-muted text-[12px]">
                내용을 확인하고 고친 뒤 정식 인증을 다시 요청하세요
              </span>
            </span>
          </span>
          <span className="text-danger shrink-0 text-[13px] font-bold">
            확인하기 →
          </span>
        </button>
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
                <GrowthTabData
                  g={certificateData.growth}
                  studentId={selectedStudent.id}
                />
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
