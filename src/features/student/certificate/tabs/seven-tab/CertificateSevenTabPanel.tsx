import { Clock3, LockKeyhole, RefreshCw, Sparkles } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import {
  useCertificateAnalysis,
  useCreateCertificateAnalysis,
  isCertificateAnalysisReady,
  type CertificateAnalysisTarget,
  type CertificateAnalysisView,
} from '../../analysis'
import type { CertTab } from '../../types'
import { AiTabSkeleton } from '../TabSkeletons'
import { CertificateSevenTabContent } from './CertificateSevenTabContent'

function lifecycleMessage(view: CertificateAnalysisView) {
  if (view.statusDetail.lockedReason === 'REVIEW_IN_PROGRESS') {
    return {
      title: '심사 중에는 분석을 변경할 수 없어요',
      description: '현재 결과로 심사가 진행 중입니다.',
      icon: LockKeyhole,
    }
  }
  if (view.statusDetail.lockedReason === 'CERTIFIED_IMMUTABLE') {
    return {
      title: '인증된 결과는 변경되지 않아요',
      description: '발급 시점의 7개 탭 Snapshot을 그대로 보여줍니다.',
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
          : '7개 탭을 생성하고 있어요',
      description: '완료되면 이 화면이 자동으로 갱신됩니다.',
      icon: Clock3,
    }
  }
  if (view.analysisStatus === 'FAILED' || view.dataStatus === 'STALE') {
    return {
      title:
        view.analysisStatus === 'FAILED'
          ? '분석을 완료하지 못했어요'
          : '최신 데이터로 다시 분석해야 해요',
      description:
        view.statusDetail.failure?.message ?? '잠시 후 다시 실행해 주세요.',
      icon: RefreshCw,
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
  if (view.tabs) {
    const incompleteTab = Object.values(view.tabs).find(
      (tab) => tab.readinessStatus !== 'READY',
    )
    return {
      title: '7개 탭 데이터가 모두 준비되지 않았어요',
      description:
        incompleteTab?.missingRequirements[0]?.detail ??
        '누락된 데이터를 보완한 뒤 최신 원천으로 다시 분석해 주세요.',
      icon: Clock3,
    }
  }
  return {
    title: '7개 탭 분석을 시작할 수 있어요',
    description:
      '같은 Gold 원천 버전을 기준으로 증명서 전체 결과를 생성합니다.',
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
  const message = lifecycleMessage(view)
  const Icon = message.icon
  const canGenerate =
    view.statusDetail.canGenerate || view.statusDetail.canRetry
  return (
    <section className="border-border bg-surface flex flex-col items-start gap-4 rounded-2xl border p-6">
      <span className="bg-accent-bg text-accent-strong flex size-10 items-center justify-center rounded-xl">
        <Icon
          className={pending ? 'size-5 animate-spin' : 'size-5'}
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
              : '7개 탭 분석 시작'}
        </button>
      )}
    </section>
  )
}

export function CertificateSevenTabPanel({
  active,
  target,
}: {
  active: CertTab
  target: Exclude<CertificateAnalysisTarget, { scope: 'demo' }>
}) {
  // 페이지 전체가 이 Query 하나를 공유하므로 탭을 바꿔도 추가 BFF 조회가 생기지 않는다.
  const query = useCertificateAnalysis(target)
  const create = useCreateCertificateAnalysis(target)

  return (
    <DataBoundary
      isPending={query.isPending}
      isError={query.isError || !query.data}
      onRetry={query.refetch}
      skeleton={<AiTabSkeleton />}
      errorTitle="증명서 분석 결과를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요. 문제가 계속되면 운영 담당자에게 문의해 주세요."
    >
      {query.data &&
        (isCertificateAnalysisReady(query.data) ? (
          <CertificateSevenTabContent active={active} tabs={query.data.tabs} />
        ) : (
          <AnalysisLifecycle
            view={query.data}
            pending={create.isPending}
            onGenerate={() => create.mutate()}
          />
        ))}
      {create.isError && (
        <p role="alert" className="text-danger mt-3 text-[13px]">
          분석을 요청하지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}
    </DataBoundary>
  )
}
