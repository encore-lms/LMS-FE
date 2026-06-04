// 캘린더 상단 — 제목 + 월 네비게이션(‹ 2026년 5월 ›). 핸들러가 없으면 화살표 비활성.
const Arrow = ({ dir }: { dir: 'prev' | 'next' }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden
  >
    <path
      d={dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

interface CalendarHeaderProps {
  label: string
  onPrev?: () => void
  onNext?: () => void
}

export function CalendarHeader({ label, onPrev, onNext }: CalendarHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-fg font-bold">HRD-Net 출결 캘린더</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="이전 달"
          onClick={onPrev}
          disabled={!onPrev}
          className="text-fg-muted hover:text-fg disabled:opacity-40"
        >
          <Arrow dir="prev" />
        </button>
        <span className="text-fg text-sm font-medium">{label}</span>
        <button
          type="button"
          aria-label="다음 달"
          onClick={onNext}
          disabled={!onNext}
          className="text-fg-muted hover:text-fg disabled:opacity-40"
        >
          <Arrow dir="next" />
        </button>
      </div>
    </div>
  )
}
