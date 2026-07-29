import { Fragment } from 'react'
import { buttonClass } from '@/components/ui/buttonClass'
import type { MentoringHistoryRow } from '../types'

// 멘토링 기록 섹션(flat 구분선 리스트) — 완료 기록 + 헤더의 "새 멘토링 요청" 버튼(팝업 트리거).
// 진행 중 3건 한도·멘토 미배정이면 버튼 비활성 + 사유 표기. 기록 0건이어도 항상 렌더(요청 진입점 유지).
const COLS = 'grid grid-cols-[40px_1.7fr_1.4fr_1.3fr_0.9fr_0.7fr] gap-3'

export function MentoringHistorySection({
  rows,
  onNewRequest,
  canRequest,
  disabledReason,
}: {
  rows: MentoringHistoryRow[]
  onNewRequest: () => void
  canRequest: boolean
  disabledReason?: string
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-fg text-[16px] font-bold">멘토링 기록</h2>
          <span className="text-fg-subtle text-[12px]">{rows.length}건</span>
        </div>
        <div className="flex items-center gap-2.5">
          {!canRequest && disabledReason && (
            <span className="text-fg-subtle hidden text-[12px] sm:inline">
              {disabledReason}
            </span>
          )}
          <button
            type="button"
            onClick={onNewRequest}
            disabled={!canRequest}
            className={buttonClass({ size: 'sm' })}
            title={!canRequest ? disabledReason : undefined}
          >
            + 새 멘토링 요청
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-fg-subtle py-14 text-center text-[13px] leading-6">
          아직 완료된 멘토링 기록이 없어요.
          <br />
          {canRequest
            ? '‘새 멘토링 요청’으로 첫 일정을 요청해 보세요.'
            : disabledReason}
        </p>
      ) : (
        <div className="flex flex-col">
          <div
            className={`${COLS} text-fg-subtle px-1 pb-2 text-[11px] font-bold`}
          >
            <span>회차</span>
            <span>일시</span>
            <span>장소</span>
            <span>예상/완료</span>
            <span>요청자</span>
            <span>상태</span>
          </div>
          {rows.map((r, i) => (
            <Fragment key={r.round}>
              {i > 0 && <div className="bg-divider h-px w-full" />}
              <div
                className={`${COLS} text-fg items-center px-1 py-3 text-[12px]`}
              >
                <span className="font-bold">{r.round}</span>
                {/* "2026-03-25(수) 19:00 ~ 21:00" — 공백에서 끊기면 행이 2줄이 된다 */}
                <span className="font-medium whitespace-nowrap">
                  {r.datetime}
                </span>
                <span className="text-fg-muted font-medium">{r.place}</span>
                <span className="text-fg-muted font-medium">{r.hours}</span>
                <span className="text-fg-muted font-medium">{r.requester}</span>
                <span>
                  <span className="bg-success-bg text-success rounded-[5px] px-1.5 py-[3px] text-[11px] font-bold">
                    ✓ 완료
                  </span>
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </section>
  )
}
