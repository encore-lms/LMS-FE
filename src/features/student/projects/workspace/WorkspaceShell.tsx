import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  CircleCheck,
  Clipboard,
  Files,
  FileText,
  Flag,
  House,
  Info,
  Settings,
  Send,
  Star,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { WsTab } from '../types'

// 프로젝트 워크스페이스 공통 셸 — 제목·메타는 공유 헤더에 등록 + 10탭 바. Figma 342:1032 외.
// 탭 아이콘은 Figma 탭 행(2568:5400) 기준 — Bootstrap → lucide 매핑.
const TABS: { key: WsTab; label: string; icon: LucideIcon }[] = [
  { key: 'home', label: '홈', icon: House },
  { key: 'board', label: '보드·작업', icon: Clipboard },
  { key: 'calendar', label: '캘린더', icon: Calendar },
  { key: 'meetings', label: '회의록', icon: FileText },
  { key: 'docs', label: '문서·파일·위키', icon: Files },
  { key: 'issues', label: '이슈', icon: TriangleAlert },
  { key: 'outcomes', label: '성과', icon: CircleCheck },
  { key: 'peer-evaluation', label: '상호평가', icon: Star },
  { key: 'certification', label: '인증 요청', icon: Info },
  { key: 'settings', label: '설정', icon: Settings },
]

export function WorkspaceShell({
  title,
  meta,
  startDate,
  endDate,
  active,
  onTab,
  visibleTabs,
  readOnly = false,
  teamLocked = false,
  backTo,
  children,
}: {
  title: string
  meta: string
  /** '프로젝트 기간'(YYYY-MM-DD) — meta 문자열 파싱 대신 구조 필드로 히어로에 표시 */
  startDate?: string | null
  endDate?: string | null
  active: WsTab
  onTab: (t: WsTab) => void
  /** 노출할 탭 부분집합 — 미지정 시 전체 10탭(수강생). 검토자는 조회 7탭만 넘긴다. */
  visibleTabs?: WsTab[]
  /** 검토자(매니저·강사) 열람 — 히어로의 팀원 초대·인증 요청 액션 미노출(2026-08-04). */
  readOnly?: boolean
  /** 팀 구성이 잠긴 상태(PM 아님·종료·상호평가 중) — 히어로 액션을 '팀 관리'로 바꾼다. */
  teamLocked?: boolean
  /** 브레드크럼 목록 링크 대체 — 미지정 시 수강생 프로젝트 목록. */
  backTo?: { label: string; onClick: () => void }
  children: ReactNode
}) {
  const navigate = useNavigate()
  const tabs = visibleTabs
    ? TABS.filter((t) => visibleTabs.includes(t.key))
    : TABS
  // 위저드와 동일 규약 — 공유 헤더엔 일반 라벨, 구체 식별은 본문 히어로가 담당(제목 중복 방지).
  usePageHeader(
    '프로젝트 워크스페이스',
    '팀·개인 프로젝트의 작업·산출물·인증을 한 곳에서 관리해요.',
  )
  // meta("팀 프로젝트 · 4명 · 기간 · PM …") 파싱 — 이브로우 태그 + 아이콘 메타 행.
  const metaParts = meta.split(' · ')
  // 기간은 구조 필드(startDate·endDate) 우선 — 실 BE meta엔 기간이 없어 문자열 파싱만으론 표시 불가.
  const metaRow = [...metaParts.slice(1)]
  if (startDate && endDate && !metaRow.some((s) => s.includes('~'))) {
    metaRow.push(`${startDate} ~ ${endDate}`)
  }
  const metaRowIcon = (seg: string): LucideIcon =>
    seg.includes('~') ? Calendar : seg.startsWith('PM') ? Flag : Send
  return (
    <div className="flex flex-col gap-5 p-8">
      {/* 빵부스러기 — 우측 '워크스페이스 활성 · N명 참여 중' 배지는 정적 멤버 수를
          실시간 참여로 오인시키고 종료·인증된 프로젝트에도 '활성'으로 떠 제거(2026-08-19). */}
      <nav className="flex min-w-0 items-center gap-1.5 text-[12px]">
        <button
          type="button"
          onClick={
            backTo ? backTo.onClick : () => navigate('/student/projects')
          }
          className="text-fg-muted hover:text-fg shrink-0"
        >
          ← {backTo ? backTo.label : '프로젝트 목록'}
        </button>
        <span className="text-fg-subtle shrink-0">/</span>
        <span className="text-fg truncate font-semibold">{title}</span>
      </nav>

      {/* 히어로 밴드 */}
      <div className="bg-brand flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-wider text-white/70">
            PROJECT WORKSPACE
            {metaParts[0] && (
              <span className="text-white/50"> · {metaParts[0]}</span>
            )}
          </span>
          <h1 className="text-[22px] font-bold text-white">{title}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/80">
            {metaRow.map((seg) => {
              const Icon = metaRowIcon(seg)
              return (
                <span key={seg} className="flex items-center gap-1">
                  <Icon className="size-3" aria-hidden="true" />
                  {seg}
                </span>
              )
            })}
          </div>
        </div>
        {!readOnly && (
          <div className="flex shrink-0 items-center gap-2">
            {/* 초대가 막힌 상태에서 '팀원 초대'라고 부르면, 눌러 간 곳에서 비활성 버튼을 만난다. */}
            <button
              type="button"
              onClick={() => onTab('settings')}
              aria-label="설정(팀 관리) 탭으로 이동"
              className="flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-white/25"
            >
              <Send className="size-3.5" aria-hidden="true" />
              {teamLocked ? '팀 관리' : '팀원 초대'}
            </button>
            <button
              type="button"
              onClick={() => onTab('certification')}
              aria-label="인증 요청 탭으로 이동"
              className="text-brand flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-[13px] font-bold transition-colors hover:bg-white/90"
            >
              <CircleCheck className="size-3.5" aria-hidden="true" />
              인증 요청
            </button>
          </div>
        )}
      </div>

      <nav className="bg-surface flex gap-1 overflow-x-auto rounded-[14px] p-1.5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
        {tabs.map((t) => {
          const on = t.key === active
          const Icon = t.icon
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTab(t.key)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-colors',
                on
                  ? 'bg-brand text-white'
                  : 'text-fg-muted hover:bg-surface-muted',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {t.label}
            </button>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
