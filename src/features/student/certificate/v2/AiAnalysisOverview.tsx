import { useRef, useState, type KeyboardEvent } from 'react'
import { BriefcaseBusiness, FolderKanban, ShieldCheck } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { AiAnalysis } from '../ai'
import { AiJobFit } from './AiJobFit'
import { AiProjectAnalysis } from './AiProjectAnalysis'
import { AiTroubleshootingAnalysis } from './AiTroubleshootingAnalysis'

type AnalysisKey = 'job-fit' | 'projects' | 'troubleshooting'

function firstLine(value: string) {
  return (
    value
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) ?? '분석 결과를 준비하고 있습니다.'
  )
}

export function AiAnalysisOverview({ analysis }: { analysis: AiAnalysis }) {
  const primaryRole = analysis.jobFit.primaryRole
  const primaryTroubleshootingGroup = [...analysis.troubleshooting.groups].sort(
    (a, b) => b.certifiedCaseCount - a.certifiedCaseCount,
  )[0]
  const items = [
    {
      key: 'job-fit' as const,
      label: '직무 적합도',
      eyebrow: '가장 어울리는 직무',
      title: primaryRole?.jobLabel ?? '직무 분석 준비 중',
      summary: primaryRole
        ? `적합도 ${primaryRole.fitScore}점 · ${primaryRole.workType}`
        : '직무 관련 근거가 쌓이면 분석합니다.',
      icon: BriefcaseBusiness,
      active: 'border-accent/40 bg-accent-bg/35 ring-accent/10',
      iconStyle: 'bg-accent-bg text-accent-strong',
      eyebrowStyle: 'text-accent-strong',
    },
    {
      key: 'projects' as const,
      label: '프로젝트 분석',
      eyebrow: `전체 프로젝트 ${analysis.projects.projectCount}개 분석`,
      title: analysis.projects.overview.workingStyle,
      summary: firstLine(
        analysis.projects.aggregateAnalysis?.summary[0] ??
          analysis.projects.summary,
      ),
      icon: FolderKanban,
      active: 'border-info/40 bg-info-bg/35 ring-info/10',
      iconStyle: 'bg-info-bg text-info',
      eyebrowStyle: 'text-info',
    },
    {
      key: 'troubleshooting' as const,
      label: '트러블슈팅 분석',
      eyebrow: '가장 선명한 해결 영역',
      title: primaryTroubleshootingGroup?.label ?? '문제해결 분석 준비 중',
      summary: firstLine(analysis.troubleshooting.summary),
      icon: ShieldCheck,
      active: 'border-warning/40 bg-warning-bg/35 ring-warning/10',
      iconStyle: 'bg-warning-bg text-warning',
      eyebrowStyle: 'text-warning',
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
                  'focus-visible:ring-brand flex min-w-0 flex-col rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-2',
                  selected
                    ? cn('ring-1', item.active)
                    : 'border-border bg-surface hover:bg-surface-muted',
                )}
              >
                <span className="flex items-center gap-2.5">
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
                    <span
                      className={cn(
                        'block truncate text-[12px] font-semibold',
                        item.eyebrowStyle,
                      )}
                    >
                      {item.eyebrow}
                    </span>
                  </span>
                </span>
                <span className="text-fg mt-3 line-clamp-2 text-[15px] leading-5 font-bold">
                  {item.title}
                </span>
                <span className="text-fg-muted mt-1 line-clamp-1 text-[12px] leading-5">
                  {item.summary}
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
