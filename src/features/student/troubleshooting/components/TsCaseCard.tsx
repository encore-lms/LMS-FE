import { AlertCircle, ArrowRight, Check, Link2, Timer, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { InteractiveCard } from '@/components/ui/InteractiveCard'
import type { TsCase, TsStatus, Tone } from '../types'
import { TONE_SOFT } from '@/shared/lib/tone'

// 트러블슈팅 사례 카드 — 목록 화면과 프로젝트 워크스페이스(연결된 사례)에서 공용으로 쓴다.
// 표시는 동일하고, 우상단 액션(라벨/동작)만 사용처가 주입한다.
const STATUS: Record<TsStatus, Tone> = {
  certified: 'success',
  reviewing: 'warning',
  draft: 'accent',
}

// 보완 요청·인증 취소는 status 가 draft 라, 톤까지 '작성 중'과 같으면 목록에서 구분되지 않는다.
function statusTone(c: TsCase): Tone {
  return c.reviewStatus ? 'danger' : STATUS[c.status]
}

export function TsCaseCard({
  c,
  onOpen,
  actionLabel,
  onRemove,
  removeLabel = '연결 해제',
  removeDisabledReason = null,
  connection,
  onShowReason,
}: {
  c: TsCase
  onOpen: (c: TsCase) => void
  /** 우상단 버튼 라벨. 미지정 시 사례의 기본 액션(이어 작성/사례 열기). */
  actionLabel?: string
  /** 지정 시 우상단 보조 버튼을 노출 — 목록은 사례 삭제, 워크스페이스는 연결 해제(removeLabel로 구분). */
  onRemove?: () => void
  removeLabel?: string
  /**
   * 값이 있으면 버튼을 비활성으로 두고 그 이유를 툴팁으로 알린다.
   * 버튼을 아예 숨기면 "왜 못 지우지"를 알 수 없고, 그대로 두면 눌러 보고 실패한다.
   */
  removeDisabledReason?: string | null
  /** 헤더에 프로젝트 연결 상태 칩 — 인증 완료 사례에 연결됨(프로젝트명)/연결 필요 표시. */
  connection?: { label: string; ok: boolean }
  /** 강사 반려 사례 — '반려 사유' 버튼 클릭 시 호출(사유 모달 열기). */
  onShowReason?: () => void
}) {
  const label = actionLabel ?? c.actionLabel
  // 작성 중(이어 작성)만 강조 버튼, 나머지는 보조 버튼.
  const primary = c.status === 'draft'
  return (
    // 카드 전체 클릭 = 상세 열기 — 공용 InteractiveCard(프로젝트 카드 정본 인터랙션).
    // 내부 액션 버튼들은 stopPropagation으로 카드 클릭과 분리한다.
    <InteractiveCard
      onOpen={() => onOpen(c)}
      ariaLabel={`${c.title} 상세 보기`}
      className="bg-surface flex flex-col gap-3 rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[11px] font-bold',
              TONE_SOFT[c.categoryTone],
            )}
          >
            {c.category}
          </span>
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[11px] font-bold',
              TONE_SOFT[statusTone(c)],
            )}
          >
            {c.statusLabel}
          </span>
          {c.independent && (
            <span className="bg-brand/10 text-brand flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold">
              <Check className="size-3" /> 독립 해결
            </span>
          )}
          {connection && (
            <span
              className={cn(
                'flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold',
                connection.ok
                  ? 'bg-success-bg text-success'
                  : 'bg-warning-bg text-warning',
              )}
            >
              <Link2 className="size-3" /> {connection.label}
            </span>
          )}
          <span className="text-fg-subtle flex items-center gap-1 text-[11px]">
            <Timer className="size-3" /> {c.days}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (removeDisabledReason) return
                  onRemove()
                }}
                disabled={!!removeDisabledReason}
                title={removeDisabledReason ?? undefined}
                aria-disabled={!!removeDisabledReason}
                className="border-border text-fg-muted hover:border-danger hover:text-danger inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[color:var(--color-border)] disabled:hover:text-[color:var(--color-fg-muted)]"
              >
                <X className="size-3" />
                {removeLabel}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpen(c)
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-4 py-2 text-[12px] font-bold',
                primary
                  ? 'bg-brand text-white'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {label}
              <ArrowRight className="size-3" />
            </button>
          </div>
          {/* 강사가 돌려보낸 사례 — 사유를 목록에서 바로 본다. 클릭=사유 모달, 호버=미리보기.
              예전에는 상세로 들어가야만 무엇을 고쳐야 하는지 알 수 있었다. */}
          {c.reviewComment && onShowReason && (
            <div className="group/rj relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onShowReason()
                }}
                className="text-danger inline-flex items-center gap-1 text-[11px] font-semibold"
              >
                <AlertCircle className="size-3" />
                {c.reviewStatus === 'revoked' ? '취소 사유' : '보완 사유'}
              </button>
              <div className="border-border bg-surface text-fg-muted invisible absolute top-full right-0 z-20 mt-1 w-64 rounded-lg border p-3 text-left text-[11px] leading-4 opacity-0 shadow-lg transition group-hover/rj:visible group-hover/rj:opacity-100">
                <span className="text-danger mb-1 block text-[10px] font-bold">
                  {c.reviewStatus === 'revoked'
                    ? '강사 인증 취소 사유'
                    : '강사 보완 요청 사유'}
                </span>
                {c.reviewComment}
              </div>
            </div>
          )}
        </div>
      </div>
      <h3 className="text-fg text-[16px] font-bold">{c.title}</h3>
      <span className="text-fg-subtle text-[11px]">
        {c.createdAt} · {c.updatedAt}
      </span>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {[
          { label: '상황', text: c.situation },
          { label: '해결', text: c.resolution },
          { label: '결과', text: c.result },
        ].map((b) => (
          <div
            key={b.label}
            className="bg-surface-muted/50 flex flex-col gap-1 rounded-[10px] p-3"
          >
            <span className="text-fg-subtle text-[11px] font-bold">
              {b.label}
            </span>
            <span className="text-fg-muted line-clamp-3 text-[12px] leading-5">
              {b.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {c.tags.map((t) => (
          <span key={t} className="text-fg-muted text-[11px]">
            {t}
          </span>
        ))}
      </div>
    </InteractiveCard>
  )
}
