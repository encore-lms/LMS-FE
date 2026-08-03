import { Search } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

/**
 * 목록 위에 놓는 검색 칸 — 돋보기 + 입력.
 *
 * <p>같은 모양이 화면마다 인라인으로 복제돼 있었다. 폭·높이·포커스 테두리가 조금씩 어긋나
 * 목록을 옮겨 다닐 때 칸이 미묘하게 달라 보였다.</p>
 *
 * @example
 * <SearchInput value={q} onChange={setQ} placeholder="제목·내용 검색" ariaLabel="자료 검색" />
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** 스크린리더용 이름 — 화면마다 무엇을 찾는지 다르므로 호출부가 정한다. */
  ariaLabel: string
  className?: string
}) {
  // cn 은 단순 join 이라 기본 크기와 넘겨받은 크기가 함께 남는다. 그러면 어느 쪽이 이길지는
  // Tailwind 가 유틸리티를 찍어낸 순서에 달려 — w-52 를 넘겨도 기본 w-56 이 이겨 무시됐다.
  // 호출부가 크기를 정했으면 기본값을 아예 빼서, 순서에 기대지 않게 한다.
  const sized = className ?? ''
  const hasWidth = /(^|\s)(w-|max-w-|min-w-|flex-1)/.test(sized)
  const hasHeight = /(^|\s)h-/.test(sized)

  return (
    <div
      className={cn(
        'border-border focus-within:border-brand bg-surface flex items-center gap-2 rounded-lg border px-3',
        !hasWidth && 'w-56',
        !hasHeight && 'h-9',
        className,
      )}
    >
      <Search className="text-fg-subtle h-4 w-4 shrink-0" aria-hidden="true" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none focus-visible:shadow-none"
      />
    </div>
  )
}
