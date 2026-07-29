import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { ChangeDiffItem } from '@/shared/types'

// 변경된 내역 접힘 카드 — 클릭 시 이전 값/변경 값 비교 노출. (Figma 2750:2202 '변경된 내역만 보기')
// 변경 제안 상세 패널과 재인증 상세가 같은 비교 UI를 공유한다.
export function ChangeDiffCard({ item }: { item: ChangeDiffItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-border rounded-lg border bg-[#fbfcfe]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="text-fg block text-sm font-semibold">
            {item.label}
          </span>
          {!open && (
            <span className="text-fg-subtle mt-0.5 block text-xs">
              이전 값과 변경 값을 접힘 카드 안에서 비교
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'text-fg-subtle h-4 w-4 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="border-divider grid gap-3 border-t px-4 py-3.5 md:grid-cols-2">
          <div>
            <p className="text-fg-subtle text-xs font-semibold">이전 값</p>
            <p className="text-fg-muted mt-1 text-sm">{item.before}</p>
          </div>
          <div>
            <p className="text-success text-xs font-semibold">변경 값</p>
            <p className="text-fg mt-1 text-sm">{item.after}</p>
          </div>
        </div>
      )}
    </div>
  )
}
