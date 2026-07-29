import type { MentoringData } from '../types'

// 멘토링 히어로 — 팀명·담당 멘토·상태 + 진행/완료 KPI. 히어로 배경은 brand 단색 통일(SSOT).
export function MentoringHero({ data }: { data: MentoringData }) {
  const { teamName, mentor, kpis } = data
  const hasProposal = (
    data.activeRequests ?? (data.activeRequest ? [data.activeRequest] : [])
  ).some((request) => request.status === 'proposed')
  return (
    <section className="bg-brand flex items-center justify-between gap-6 rounded-2xl px-7 py-6 text-white shadow-[0px_8px_22px_0px_rgba(26,140,133,0.18)]">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-white/90">
          MENTORING · 팀 단위 요청
        </span>
        <h2 className="text-2xl font-bold">{teamName}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {mentor.assigned ? (
            <>
              <span className="bg-surface text-fg flex items-center gap-1.5 rounded-[7px] py-1 pr-2.5 pl-1">
                <span className="bg-accent-strong flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
                  {mentor.name.slice(0, 1)}
                </span>
                <span className="text-[12px] font-bold">
                  담당 멘토 {mentor.name}
                </span>
              </span>
              {hasProposal && (
                <span className="bg-warning-bg text-warning rounded-[7px] px-2.5 py-[5px] text-[12px] font-bold">
                  조정 제안 응답 대기
                </span>
              )}
              <span className="flex items-center gap-1.5 rounded-[7px] bg-white/15 px-2.5 py-[5px] text-[11px] font-medium">
                <span>담당 멘토 배정됨</span>
                <span>·</span>
                <span>누적 {kpis.cumulativeHours}h</span>
                <span>·</span>
                <span className="font-bold">잔여 {kpis.remainingHours}h</span>
              </span>
            </>
          ) : (
            <>
              <span className="bg-surface text-fg flex items-center gap-1.5 rounded-[7px] py-1 pr-2.5 pl-1">
                <span className="bg-accent-strong flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
                  {mentor.name.slice(0, 1)}
                </span>
                <span className="text-[12px] font-bold">
                  아직 배정된 멘토가 없습니다
                </span>
              </span>
              <span className="bg-warning-bg text-warning flex items-center gap-1.5 rounded-[7px] px-2.5 py-[5px] text-[12px] font-bold">
                ⏱ 멘토 배정 대기
              </span>
              <span className="flex items-center gap-1.5 rounded-[7px] bg-white/15 px-2.5 py-[5px] text-[11px] font-medium">
                <span>요청 불가</span>
                <span>·</span>
                <span>멘토 배정 전</span>
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-[18px]">
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span className="text-[10px] font-medium tracking-wider">
            진행 중
          </span>
          <span className="text-[22px] font-bold">{kpis.inProgress}</span>
          <span className="text-[10px] font-medium text-white/90">
            진행 {kpis.inProgress} / 한도 {kpis.requestLimit}
          </span>
        </div>
        <span className="h-10 w-px bg-white/40" />
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span className="text-[10px] font-medium tracking-wider">완료</span>
          <span className="text-[22px] font-bold">{kpis.completed}</span>
          <span className="text-[10px] font-medium text-white/90">
            최근 60일
          </span>
        </div>
      </div>
    </section>
  )
}
