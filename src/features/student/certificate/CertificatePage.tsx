import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { usePageHeader } from '@/shared/store'
import {
  useCertStatus,
  useCertificateOverview,
  useRequestCertification,
} from '../api/certificate'
import { useStudentDashboard } from '../api/dashboard'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
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
  const requestCert = useRequestCertification()
  const toast = useToast()
  usePageHeader(TERMS.certificate)

  // ?tab 없으면 종합요약 탭 기본. AI 탭은 CERT_V2 플래그 ON일 때만.
  const tab = (params.get('tab') as CertTab | null) ?? 'summary'
  const selectedStudent = getCertificateDemoStudent(
    CERTIFICATE_DEMO_MODE ? params.get('demoStudent') : null,
  )
  const demoApplied =
    data && CERTIFICATE_DEMO_MODE
      ? applyCertificateDemoStudent(data, selectedStudent)
      : data
  // 증명서 본문은 아직 mock 이라 헤더에 고정 인물(박수진 · 32기)이 박혀 있었다.
  // 누구로 로그인하든 같은 이름이 보이므로, 신원만 실제 소속(대시보드 hero)으로 덮는다.
  // 시연 인물 전환 중에는 그 인물을 보여줘야 하므로 건드리지 않는다.
  const { data: dashboard } = useStudentDashboard()
  const certificateData =
    demoApplied && dashboard && !CERTIFICATE_DEMO_MODE
      ? {
          ...demoApplied,
          header: {
            ...demoApplied.header,
            studentName: dashboard.hero.studentName,
            courseName: dashboard.hero.courseName,
            cohortName: dashboard.hero.cohortName,
          },
        }
      : demoApplied
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
        <CertHero
          header={certificateData.header}
          status={cert?.stage ?? 'before'}
        />
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

      {/* 정식 인증 요청 — 재료가 갖춰지면(canRequest) 여기서 낸다.
          API 는 있는데 누를 자리가 없어 흐름이 시작되지 않았다(2026-08-07 QA). */}
      {cert?.canRequest && cert.stage === 'before' && (
        <div className="bg-surface flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
          <span className="flex flex-col">
            <span className="text-fg text-[14px] font-bold">
              정식 인증을 요청할 수 있어요
            </span>
            <span className="text-fg-muted text-[12px]">
              매니저가 검토한 뒤 인증 마크가 붙습니다
            </span>
          </span>
          <button
            type="button"
            onClick={() =>
              requestCert.mutate(undefined, {
                onSuccess: () =>
                  toast.success('정식 인증을 요청했어요 · 매니저 검토 대기'),
                onError: () =>
                  toast.danger(
                    '요청하지 못했어요 · 잠시 후 다시 시도해 주세요',
                  ),
              })
            }
            disabled={requestCert.isPending}
            className={buttonClass()}
          >
            {requestCert.isPending ? '요청 중…' : '정식 인증 요청'}
          </button>
        </div>
      )}

      <CertTabs active={tab} onChange={setTab} />

      {/* 프로젝트·이력서 탭은 overview가 아닌 전용 API를 쓴다 — 자체 DataBoundary 보유 */}
      {tab === 'projects' ? (
        <ProjectsTab />
      ) : tab === 'resume' ? (
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
