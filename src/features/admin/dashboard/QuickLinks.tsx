import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  BookOpen,
  Check,
  ClipboardCheck,
  Coins,
  FileSpreadsheet,
  Gamepad2,
  HeartHandshake,
  Inbox,
  Link2,
  NotebookPen,
  PenSquare,
  Plus,
  Settings,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/shared/lib/cn'

// 운영 대시보드 바로가기 — 아이콘 타일 행(참고: 포털형 퀵링크). 인사이트 아래 배치.
// 구성은 매니저 개인 설정(localStorage)로 저장하고 '추가' 타일에서 편집한다.
interface QuickLinkDef {
  to: string
  label: string
  icon: LucideIcon
  tone: string // 아이콘 배지 클래스(bg+text 토큰)
}

// 추가 가능한 화면 카탈로그 — 운영 메뉴의 주요 목적지.
const CATALOG: QuickLinkDef[] = [
  { to: '/admin/students', label: '학생 관리', icon: Users, tone: 'bg-info-bg text-info' },
  { to: '/admin/education', label: '과정·기수·교과목', icon: BookOpen, tone: 'bg-success-bg text-success' },
  { to: '/admin/mentors/assignments', label: '멘토링 관리', icon: HeartHandshake, tone: 'bg-accent-bg text-accent-strong' },
  { to: '/admin/mileage', label: '마일리지', icon: Coins, tone: 'bg-warning-bg text-warning' },
  { to: '/admin/mentoring/logs', label: '멘토링 일지', icon: NotebookPen, tone: 'bg-accent-bg text-accent-strong' },
  { to: '/admin/reputation', label: '평판 관리', icon: Star, tone: 'bg-warning-bg text-warning' },
  { to: '/admin/records/review', label: '학습 기록', icon: ClipboardCheck, tone: 'bg-success-bg text-success' },
  { to: '/admin/certificates/reviews', label: '인증 검토', icon: BadgeCheck, tone: 'bg-success-bg text-success' },
  { to: '/admin/quizzes', label: '퀴즈 관리', icon: PenSquare, tone: 'bg-info-bg text-info' },
  { to: '/admin/csv-mapping', label: 'CSV 매핑', icon: FileSpreadsheet, tone: 'bg-info-bg text-info' },
  { to: '/admin/ingestion/quarantine', label: '인입 격리 큐', icon: Inbox, tone: 'bg-danger-bg text-danger' },
  { to: '/admin/integrations', label: '외부 연동', icon: Link2, tone: 'bg-info-bg text-info' },
  { to: '/admin/play/typing-texts', label: 'PLAY 관리', icon: Gamepad2, tone: 'bg-accent-bg text-accent-strong' },
  { to: '/admin/settings', label: '설정', icon: Settings, tone: 'bg-surface-muted text-fg-muted' },
]

const STORAGE_KEY = 'admin-quick-links'
const DEFAULTS = [
  '/admin/students',
  '/admin/education',
  '/admin/mentors/assignments',
  '/admin/mileage',
]

function loadLinks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULTS
    // 카탈로그에서 사라진 경로는 걸러 낡은 저장값에도 안전하게.
    const valid = parsed.filter(
      (p): p is string =>
        typeof p === 'string' && CATALOG.some((c) => c.to === p),
    )
    return valid.length > 0 ? valid : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function QuickLinks() {
  const [links, setLinks] = useState<string[]>(loadLinks)
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(links)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
  }, [links])

  const items = links
    .map((p) => CATALOG.find((c) => c.to === p))
    .filter((c): c is QuickLinkDef => !!c)

  const toggleDraft = (to: string) =>
    setDraft((d) => (d.includes(to) ? d.filter((p) => p !== to) : [...d, to]))

  return (
    <section aria-label="바로가기">
      {/* 다른 섹션(기수 비교 등)과 동일한 헤더 문법 — 타이틀 + 우측 보조 액션 */}
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-fg text-[15px] font-bold">바로가기</p>
        <button
          type="button"
          onClick={() => {
            setDraft(links)
            setEditOpen(true)
          }}
          className="text-fg-subtle hover:text-fg inline-flex items-center gap-1 text-[12px] font-medium"
          aria-label="바로가기 추가"
        >
          <Plus className="size-3.5" />
          편집
        </button>
      </div>

      {/* 옅은 배경 컨테이너 — 다크 인사이트에서 본문으로 넘어가는 시각적 브릿지 */}
      <div className="bg-surface-muted/50 flex flex-wrap items-start gap-4 rounded-2xl px-5 py-4">
        {items.map(({ to, label, icon: Icon, tone }) => (
          <Link
            key={to}
            to={to}
            className="group flex w-[4.75rem] flex-col items-center gap-2"
          >
            <span
              className={cn(
                'flex size-14 items-center justify-center rounded-[18px] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_6px_14px_rgba(18,23,38,0.12)]',
                tone,
              )}
            >
              <Icon className="size-6" />
            </span>
            <span className="text-fg text-center text-[12.5px] leading-tight font-medium break-keep">
              {label}
            </span>
          </Link>
        ))}
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="바로가기 편집"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                setLinks(draft)
                setEditOpen(false)
              }}
            >
              저장
            </Button>
          </>
        }
      >
        <p className="text-fg-muted mb-3 text-[13px]">
          대시보드에 보여줄 화면을 선택하세요. 선택 순서대로 표시됩니다.
        </p>
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {CATALOG.map(({ to, label, icon: Icon, tone }) => {
            const on = draft.includes(to)
            return (
              <li key={to}>
                <button
                  type="button"
                  onClick={() => toggleDraft(to)}
                  className={cn(
                    'hover:bg-surface-muted flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left',
                    on && 'bg-brand/5',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-[10px]',
                      tone,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-fg min-w-0 flex-1 text-[13.5px] font-medium">
                    {label}
                  </span>
                  {on && <Check className="text-brand size-4 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      </Modal>
    </section>
  )
}
