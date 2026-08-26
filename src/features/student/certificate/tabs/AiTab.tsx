import { useState } from 'react'
import {
  ChevronDown,
  Clock3,
  LockKeyhole,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { AiTabSkeleton } from './TabSkeletons'
import { cn } from '@/shared/lib/cn'
import {
  useCertificateAnalysis,
  useCreateCertificateAnalysis,
  type CertificateAnalysisTarget,
  type CertificateAnalysisView,
} from '../analysis'
import { AiAnalysisOverview } from '../v2/AiAnalysisOverview'
import { AiAnalysisMethodology } from '../v2/AiAnalysisMethodology'

function stateMessage(view: CertificateAnalysisView) {
  if (view.statusDetail.lockedReason === 'REVIEW_IN_PROGRESS') {
    return {
      title: '심사 중에는 분석을 변경할 수 없어요',
      description:
        '현재 결과로 심사가 진행 중입니다. 심사가 끝난 뒤 다시 실행할 수 있어요.',
      icon: LockKeyhole,
    }
  }
  if (view.statusDetail.lockedReason === 'CERTIFIED_IMMUTABLE') {
    return {
      title: '인증된 분석 결과예요',
      description: '발급된 증명서의 결과는 변경되지 않도록 고정되어 있어요.',
      icon: LockKeyhole,
    }
  }
  if (
    view.analysisStatus === 'QUEUED' ||
    view.analysisStatus === 'GENERATING'
  ) {
    return {
      title:
        view.analysisStatus === 'QUEUED'
          ? '분석을 준비하고 있어요'
          : 'AI가 분석하고 있어요',
      description: '완료되면 이 화면이 자동으로 갱신됩니다.',
      icon: Clock3,
    }
  }
  if (view.dataStatus === 'NOT_READY') {
    return {
      title: '분석할 학습 데이터가 아직 준비되지 않았어요',
      description:
        view.statusDetail.missingRequirements[0]?.resolution ??
        '과정 종료 데이터 준비가 끝난 뒤 다시 확인해 주세요.',
      icon: Clock3,
    }
  }
  if (view.dataStatus === 'STALE') {
    return {
      title: '학습 데이터가 변경되어 다시 분석해야 해요',
      description: '최신 데이터를 기준으로 분석을 다시 실행해 주세요.',
      icon: RefreshCw,
    }
  }
  if (view.analysisStatus === 'FAILED') {
    return {
      title: '분석을 완료하지 못했어요',
      description:
        '잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요.',
      icon: RefreshCw,
    }
  }
  return {
    title: 'AI 분석을 시작할 수 있어요',
    description:
      '준비된 학습 데이터를 기준으로 직무·프로젝트·문제해결 역량을 분석합니다.',
    icon: Sparkles,
  }
}

function AnalysisLifecycle({
  view,
  pending,
  onGenerate,
}: {
  view: CertificateAnalysisView
  pending: boolean
  onGenerate: () => void
}) {
  const message = stateMessage(view)
  const Icon = message.icon
  const canGenerate =
    view.statusDetail.canGenerate || view.statusDetail.canRetry

  return (
    <section className="border-border bg-surface flex flex-col items-start gap-4 rounded-2xl border p-6">
      <span className="bg-accent-bg text-accent-strong flex size-10 items-center justify-center rounded-xl">
        <Icon
          className={cn('size-5', pending && 'animate-spin')}
          aria-hidden="true"
        />
      </span>
      <div>
        <h2 className="text-fg text-[17px] font-bold">{message.title}</h2>
        <p className="text-fg-muted mt-1 max-w-2xl text-[13px] leading-5">
          {message.description}
        </p>
      </div>
      {canGenerate && (
        <button
          type="button"
          onClick={onGenerate}
          disabled={pending}
          className="bg-accent-strong text-on-color focus-visible:ring-brand rounded-lg px-4 py-2 text-[13px] font-bold outline-none focus-visible:ring-2 disabled:opacity-60"
        >
          {pending
            ? '요청 중…'
            : view.statusDetail.canRetry
              ? '다시 분석하기'
              : 'AI 분석 시작'}
        </button>
      )}
    </section>
  )
}

export function AiTab({
  target,
}: {
  target: CertificateAnalysisTarget
}) {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false)
  const query = useCertificateAnalysis(target)
  const create = useCreateCertificateAnalysis(target)
  const resultKey = target.scope === 'student' ? 'me' : target.studentId

  return (
    <DataBoundary
      isPending={query.isPending}
      isError={query.isError || !query.data}
      onRetry={query.refetch}
      skeleton={<AiTabSkeleton />}
      errorTitle="AI 분석을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요."
    >
      {query.data && (
        <div className="flex flex-col gap-8">
          <header className="border-accent/25 bg-accent-bg/40 flex flex-col justify-between gap-4 rounded-2xl border px-5 py-5 sm:flex-row sm:items-start sm:px-6">
            <div className="flex items-start gap-3">
              <span className="bg-accent-strong text-on-color flex size-9 shrink-0 items-center justify-center rounded-xl text-[16px] font-bold">
                ✦
              </span>
              <div>
                <h1 className="text-fg text-[20px] leading-7 font-bold">
                  AI 분석
                </h1>
                <p className="text-fg-muted mt-1 max-w-3xl text-[14px] leading-6">
                  {query.data.analysis
                    ? '수강생의 직무 방향, 프로젝트 수행 방식, 문제해결 역량을 AI가 세 관점에서 종합적으로 분석했습니다.'
                    : '학습 데이터 준비 상태부터 분석 실행과 완료까지 이 화면에서 확인할 수 있습니다.'}
                </p>
              </div>
            </div>

            {query.data.analysis && (
              <button
                type="button"
                aria-expanded={isMethodologyOpen}
                aria-controls="ai-analysis-methodology"
                onClick={() => setIsMethodologyOpen((open) => !open)}
                className="border-accent/25 bg-surface text-fg-muted hover:bg-accent-bg hover:text-accent-strong focus-visible:ring-brand flex w-fit shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-bold transition-colors outline-none focus-visible:ring-2"
              >
                분석 기준
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'size-4 transition-transform',
                    isMethodologyOpen && 'rotate-180',
                  )}
                />
              </button>
            )}
          </header>

          {query.data.analysisStatus === 'READY' && query.data.analysis ? (
            <>
              <div id="ai-analysis-methodology" hidden={!isMethodologyOpen}>
                <AiAnalysisMethodology analysis={query.data.analysis} />
              </div>
              <AiAnalysisOverview
                key={resultKey}
                analysis={query.data.analysis}
              />
            </>
          ) : (
            <AnalysisLifecycle
              view={query.data}
              pending={create.isPending}
              onGenerate={() => create.mutate()}
            />
          )}

          {create.isError && (
            <p role="alert" className="text-danger text-[13px]">
              분석을 요청하지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
          )}
        </div>
      )}
    </DataBoundary>
  )
}
