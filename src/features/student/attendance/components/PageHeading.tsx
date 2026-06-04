// 페이지 상단 제목 블록 — 출결/태도·출결 폼 두 화면 공통(본문 영역 헤딩).
export function PageHeading({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-fg text-2xl font-bold">{title}</h1>
      {description && <p className="text-fg-muted text-sm">{description}</p>}
    </div>
  )
}
