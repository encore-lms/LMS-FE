import { useEffect, useRef, useState, type ReactNode } from 'react'
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
import { formatDateDot } from '@/shared/lib/date'
import { useCourseHubHeader } from '../course/useCourseHubHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/use-toast'
import { useDeleteResume, useResumes } from '../api/resume'
import { SECTIONS, completionOf } from './constants'
import type { ResumeSummary } from './types'
import { CourseTabs } from '../course/CourseTabs'

// 상태 필터 옵션 — '전체' + ResumeStatus. 필터 버튼 팝오버에서 선택.
const STATUS_FILTERS = ['전체', '작성 중', '작성 완료'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

// ISO 날짜 → 'YYYY.MM.DD' 표시용. 파싱 실패 시 원문 그대로(기존 동작 유지).
function formatDate(iso: string) {
  return formatDateDot(iso) || iso
}

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
    <div className="bg-surface flex items-center gap-4 rounded-xl p-5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
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
  onDelete,
}: {
  resume: ResumeSummary
  onOpen: () => void
  onDelete: () => void
}) {
  const done = new Set(resume.doneSections)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="bg-surface flex flex-col gap-3.5 rounded-xl p-5 text-left shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)] transition-shadow hover:shadow-[0px_6px_20px_0px_rgba(18,23,38,0.12)]"
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
            icon={resume.status === '작성 완료' ? <CheckCircle2 /> : <Clock />}
          />
          <span
            role="button"
            tabIndex={-1}
            aria-label="삭제"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
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
        {formatDate(resume.updatedAt)}
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
              최종 수정 {formatDate(resume.updatedAt)}
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
 * 목록·생성·삭제는 mock API(useResumes/useCreateResume/useDeleteResume)로 처리.
 * 카드 클릭 → 섹션 현황 드로어 → 편집. 휴지통 → 삭제 확인 모달.
 */
export default function ResumePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useResumes()
  const deleteResume = useDeleteResume()
  const [selected, setSelected] = useState<ResumeSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ResumeSummary | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('전체')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  useCourseHubHeader()

  // 필터 팝오버 — 바깥 클릭 시 닫기.
  useEffect(() => {
    if (!filterOpen) return
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [filterOpen])

  const resumes = data?.resumes ?? []
  const kpis = {
    total: resumes.length,
    done: resumes.filter((r) => r.status === '작성 완료').length,
    writing: resumes.filter((r) => r.status === '작성 중').length,
    feedback: data?.feedbackCount ?? 0,
  }
  // KPI는 전체 기준, 목록만 상태 필터 적용.
  const visibleResumes =
    statusFilter === '전체'
      ? resumes
      : resumes.filter((r) => r.status === statusFilter)

  // 작성 버튼은 편집기로 보내기만 한다(이 시점엔 생성 X). 편집기에서 제출해야 목록에 생긴다.
  const handleCreate = () => navigate('/student/resume/new')

  const confirmDelete = () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    deleteResume.mutate(id, {
      onSuccess: () => {
        toast.success('이력서를 삭제했어요')
        setDeleteTarget(null)
        if (selected?.id === id) setSelected(null)
      },
    })
  }

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      loadingText="이력서를 불러오는 중…"
      errorTitle="이력서를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      <div className="flex flex-col gap-5 p-8">
        <CourseTabs />
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
            onClick={handleCreate}
            className="bg-accent-strong inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[14px] font-bold text-white"
          >
            <Plus className="h-4 w-4" />새 이력서 작성
          </button>
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              aria-label="상태 필터"
              aria-haspopup="menu"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((v) => !v)}
              className={cn(
                'relative flex size-10 items-center justify-center rounded-lg border transition-colors',
                statusFilter !== '전체'
                  ? 'border-accent-strong text-accent-strong bg-accent-bg'
                  : 'border-border text-fg-muted hover:bg-surface-muted',
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {statusFilter !== '전체' && (
                <span className="bg-accent-strong absolute -top-1 -right-1 size-2 rounded-full" />
              )}
            </button>
            {filterOpen && (
              <div className="border-border absolute right-0 z-30 mt-1 w-40 rounded-lg border bg-white p-1 shadow-[0px_8px_24px_0px_rgba(18,23,38,0.12)]">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setStatusFilter(f)
                      setFilterOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-[13px]',
                      f === statusFilter
                        ? 'bg-accent-bg text-accent-strong font-semibold'
                        : 'text-fg-muted hover:bg-surface-muted',
                    )}
                  >
                    {f}
                    {f === statusFilter && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {resumes.length === 0 ? (
            <div className="border-border text-fg-muted rounded-xl border border-dashed p-10 text-center text-[14px]">
              아직 작성한 이력서가 없어요. “새 이력서 작성”으로 시작하세요.
            </div>
          ) : visibleResumes.length === 0 ? (
            <div className="border-border text-fg-muted rounded-xl border border-dashed p-10 text-center text-[14px]">
              ‘{statusFilter}’ 상태의 이력서가 없어요.
            </div>
          ) : (
            visibleResumes.map((r) => (
              <ResumeCard
                key={r.id}
                resume={r}
                onOpen={() => setSelected(r)}
                onDelete={() => setDeleteTarget(r)}
              />
            ))
          )}
        </div>

        {selected && (
          <ResumeDrawer
            resume={selected}
            onClose={() => setSelected(null)}
            onEdit={() => navigate(`/student/resume/${selected.id}/edit`)}
          />
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="이력서를 삭제할까요?"
          size="sm"
          confirmLabel="삭제"
          tone="danger"
          confirmDisabled={deleteResume.isPending}
        >
          <p className="text-fg-muted text-[13px] leading-6">
            <span className="text-fg font-semibold">{deleteTarget?.title}</span>{' '}
            이력서를 삭제하면 되돌릴 수 없습니다.
          </p>
        </ConfirmDialog>
      </div>
    </DataBoundary>
  )
}
