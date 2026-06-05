import { cn } from '@/shared/lib/cn'
import type { CertTab } from './types'

// 증명서 5탭 바 — 종합 요약/기술·검증/프로젝트/문제해결·협업/성장·평판.
const CERT_TABS: { key: CertTab; label: string }[] = [
  { key: 'summary', label: '종합 요약' },
  { key: 'tech', label: '기술·검증' },
  { key: 'projects', label: '프로젝트' },
  { key: 'problem-solving', label: '문제해결·협업' },
  { key: 'growth-reputation', label: '성장·평판' },
]

export function CertTabs({
  active,
  onChange,
}: {
  active: CertTab
  onChange: (t: CertTab) => void
}) {
  return (
    <nav className="border-border bg-surface flex w-full gap-1 rounded-[14px] border p-1.5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
      {CERT_TABS.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              'flex-1 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold',
              isActive
                ? 'bg-brand/10 text-brand'
                : 'text-fg-muted hover:bg-surface-muted',
            )}
          >
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
