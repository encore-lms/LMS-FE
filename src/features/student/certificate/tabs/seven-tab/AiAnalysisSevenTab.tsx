import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { AiAnalysisMethodology } from '../../v2/AiAnalysisMethodology'
import { AiAnalysisOverview } from '../../v2/AiAnalysisOverview'
import type { CertificateSevenTabs } from '../../analysis'
import { EmptyPanel, SevenTabShell } from './SevenTabPrimitives'

export function AiAnalysisSevenTab({
  tab,
}: {
  tab: CertificateSevenTabs['aiAnalysis']
}) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false)
  const analysis = tab.payload.analysis

  return (
    <SevenTabShell
      no={7}
      title="AI 분석"
      sub="같은 분석 실행의 직무·프로젝트·문제해결 결과를 설명합니다."
      tab={tab}
    >
      {analysis ? (
        <div className="flex flex-col gap-6">
          <header className="border-accent/25 bg-accent-bg/40 flex flex-col justify-between gap-4 rounded-2xl border px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h3 className="text-fg text-[16px] font-bold">
                AI 역량 분석 결과
              </h3>
              <p className="text-fg-muted mt-1 text-[12px] leading-5">
                생성 정책 {analysis.policyVersion} · 원천 사실과 AI 해석을
                구분해 표시합니다.
              </p>
            </div>
            <button
              type="button"
              aria-expanded={isMethodologyOpen}
              aria-controls="certificate-seven-tab-methodology"
              onClick={() => setIsMethodologyOpen((open) => !open)}
              className="border-accent/25 bg-surface text-fg-muted hover:bg-accent-bg hover:text-accent-strong focus-visible:ring-brand flex w-fit items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-bold outline-none focus-visible:ring-2"
            >
              분석 기준
              <ChevronDown
                className={cn(
                  'size-4 transition-transform',
                  isMethodologyOpen && 'rotate-180',
                )}
                aria-hidden="true"
              />
            </button>
          </header>
          <div
            id="certificate-seven-tab-methodology"
            hidden={!isMethodologyOpen}
          >
            <AiAnalysisMethodology analysis={analysis} />
          </div>
          <AiAnalysisOverview analysis={analysis} />
        </div>
      ) : (
        <EmptyPanel>AI 분석 결과가 없습니다.</EmptyPanel>
      )}
    </SevenTabShell>
  )
}
