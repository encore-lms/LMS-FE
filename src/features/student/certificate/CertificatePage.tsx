import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useCertificateOverview } from '../api/certificate'
import { CertHero } from './components/CertHero'
import { CertPreview } from './components/CertPreview'
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
 * 수강 역량 증명서 (/student/certificate).
 * - ?tab 없음 → 증명서 미리보기 랜딩(Figma 249:27, CertPreview): 리치 히어로 + 보완 항목 +
 *   요청 전 체크리스트 + 정식 인증 요청 액션바.
 * - ?tab=X    → 탭 상세(Figma 2402:xxxx): 슬림 히어로 + 탭 콘텐츠, 하단 액션바 없음.
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

  const tabParam = params.get('tab') as CertTab | null
  // ?tab 없음 = 증명서 미리보기 랜딩
  if (!tabParam) return <CertPreview data={data} />

  // ?tab=X = 탭 상세(슬림). 하단 정식 인증 요청 액션바는 미리보기 전용.
  const tab = tabParam
  const setTab = (t: CertTab) => setParams({ tab: t })
  return (
    <div className="flex flex-col gap-5 p-8">
      <CertHero header={data.header} status={status} />
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
