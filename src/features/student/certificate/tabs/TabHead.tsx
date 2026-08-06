export function TabHead({
  no,
  title,
  sub,
  children,
}: {
  no: number
  title: string
  sub: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="bg-brand-deep flex size-6 items-center justify-center rounded-md text-[12px] font-bold text-white">
          {no}
        </span>
        <div className="flex flex-col">
          <h2 className="text-fg text-[18px] font-bold">{title}</h2>
          <span className="text-fg-subtle text-[11px]">{sub}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  )
}
