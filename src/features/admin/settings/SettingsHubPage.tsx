import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  Info,
  KeyRound,
  PlusCircle,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { SettingsCardSummary } from '@/shared/types'
import { useSettingsHub } from '../api/settings'

interface CardDef {
  key: 'accounts' | 'hrdKey' | 'courseConfig' | 'courseAdd'
  title: string
  description: string
  priority: 'P0' | 'P1'
  to: string
  cta: string
  icon: React.ReactNode
  /** 카드 상단 액센트 바 색 */
  accent: string
  iconBg: string
  /** 카드 하단 보조 안내 (계정 관리만 사용) */
  note?: string
}

const CARDS: CardDef[] = [
  {
    key: 'accounts',
    title: '계정 관리',
    description: '매니저·강사·멘토 계정과 기본 권한 관리',
    priority: 'P0',
    to: '/admin/settings/accounts',
    cta: '계정 관리 열기',
    icon: <Star className="h-5 w-5" />,
    accent: 'bg-accent-strong',
    iconBg: 'bg-accent-bg text-accent-strong',
    note: '멘토의 팀 배정·N시간 설정은 §29 멘토 배정 관리에서 처리합니다',
  },
  {
    key: 'hrdKey',
    title: 'HRD API Key',
    description: 'HRD-Net API Key 등록·교체·폐기',
    priority: 'P1',
    to: '/admin/settings/hrd-api-key',
    cta: '키 관리 열기',
    icon: <KeyRound className="h-5 w-5" />,
    accent: 'bg-info',
    iconBg: 'bg-info-bg text-info',
  },
  {
    key: 'courseConfig',
    title: '교육 과정 설정',
    description: '과정별 기능 토글과 운영 정책 관리',
    priority: 'P1',
    to: '/admin/settings/course-config',
    cta: '과정 설정 열기',
    icon: <FileText className="h-5 w-5" />,
    accent: 'bg-brand',
    iconBg: 'bg-brand/10 text-brand',
  },
  {
    key: 'courseAdd',
    title: '교육 과정 추가',
    description: 'HRD-Net 검색으로 신규 과정·기수 생성',
    priority: 'P1',
    to: '/admin/settings/courses/new',
    cta: '과정 추가 열기',
    icon: <PlusCircle className="h-5 w-5" />,
    accent: 'bg-success',
    iconBg: 'bg-success-bg text-success',
  },
]

const POLICY_ITEMS = [
  { label: '권한', value: '매니저 권한 필수' },
  { label: 'URL 반영', value: '탭별 sub-route' },
  { label: '저장 후', value: '감사 로그 자동 기록' },
  { label: '저장/취소', value: '탭 내 폼에서 노출' },
]

