import { useRef, useState, type KeyboardEvent } from 'react'
import { BriefcaseBusiness, FolderKanban, ShieldCheck } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { AiAnalysis } from '../ai'
import { AiJobFit } from './AiJobFit'
import { AiProjectAnalysis } from './AiProjectAnalysis'
import { AiTroubleshootingAnalysis } from './AiTroubleshootingAnalysis'

type AnalysisKey = 'job-fit' | 'projects' | 'troubleshooting'

export function AiAnalysisOverview({ analysis }: { analysis: AiAnalysis }) {
  const items = [
    {
      key: 'job-fit' as const,
      label: '직무 적합도',
      description:
        '프로필과 학습·수행 기록을 바탕으로 어울리는 직무 방향을 분석합니다.',
      icon: BriefcaseBusiness,
      active: 'border-accent/40 bg-accent-bg/35 ring-accent/10',
      iconStyle: 'bg-accent-bg text-accent-strong',
    },
    {
      key: 'projects' as const,
      label: '프로젝트 분석',
      description:
        '전체 프로젝트에서 반복된 역할·업무·기여와 수행 스타일을 분석합니다.',
      icon: FolderKanban,
      active: 'border-info/40 bg-info-bg/35 ring-info/10',
      iconStyle: 'bg-info-bg text-info',
    },
    {
      key: 'troubleshooting' as const,
      label: '문제해결 역량 분석',
      description:
        '인증된 문제해결 기록에서 반복된 접근법과 해결 범위의 확장을 분석합니다.',
      icon: ShieldCheck,
      active: 'border-brown/35 bg-surface ring-brown/5',
      iconStyle: 'bg-brown text-on-color',
    },
  ]
  const [selectedKey, setSelectedKey] = useState<AnalysisKey>('job-fit')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const selectByKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | undefined
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = items.length - 1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % items.length
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + items.length) % items.length
    }
    if (nextIndex === undefined) return

    event.preventDefault()
    setSelectedKey(items[nextIndex].key)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="ai-analysis-overview-title">
        <div className="mb-3 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
          <h2
            id="ai-analysis-overview-title"
            className="text-fg shrink-0 text-[16px] leading-6 font-bold"
          >
            핵심 분석 3가지
          </h2>
          <p className="text-fg-muted text-[13px] leading-5">
            세 결과를 비교하고 자세히 볼 항목을 선택하세요.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="AI 분석 항목"
          className="grid gap-3 md:grid-cols-3"
        >
          {items.map((item, index) => {
            const selected = item.key === selectedKey
            const Icon = item.icon

            return (
              <button
                key={item.key}
                ref={(element) => {
                  tabRefs.current[index] = element
                }}
                id={`ai-analysis-tab-${item.key}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`ai-analysis-panel-${item.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setSelectedKey(item.key)}
                onKeyDown={(event) => selectByKeyboard(event, index)}
                className={cn(
                  'focus-visible:ring-brand flex min-w-0 items-start gap-3 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-2',
                  selected
                    ? cn('ring-1', item.active)
                    : 'border-border bg-surface hover:bg-surface-muted',
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    item.iconStyle,
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="text-fg block text-[14px] font-bold">
                    {item.label}
                  </span>
                  <span className="text-fg-muted mt-1 block text-[12px] leading-5">
                    {item.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {items.map((item) => {
        const selected = item.key === selectedKey

        return (
          <div
            key={item.key}
            id={`ai-analysis-panel-${item.key}`}
            role="tabpanel"
            aria-labelledby={`ai-analysis-tab-${item.key}`}
            hidden={!selected}
            tabIndex={selected ? 0 : -1}
          >
            {selected && item.key === 'job-fit' && (
              <AiJobFit jobFit={analysis.jobFit} />
            )}
            {selected && item.key === 'projects' && (
              <AiProjectAnalysis projects={analysis.projects} />
            )}
            {selected && item.key === 'troubleshooting' && (
              <AiTroubleshootingAnalysis
                troubleshooting={analysis.troubleshooting}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
