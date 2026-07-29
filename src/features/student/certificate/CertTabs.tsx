import { cn } from '@/shared/lib/cn'
import type { CertTab } from './types'
import { CERT_V2 } from './config'

// 증명서 탭 바 — 데이터 5탭 + 이력서(+ v2 'AI 분석' 탭은 CERT_V2 켜질 때만).
const CERT_TABS: { key: CertTab; label: string }[] = [
  { key: 'summary', label: '종합 요약' },
  { key: 'tech', label: '기술·검증' },
  { key: 'projects', label: '프로젝트' },
  { key: 'problem-solving', label: '문제해결·협업' },
  { key: 'growth-reputation', label: '성장·평판' },
  { key: 'resume', label: '이력서' },
]
// AI 해석 콘텐츠는 데이터 탭에서 분리해 전용 탭으로(데이터 vs AI 구분).
const AI_TAB: { key: CertTab; label: string } = {
  key: 'ai-analysis',
  label: '✦ AI 분석',
}

export function CertTabs({
  active,
  onChange,
}: {
  active: CertTab
  onChange: (t: CertTab) => void
}) {
  const tabs = CERT_V2 ? [...CERT_TABS, AI_TAB] : CERT_TABS
  return (
    <nav className="bg-surface flex w-full gap-1 rounded-[14px] p-1.5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
      {tabs.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              // 탭 7개가 균등 분할되면 좁은 폭에서 '문제해결·협업'이 두 줄이 된다.
              'flex-1 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap',
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
