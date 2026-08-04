import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Select } from './Select'

/**
 * 목록 위 필터 드롭다운 — [라벨 · 값▾].
 *
 * <p>화면마다 같은 것을 따로 만들고 있었다. 라벨 글자 크기와 간격이 조금씩 달라 목록을
 * 옮겨 다닐 때 필터 줄이 미묘하게 어긋났다. 운영 퀴즈 화면의 모양을 정본으로 삼는다.</p>
 *
 * <p>라벨을 &lt;label&gt; 로 감싸지 않는다 — 값 칸이 button 이라 label 클릭이 한 번 더
 * 전달돼 열자마자 닫힌다.</p>
 *
 * @example
 * <FilterSelect label="채점 모드" value={mode} onChange={setMode} options={MODE_OPTIONS} />
 */
export function FilterSelect({
  icon,
  label,
  value,
  onChange,
  options,
  className,
}: {
  /** 라벨 앞 아이콘 — 없으면 라벨만. */
  icon?: ReactNode
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
  /** 값 칸 크기 — 화면마다 줄 높이가 달라 호출부가 정한다. */
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2 text-xs')}>
      {icon}
      <span className="text-fg-subtle whitespace-nowrap">{label}</span>
      <Select
        aria-label={`${label} 필터`}
        value={value}
        onChange={onChange}
        options={[...options]}
        className={className}
      />
    </div>
  )
}
