import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useCertificateOverview } from '../api/certificate'
import { CertHero } from './components/CertHero'
import { CertRequestTestNav } from './components/CertRequestTestNav'
import { CertTabs } from './CertTabs'
import { SummaryTab } from './tabs/SummaryTab'
import { TechTab } from './tabs/TechTab'
import { ProjectsTab } from './tabs/ProjectsTab'
import { ProblemTab } from './tabs/ProblemTab'
import { GrowthTab } from './tabs/GrowthTab'
import { AiTab } from './tabs/AiTab'
import { CERT_V2 } from './config'
import { useCertFlow } from './useCertFlow'
import type { CertTab } from './types'

/**
 * 수강 역량 증명서 (/student/certificate) — 인셸 작업 화면.
 * - 사이드바 진입 = 종합요약 탭(기본). 슬림 히어로 + 상단 테스트 네비(정식 인증 요청 흐름 + 미리보기) + 탭 콘텐츠.
 * - 미리보기는 별도 전체화면 라우트(/student/certificate/preview, 사이드바 없음)에서 본다.
 */
export default function CertificatePage() {
  const [params, setParams] = useSearchParams()
  const { data, isPending, isError, refetch } = useCertificateOverview()
  const status = useCertFlow((s) => s.status)
  usePageHeader('수강 역량 증명서')

  if (isPending)
    return <div className="text-fg-muted p-8">증명서를 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="증명서를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // ?tab 없으면 종합요약 탭 기본. AI 탭은 CERT_V2 플래그 ON일 때만.
  const tab = (params.get('tab') as CertTab | null) ?? 'summary'
  const setTab = (t: CertTab) => setParams({ tab: t })

  return (
    <div className="flex flex-col gap-5 p-8">
      <CertHero header={data.header} status={status} />
      {/* 정식 인증 요청 흐름 + 미리보기 — FE 목 전용 테스트 네비 */}
      <CertRequestTestNav data={data} />
      <CertTabs active={tab} onChange={setTab} />

      {tab === 'summary' && <SummaryTab s={data.summary} />}
      {tab === 'tech' && <TechTab t={data.tech} />}
      {tab === 'projects' && <ProjectsTab p={data.projects} />}
      {tab === 'problem-solving' && <ProblemTab p={data.problem} />}
      {tab === 'growth-reputation' && <GrowthTab g={data.growth} />}
      {tab === 'ai-analysis' && CERT_V2 && <AiTab data={data} />}
    </div>
  )
}
