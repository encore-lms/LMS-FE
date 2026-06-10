import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  MessageSquare,
  Pencil,
  Plus,
  SlidersHorizontal,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  FEEDBACK_COUNT,
  RESUMES,
  SECTIONS,
  completionOf,
  type ResumeSummary,
} from './mocks'

/** KPI 타일 — 아이콘 + 값 + 라벨. */
function StatCard({
  icon,
  iconClass,
  value,
  label,
}: {
  icon: ReactNode
  iconClass: string
  value: ReactNode
  label: string
}) {
  return (
    <div className="border-border bg-surface flex items-center gap-4 rounded-xl border p-5">
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5',
          iconClass,
        )}
      >
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="text-fg text-2xl font-bold">{value}</span>
        <span className="text-fg-muted text-[13px]">{label}</span>
      </div>
    </div>
  )
}

function ResumeCard({
  resume,
  onOpen,
}: {
  resume: ResumeSummary
  onOpen: () => void
}) {
  const done = new Set(resume.doneSections)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="border-border bg-surface hover:border-accent/50 flex flex-col gap-3.5 rounded-xl border p-5 text-left transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="text-fg-subtle h-[18px] w-[18px]" />
          <span className="text-fg text-[15px] font-bold">{resume.title}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusBadge
            label={resume.status}
            tone={resume.status === '작성 완료' ? 'success' : 'warning'}
          />
          <span
            role="button"
            tabIndex={-1}
            aria-label="삭제"
            onClick={(e) => e.stopPropagation()}
            className="text-fg-subtle hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-fg-muted text-[12px]">섹션 완료</span>
        <span className="text-fg-muted text-[12px] font-semibold tabular-nums">
          {resume.doneSections.length}/{SECTIONS.length}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {SECTIONS.map((s) => (
          <span
            key={s}
            className={cn(
              'h-[5px] flex-1 rounded-full',
              done.has(s) ? 'bg-accent-strong' : 'bg-divider',
            )}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => {
          const on = done.has(s)
          return (
            <span
              key={s}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px]',
                on
                  ? 'bg-accent-bg text-accent-strong font-semibold'
                  : 'bg-surface-muted text-fg-muted',
              )}
            >
              {on && <Check className="h-3 w-3" />}
              {s}
            </span>
          )
        })}
      </div>

      <div className="text-fg-subtle flex items-center gap-1.5 text-[12px]">
        <Clock className="h-3.5 w-3.5" />
        {resume.updatedAt}
      </div>
    </button>
  )
}

/** 우측 슬라이드 드로어 — 섹션별 작성 현황 + 편집 진입. */
function ResumeDrawer({
  resume,
  onClose,
  onEdit,
}: {
  resume: ResumeSummary
  onClose: () => void
  onEdit: () => void
}) {
  const done = new Set(resume.doneSections)
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed top-0 right-0 z-50 flex h-screen w-[420px] max-w-full flex-col bg-white shadow-[-12px_0_32px_0_rgba(18,23,38,0.16)]">
        <header className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
          <div className="flex flex-col gap-1">
            <span className="text-fg text-[17px] font-bold">
              {resume.title}
            </span>
            <span className="text-fg-subtle text-[12px]">
              최종 수정 {resume.updatedAt}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-fg-subtle hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="flex flex-col gap-2.5 pb-5">
            <div className="flex items-center justify-between">
              <span className="text-fg text-[13px] font-bold">전체 완료율</span>
              <span className="text-accent-strong text-[15px] font-bold">
                {completionOf(resume)}%
              </span>
            </div>
            <span className="bg-divider relative h-2 overflow-hidden rounded-full">
              <span
                className="bg-accent-strong absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${completionOf(resume)}%` }}
              />
            </span>
          </div>

          <span className="text-fg text-[13px] font-bold">
            섹션별 작성 현황
          </span>
          <div className="flex flex-col">
            {SECTIONS.map((s) => {
              const on = done.has(s)
              return (
                <div
                  key={s}
                  className="border-divider flex items-center justify-between border-b py-3"
                >
                  <span className="flex items-center gap-2">
                    {on ? (
                      <CheckCircle2 className="text-success h-4 w-4" />
                    ) : (
                      <Circle className="text-fg-subtle h-4 w-4" />
                    )}
                    <span
                      className={cn(
                        'text-[13.5px] font-semibold',
                        on ? 'text-fg' : 'text-fg-muted',
                      )}
                    >
                      {s}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'text-[12px] font-bold',
                      on ? 'text-success' : 'text-fg-subtle',
                    )}
                  >
                    {on ? '작성 완료' : '미작성'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-6 pt-3.5 pb-6">
          <button
            type="button"
            onClick={onEdit}
            className="bg-accent-strong inline-flex w-full items-center justify-center gap-2 rounded-[10px] py-3.5 text-[14px] font-bold text-white"
          >
            <Pencil className="h-4 w-4" />
            이력서 편집하기
          </button>
        </div>
      </aside>
    </>
  )
}

/**
 * 이력서 관리 (/student/resume) — 내 이력서 작성 현황과 피드백 관리.
 * KPI 4종 + 새 이력서 작성 + 이력서 목록(섹션 진행률·칩). 카드 클릭 → 섹션 현황 드로어 → 편집.
 */
export default function ResumePage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<ResumeSummary | null>(null)

  const kpis = useMemo(
    () => ({
      total: RESUMES.length,
      done: RESUMES.filter((r) => r.status === '작성 완료').length,
      writing: RESUMES.filter((r) => r.status === '작성 중').length,
      feedback: FEEDBACK_COUNT,
    }),
    [],
  )

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-[22px] font-bold">이력서 관리</h1>
        <p className="text-fg-muted text-[12px]">
          이력서 작성 현황과 피드백을 관리합니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<FileText />}
          iconClass="bg-surface-muted text-fg-muted"
          value={kpis.total}
          label="전체 이력서"
        />
        <StatCard
          icon={<CheckCircle2 />}
          iconClass="bg-success-bg text-success"
          value={kpis.done}
          label="작성 완료"
        />
        <StatCard
          icon={<SquarePen />}
          iconClass="bg-warning-bg text-warning"
          value={kpis.writing}
          label="작성 중"
        />
        <StatCard
          icon={<MessageSquare />}
          iconClass="bg-accent-bg text-accent-strong"
          value={kpis.feedback}
          label="누적 피드백"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/student/resume/new')}
          className="bg-accent-strong inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[14px] font-bold text-white"
        >
          <Plus className="h-4 w-4" />새 이력서 작성
        </button>
        <button
          type="button"
          aria-label="필터"
          className="border-border text-fg-muted hover:bg-surface-muted flex size-10 items-center justify-center rounded-lg border"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {RESUMES.map((r) => (
          <ResumeCard key={r.id} resume={r} onOpen={() => setSelected(r)} />
        ))}
      </div>

      {selected && (
        <ResumeDrawer
          resume={selected}
          onClose={() => setSelected(null)}
          onEdit={() => navigate(`/student/resume/${selected.id}/edit`)}
        />
      )}
    </div>
  )
}