// 운영 설정 허브 (/admin/settings) — 4개 설정 진입 카드 + 변경 정책 + 최근 감사 로그.
// (Figma 1284:8852, MANAGER SETTINGS) 하위 화면은 탭별 sub-route로 이동.
export default function SettingsHubPage() {
  const { data, isPending, isError, refetch } = useSettingsHub()
  const toast = useToast()
  usePageHeader(
    '운영 설정',
    '계정 관리 · HRD API Key · 교육 과정 설정 · 교육 과정 추가 · 변경 시 감사 로그 자동 저장',
  )

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="설정 요약을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const summaries: Record<CardDef['key'], SettingsCardSummary> = {
    accounts: data.accounts,
    hrdKey: data.hrdKey,
    courseConfig: data.courseConfig,
    courseAdd: data.courseAdd,
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-fg-muted text-xs font-medium">운영</span>
        <span className="text-fg-subtle text-sm">›</span>
        <span className="text-fg text-xs font-medium">설정</span>
        <div className="ml-auto">
          <StatusBadge label="매니저 권한" tone="accent" />
        </div>
      </div>

      {/* 히어로 */}
      <div className="bg-brand mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-7 py-6 text-white shadow-lg">
        <div>
          <p className="text-[11px] font-semibold tracking-[2px]">
            MANAGER SETTINGS · 운영 설정 허브
          </p>
          <p className="mt-1 text-2xl font-bold">
            운영에 필요한 4개 설정에 진입합니다
          </p>
          <p className="mt-1 text-xs">
            계정·키·과정 설정 변경은 자동으로 감사 로그에 기록됩니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              toast.info('감사 로그 전체 페이지는 후속 화면 (mock)')
            }
            className="flex items-center gap-1.5 rounded-lg border border-white px-3.5 py-2 text-xs font-semibold"
          >
            <Clock className="h-3.5 w-3.5" /> 감사 로그 보기
          </button>
          <div className="text-right">
            <p className="text-[10px] font-medium tracking-wide">마지막 변경</p>
            <p className="text-xs font-bold">
              {data.lastChange.at} · {data.lastChange.by}
            </p>
          </div>
        </div>
      </div>

      {/* 설정 카드 4 */}
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => (
          <div
            key={card.key}
            className={cn(
              'bg-surface flex flex-col overflow-hidden rounded-2xl border',
              card.priority === 'P0'
                ? 'border-brand-deep border-2 shadow-md'
                : 'border-border shadow-sm',
            )}
          >
            <div className={cn('h-1', card.accent)} />
            <div className="flex flex-1 flex-col gap-3.5 px-5 py-4">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl',
                    card.iconBg,
                  )}
                >
                  {card.icon}
                </div>
                <StatusBadge
                  label={card.priority}
                  tone={card.priority === 'P0' ? 'danger' : 'warning'}
                />
              </div>
              <div>
                <p className="text-fg text-[17px] font-bold">{card.title}</p>
                <p className="text-fg-muted mt-1 text-xs">{card.description}</p>
              </div>
              <div className="bg-surface-muted flex flex-col gap-2 rounded-lg px-3.5 py-3">
                {summaries[card.key].rows.map((r, i) => (
                  <div
                    key={r.label}
                    className={cn(
                      'flex items-center justify-between',
                      i > 0 && 'border-border border-t pt-2',
                    )}
                  >
                    <span className="text-fg-subtle text-[11px] font-medium">
                      {r.label}
                    </span>
                    <span className="text-fg text-xs font-bold">{r.value}</span>
                  </div>
                ))}
              </div>
              {card.note && (
                <p className="text-fg-subtle flex items-start gap-1.5 text-[11px]">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  {card.note}
                </p>
              )}
              <Link
                to={card.to}
                className={cn(
                  'mt-auto flex h-10 items-center justify-center gap-1.5 rounded-lg text-[13px] font-bold',
                  card.priority === 'P0'
                    ? 'bg-brand-deep text-white'
                    : 'border-border text-fg hover:bg-surface-muted border',
                )}
              >
                {card.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 설정 변경 정책 */}
      <div className="bg-info-bg border-info mt-5 flex items-center gap-3.5 rounded-xl border p-4">
        <div className="bg-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <Info className="text-info h-5 w-5" />
        </div>
        <div>
          <p className="text-fg text-sm font-bold">설정 변경 정책</p>
          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
            {POLICY_ITEMS.map((p) => (
              <div key={p.label}>
                <p className="text-fg-subtle text-[10px] font-medium tracking-wide">
                  {p.label}
                </p>
                <p className="text-fg text-xs font-bold">{p.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 감사 로그 */}
      <div className="border-border bg-surface mt-5 rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            <p className="text-fg text-sm font-bold">최근 감사 로그</p>
            <p className="text-fg-subtle text-[11px]">
              설정 변경 7일 이력 요약 · 전체는 감사 로그 페이지에서
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              toast.info('감사 로그 전체 페이지는 후속 화면 (mock)')
            }
            className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium"
          >
            전체 로그 <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {data.auditLogs.map((log) => (
          <div
            key={log.id}
            className="border-divider flex items-center gap-4 border-t px-5 py-3"
          >
            <div className="w-24 shrink-0">
              <p className="text-fg text-xs font-bold">{log.at}</p>
              <p className="text-fg-subtle text-[11px]">{log.actor}</p>
            </div>
            <span className="bg-surface-muted text-fg-muted shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold">
              {log.origin}
            </span>
            <p className="text-xs">
              <span className="text-fg font-bold">{log.action}</span>
              <span className="text-fg-subtle"> · </span>
              <span className="text-fg-muted">{log.detail}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
