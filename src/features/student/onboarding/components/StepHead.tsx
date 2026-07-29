// 온보딩 단계 카드 헤더 — STEP NN / 03 + 제목 + 설명.
export function StepHead({
  no,
  title,
  sub,
}: {
  no: string
  title: string
  sub: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-brand text-[11px] font-bold tracking-wider">
        STEP {no} / 03
      </span>
      <h2 className="text-fg text-[18px] font-bold">{title}</h2>
      <p className="text-fg-muted text-[12px] leading-5">{sub}</p>
    </div>
  )
}
