import { Modal } from '@/components/ui/Modal'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { EVALUATION_AXIS_LABELS } from '@/shared/constants'
import { usePeerEvaluations } from './api'
import type { PeerEvalMemberProgress, PeerEvaluation } from './types'

// 동료 평가 결과 — 여닫는 버튼만 있고 안을 볼 수단이 없어, 운영자는 평가가 실제로
// 이뤄지는지 알 수 없었다. 누가 아직 안 냈는지 보여야 독촉이라도 할 수 있다.

// 4축 라벨 — shared 정본(2026-08-06 멘토 축 사전 통일), 순서 = PeerEvaluation.scores 인덱스.
const AXES = EVALUATION_AXIS_LABELS

function ProgressRow({ m }: { m: PeerEvalMemberProgress }) {
  const done = m.givenExpected > 0 && m.givenSubmitted >= m.givenExpected
  return (
    <div className="border-divider flex items-center gap-3 border-b py-2.5 last:border-b-0">
      <Avatar name={m.name} size={28} />
      <span className="text-fg min-w-0 flex-1 truncate text-[13px] font-semibold">
        {m.name}
      </span>
      <span className="text-fg-subtle w-24 shrink-0 text-right text-[12px] tabular-nums">
        작성 {m.givenSubmitted}/{m.givenExpected}
      </span>
      <span className="text-fg-subtle w-20 shrink-0 text-right text-[12px] tabular-nums">
        받음 {m.receivedSubmitted}
      </span>
      <span className="text-fg w-20 shrink-0 text-right text-[13px] font-bold tabular-nums">
        {m.receivedAverage === null ? '—' : `${m.receivedAverage.toFixed(1)}점`}
      </span>
      <span className="w-16 shrink-0 text-right">
        <StatusBadge
          tone={done ? 'success' : 'warning'}
          label={done ? '완료' : '미제출'}
        />
      </span>
    </div>
  )
}

function EvaluationCard({ e }: { e: PeerEvaluation }) {
  return (
    <div
      className={cn(
        'bg-surface flex flex-col gap-2.5 rounded-xl p-4 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]',
        e.draft && 'opacity-70',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Avatar name={e.raterName} size={24} />
        <span className="text-fg text-[13px] font-bold">{e.raterName}</span>
        <span className="text-fg-subtle text-[12px]">→</span>
        <Avatar name={e.targetName} size={24} />
        <span className="text-fg text-[13px] font-bold">{e.targetName}</span>
        {e.draft && <StatusBadge tone="warning" label="임시저장" />}
        <span className="text-fg ml-auto text-[15px] font-bold tabular-nums">
          {e.average.toFixed(1)}
          <span className="text-fg-subtle text-[11px] font-normal"> / 5</span>
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {AXES.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-fg-subtle text-[11px]">{label}</span>
            <span className="text-fg text-[13px] font-semibold tabular-nums">
              {e.scores[i] ?? '-'}
            </span>
          </div>
        ))}
      </div>

      {e.comment && (
        <p className="bg-surface-muted text-fg rounded-lg px-3 py-2 text-[12px] leading-relaxed">
          {e.comment}
        </p>
      )}
      {e.submittedAt && (
        <span className="text-fg-subtle text-[11px]">{e.submittedAt}</span>
      )}
    </div>
  )
}

export function PeerEvalResultsModal({
  projectId,
  projectTitle,
  onClose,
}: {
  projectId: string
  projectTitle: string
  onClose: () => void
}) {
  const { data, isPending, isError, refetch } = usePeerEvaluations(projectId)

  return (
    <Modal
      open
      onClose={onClose}
      title={`동료 평가 현황 — ${projectTitle}`}
      size="lg"
    >
      <DataBoundary
        isPending={isPending}
        isError={isError}
        onRetry={refetch}
        errorTitle="동료 평가를 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
        skeleton={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="bg-surface-muted h-14 animate-pulse rounded-xl"
              />
            ))}
          </div>
        }
      >
        {data && (
          <div className="flex flex-col gap-5">
            <div className="bg-surface-muted flex items-center gap-4 rounded-xl px-4 py-3">
              <div className="flex flex-col">
                <span className="text-fg-subtle text-[11px]">제출</span>
                <span className="text-fg text-[18px] font-bold tabular-nums">
                  {data.submitted}
                  <span className="text-fg-subtle text-[12px] font-normal">
                    {' '}
                    / {data.expected}
                  </span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-fg-subtle text-[11px]">팀원</span>
                <span className="text-fg text-[18px] font-bold tabular-nums">
                  {data.memberCount}명
                </span>
              </div>
              <span className="ml-auto">
                <StatusBadge
                  tone={data.peerEvalEnabled ? 'success' : 'neutral'}
                  label={data.peerEvalEnabled ? '평가 진행 중' : '평가 닫힘'}
                />
              </span>
            </div>

            <section className="flex flex-col gap-1">
              <span className="text-fg text-[14px] font-bold">팀원별 진행</span>
              <div className="flex flex-col">
                {data.members.map((m) => (
                  <ProgressRow key={m.userId ?? m.name} m={m} />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2.5">
              <span className="text-fg text-[14px] font-bold">
                평가 내용 {data.evaluations.length}건
              </span>
              {data.evaluations.length === 0 ? (
                <p className="text-fg-subtle bg-surface-muted rounded-xl px-4 py-6 text-center text-[13px]">
                  아직 제출된 평가가 없어요
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {data.evaluations.map((e, i) => (
                    <EvaluationCard
                      key={`${e.raterUserId}-${e.targetUserId}-${i}`}
                      e={e}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </DataBoundary>
    </Modal>
  )
}
