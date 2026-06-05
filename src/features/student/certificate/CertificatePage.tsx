import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useCertificateOverview } from '../api/certificate'
import { CertHero } from './components/CertHero'
import { CertChangeFlags } from './components/CertChangeFlags'
import { CertTabs } from './CertTabs'
import { SummaryTab } from './tabs/SummaryTab'
import { TechTab } from './tabs/TechTab'
import { ProjectsTab } from './tabs/ProjectsTab'
import { ProblemTab } from './tabs/ProblemTab'
import { GrowthTab } from './tabs/GrowthTab'
import type { CertTab } from './types'

/**
 * 수강 역량 증명서 미리보기 (/student/certificate) — Figma 249:27 외 탭 변형(?tab=).
 * 히어로 + 보완 플래그 + 5탭(종합요약/기술검증/프로젝트/문제해결협업/성장평판) + 하단 액션바.
 */
export default function CertificatePage() {
  const [params, setParams] = useSearchParams()
  const { data, isPending, isError, refetch } = useCertificateOverview()

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
    <div className="flex flex-col gap-5 p-8 pb-24">
      <CertHero header={data.header} onRequest={() => {}} />
      <CertChangeFlags flags={data.changeFlags} />
      <CertTabs active={tab} onChange={setTab} />

      {tab === 'summary' && <SummaryTab s={data.summary} />}
      {tab === 'tech' && <TechTab t={data.tech} />}
      {tab === 'projects' && <ProjectsTab p={data.projects} />}
      {tab === 'problem-solving' && <ProblemTab p={data.problem} />}
      {tab === 'growth-reputation' && <GrowthTab g={data.growth} />}

      {/* 하단 액션바 */}
      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <div className="flex flex-col">
          <span className="text-[13px] font-bold">
            요청 전 체크 {data.summary.checkDoneLabel} · 모든 항목 완료 시 정식
            인증 요청 가능
          </span>
          <span className="text-[11px] text-white/70">
            정식 인증 요청 시 매니저가 1영업일 이내 검토합니다
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            증명서 PDF 미리보기
          </button>
          <button
            type="button"
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold"
          >
            정식 인증 요청
          </button>
        </div>
      </div>
    </div>
  )
}
