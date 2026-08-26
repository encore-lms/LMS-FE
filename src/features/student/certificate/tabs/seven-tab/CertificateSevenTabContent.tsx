import type { PublicCertificateSevenTabs } from '../../analysis'
import type { CertTab } from '../../types'
import { SummarySevenTab } from './SummarySevenTab'
import { TechSevenTab } from './TechSevenTab'
import { ProjectsSevenTab } from './ProjectsSevenTab'
import { ProblemSolvingSevenTab } from './ProblemSolvingSevenTab'
import { GrowthReputationSevenTab } from './GrowthReputationSevenTab'
import { ResumeSevenTab } from './ResumeSevenTab'
import { AiAnalysisSevenTab } from './AiAnalysisSevenTab'
import { EmptyPanel } from './SevenTabPrimitives'

export function CertificateSevenTabContent({
  active,
  tabs,
}: {
  active: CertTab
  tabs: PublicCertificateSevenTabs
}) {
  switch (active) {
    case 'summary':
      return <SummarySevenTab tab={tabs.summary} />
    case 'tech':
      return <TechSevenTab tab={tabs.tech} />
    case 'projects':
      return <ProjectsSevenTab tab={tabs.projects} />
    case 'problem-solving':
      return <ProblemSolvingSevenTab tab={tabs.problemSolving} />
    case 'growth-reputation':
      return tabs.growthReputation ? (
        <GrowthReputationSevenTab tab={tabs.growthReputation} />
      ) : (
        <EmptyPanel>평가·추천은 공개되지 않았습니다.</EmptyPanel>
      )
    case 'resume':
      return <ResumeSevenTab tab={tabs.resume} />
    case 'ai-analysis':
      return <AiAnalysisSevenTab tab={tabs.aiAnalysis} />
  }
}
