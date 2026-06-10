import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useCertificateOverview } from '../api/certificate'
import { CertHero } from './components/CertHero'
import { CertTabs } from './CertTabs'
import { SummaryTab } from './tabs/SummaryTab'
import { TechTab } from './tabs/TechTab'
import { ProjectsTab } from './tabs/ProjectsTab'
import { ProblemTab } from './tabs/ProblemTab'
import { GrowthTab } from './tabs/GrowthTab'
import { AiTab } from './tabs/AiTab'
import { CERT_V2 } from './config'
import type { CertTab } from './types'

/**
 * 수강 역량 증명서 미리보기 (/student/certificate) — Figma 249:27 외 탭 변형(?tab=).
 * 히어로 + 보완 플래그 + 5탭(종합요약/기술검증/프로젝트/문제해결협업/성장평판) + 하단 액션바.
 */
export default function CertificatePage() {
  const [params, setParams] = useSearchParams()
  const { data, isPending, isError, refetch } = useCertificateOverview()
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

  const tab = ((params.get('tab') as CertTab) || 'summary') as CertTab
  const setTab = (t: CertTab) => setParams(t === 'summary' ? {} : { tab: t })

  return (
    <div className="flex flex-col gap-5 p-8">
      <CertHero header={data.header} />
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
