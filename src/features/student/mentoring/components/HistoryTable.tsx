import { Fragment } from 'react'
import type { MentoringHistoryRow } from '../types'

// 완료 기록 테이블 — 회차·일시·장소·예상/완료·요청자·상태. 일지 상세는 비공개(요약만).
const COLS = 'grid grid-cols-[48px_1.6fr_1.4fr_1.3fr_1fr_0.8fr_0.8fr] gap-3'

export function HistoryTable({ rows }: { rows: MentoringHistoryRow[] }) {
  return (
    <section className="border-border bg-surface overflow-hidden rounded-2xl border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
      <div className="flex items-center justify-between px-6 pt-[18px] pb-3.5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-fg text-[15px] font-bold">완료 기록</h2>
          <span className="text-fg-subtle text-[11px]">
            일지 상세는 비공개 — 일정·장소·완료 여부만 표시
          </span>
        </div>
        <span className="bg-surface-muted text-fg-muted rounded-md px-2.5 py-1 text-[11px] font-bold">
          총 {rows.length}건
        </span>
      </div>
      <div
        className={`${COLS} bg-surface-muted text-fg-muted px-6 py-2.5 text-[11px] font-bold`}
      >
        <span>회차</span>
        <span>일시</span>
        <span>장소</span>
        <span>예상/완료</span>
        <span>요청자</span>
        <span>상태</span>
        <span className="text-right" />
      </div>
      {rows.map((r, i) => (
        <Fragment key={r.round}>
          {i > 0 && <div className="bg-divider h-px w-full" />}
          <div
            className={`${COLS} text-fg items-center px-6 py-3.5 text-[12px]`}
          >
            <span className="font-bold">{r.round}</span>
            <span className="font-medium">{r.datetime}</span>
            <span className="font-medium">{r.place}</span>
            <span className="font-medium">{r.hours}</span>
            <span className="font-medium">{r.requester}</span>
            <span>
              <span className="bg-success-bg text-success rounded-[5px] px-1.5 py-[3px] text-[11px] font-bold">
                ✓ 완료
              </span>
            </span>
            <span className="text-right">
              <span className="bg-surface-muted text-fg-muted rounded-md px-2 py-1 text-[11px] font-medium">
                요약
              </span>
            </span>
          </div>
        </Fragment>
      ))}
    </section>
  )
}
