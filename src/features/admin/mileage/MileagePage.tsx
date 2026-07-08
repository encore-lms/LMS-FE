import {
  AlertTriangle,
  ArrowRight,
  Coins,
  Gauge,
  Info,
  Package,
  Receipt,
  ShoppingCart,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useMileageOverview } from './api'
import type { MileageAlertTone, MileageTabCard } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'

const ALERT_TONE: Record<MileageAlertTone, BadgeTone> = {
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',
}

// 탭 카드 아이콘·아이콘 배경 톤(Figma 색 대응).
const TAB_ICON: Record<string, { icon: typeof Receipt; tone: string }> = {
  history: { icon: Receipt, tone: 'bg-info-bg text-info' },
  'direct-pay': { icon: Coins, tone: 'bg-success-bg text-success' },
  'purchase-requests': {
    icon: ShoppingCart,
    tone: 'bg-accent-bg text-accent-strong',
  },
  products: { icon: Package, tone: 'bg-success-bg text-success' },
  'type-limits': { icon: Gauge, tone: 'bg-surface-muted text-fg-muted' },
}

// 마일리지 관리 (/admin/mileage) — 운영(MANAGER/ADMIN) 신규.
// Figma 1127:5639. 13장 클러스터의 진입 허브 — 발행/사용/잔액 + 경보 + 5개 콘텐츠 탭.
// 각 탭 진입 화면은 후속 구현(미구현) → CTA는 토스트 + TODO(route 주석).
export default function MileagePage() {
  usePageHeader(
    '마일리지 관리',
    '마일리지 지급과 구매 요청, 상품을 한 곳에서 관리합니다',
  )
  const { data, isPending, isError, refetch } = useMileageOverview()
  const toast = useToast()
  const navigate = useNavigate()

  if (isPending) {
    return <SkeletonListPage kpis={4} columns={5} />
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="마일리지 현황을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { hero, alerts, tabs } = data

  const openTab = (t: MileageTabCard) => {
    // 구현된 탭은 해당 화면으로 이동, 미구현 탭은 준비 중 토스트(ready 플래그 기준).
    if (t.ready) navigate(t.route)
    else toast.info(`${t.cta}는 준비 중입니다.`)
  }

  return (
    <div className="p-8">
      {/* 노출 안내 칩 */}
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <span className="bg-info-bg text-info inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold">
          <Info className="h-3 w-3" />
          마일리지 기능 사용 과정만 노출
        </span>
      </div>

      {/* 히어로 — 과정/기수 + 발행·사용·잔액 */}
      <div className="bg-brand text-on-color rounded-xl p-6">
        <p className="text-[17px] font-bold">
          마일리지 지급·차감·구매·상품·한도를 한 곳에서 운영합니다
        </p>
        <p className="text-on-color/75 mt-2 text-[13px]">
          {hero.course} · {hero.cohortLabel}
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <HeroStat label="총 발행" value={hero.issued} hint="누적" />
          <HeroStat label="사용" value={hero.used} hint={hero.usedRate} />
          <HeroStat
            label="잔액"
            value={hero.balance}
            hint={`${hero.studentCount}명`}
          />
        </div>
      </div>

      {/* 경보 4종 */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="border-border bg-surface rounded-xl border p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-fg-muted text-xs font-medium">
                {a.label}
              </span>
              <StatusBadge label={a.count} tone={ALERT_TONE[a.tone]} />
            </div>
            <p className="text-fg-muted mt-2 text-[11px]">{a.note}</p>
          </div>
        ))}
      </div>

      {/* 콘텐츠 탭 헤더 */}
      <div className="mt-6 flex items-center justify-between gap-2">
        <span className="text-fg text-base font-bold">콘텐츠 탭</span>
        <span className="bg-surface-muted text-fg-muted rounded-md px-2.5 py-1 text-[11px] font-bold">
          탭 상태 URL 반영
        </span>
      </div>

      {/* 5개 콘텐츠 탭 카드 */}
      <div className="mt-3 flex flex-col gap-3">
        {tabs.map((t) => {
          const meta = TAB_ICON[t.id] ?? {
            icon: Receipt,
            tone: 'bg-surface-muted text-fg-muted',
          }
          const Icon = meta.icon
          return (
            <div
              key={t.id}
              className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-5 lg:flex-row lg:items-center"
            >
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  meta.tone,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-fg text-[15px] font-bold">{t.title}</p>
                  <span className="text-fg-subtle font-mono text-[11px]">
                    {t.model}
                  </span>
                </div>
                <p className="text-fg-muted mt-1 text-[13px]">
                  {t.description}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {t.stats.map((s) => (
                    <span
                      key={s.label}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px]',
                        s.positive
                          ? 'bg-success-bg text-success'
                          : 'bg-surface-muted text-fg-muted',
                      )}
                    >
                      {s.label}
                      <span className="font-bold">{s.value}</span>
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openTab(t)}
                className="border-border text-fg hover:bg-surface-muted inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-4 text-[13px] font-semibold transition-colors"
              >
                {t.cta}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* 마일리지 운영 정책 — 하단 콜아웃 */}
      <div className="border-info/30 bg-info-bg/50 mt-6 rounded-xl border p-5">
        <p className="text-info inline-flex items-center gap-1.5 text-base font-bold">
          <Info className="h-4 w-4" />
          마일리지 운영 정책 · 완료 기준
        </p>
        <ul className="text-info/90 mt-2 flex flex-col gap-1.5 text-[13px] leading-relaxed">
          <li>
            마일리지 기능 사용 과정에서만 매니저 사이드바 탭이 노출됩니다 (교육
            과정 설정 토글)
          </li>
          <li>5개 탭은 URL에 반영됩니다 — 새로고침 후에도 동일 탭 유지</li>
          <li>
            처리 결과는 원장(MileageTransaction)과 구매 요청(MileageOrder)
            상태에 즉시 반영됩니다
          </li>
        </ul>
      </div>
    </div>
  )
}

// 히어로 내 KPI — M 단위 발행/사용/잔액.
function HeroStat({
  label,
  value,
  hint,
}: {
  label: string
  value: number
  hint: string
}) {
  return (
    <div className="bg-surface/10 rounded-xl p-4">
      <p className="text-on-color/70 text-[12px]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="text-on-color/60 text-[11px]">M · {hint}</p>
    </div>
  )
}
