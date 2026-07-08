import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  FileText,
  FileWarning,
  Plus,
  Search,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import {
  apiErrorOf,
  useCohortStudents,
  useCreateMentorAssignmentFromStudents,
} from './api'
import type { AdminLogTemplateOption, AdminMentorLoadOption } from './types'

const FIELD_LABEL = 'text-fg-muted text-xs font-bold'
const INPUT_CLASS =
  'border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border px-3 text-sm outline-none'

interface AssignmentCreateModalProps {
  open: boolean
  onClose: () => void
  /** 상단 셀렉터로 고정된 반/기수 */
  cohortId: string
  cohortLabel: string
  /** 팀명 자동 생성용 — 이 기수의 기존 팀 수 */
  existingTeamCount: number
}

/** 진행률 색 — 신호등(초록/노랑/빨강), 차트 팔레트 토큰. */
function pctColor(pct: number | null) {
  if (pct == null) return 'var(--color-chart-neutral)'
  if (pct >= 80) return 'var(--color-chart-positive)'
  if (pct >= 50) return 'var(--color-chart-caution)'
  return 'var(--color-chart-negative)'
}

/** 기본 일지 템플릿 커스텀 드롭다운 — 모달 하단이라 포털(fixed)로 띄워 잘림 방지. */
function TemplatePicker({
  templates,
  value,
  onChange,
}: {
  templates: AdminLogTemplateOption[]
  value: string
  onChange: (templateId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const selected = templates.find((t) => t.templateId === value) ?? null

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const estHeight = 8 + Math.min(templates.length, 6) * 42
    const below = window.innerHeight - r.bottom
    const openUp = below < estHeight + 12 && r.top > below
    setPos({
      top: openUp ? r.top - estHeight - 6 : r.bottom + 6,
      left: r.left,
      width: r.width,
    })
  }, [open, templates.length])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t))
        setOpen(false)
    }
    const close = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          INPUT_CLASS,
          'flex items-center justify-between text-left',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <FileText className="text-fg-muted h-4 w-4 shrink-0" />
          {selected ? (
            <span className="text-fg truncate">
              {selected.name}
              {selected.isDefault && (
                <span className="text-fg-subtle"> (기본)</span>
              )}
            </span>
          ) : (
            <span className="text-fg-subtle">템플릿 선택</span>
          )}
        </span>
        <ChevronDown className="text-fg-subtle h-4 w-4 shrink-0" />
      </button>
      {open &&
        pos &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className="border-border fixed z-[10050] max-h-64 overflow-y-auto rounded-lg border bg-white p-1 shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
          >
            {templates.map((t) => {
              const isSel = t.templateId === value
              return (
                <li key={t.templateId}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(t.templateId)
                      setOpen(false)
                    }}
                    className={cn(
                      'hover:bg-surface-muted flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left',
                      isSel && 'bg-brand/5',
                    )}
                  >
                    <FileText className="text-fg-muted h-4 w-4 shrink-0" />
                    <span className="text-fg min-w-0 flex-1 truncate text-[13px] font-semibold">
                      {t.name}
                    </span>
                    {t.isDefault && (
                      <span className="bg-accent-bg text-accent-strong shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold">
                        기본
                      </span>
                    )}
                    {isSel && <Check className="text-brand h-4 w-4 shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body,
        )}
    </>
  )
}

/** 멘토 커스텀 드롭다운 — 이름 + 담당 개수·평균 진행률, 펼치면 담당 멘토링 목록. */
function MentorPicker({
  mentors,
  value,
  onChange,
}: {
  mentors: AdminMentorLoadOption[]
  value: string
  onChange: (mentorId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = mentors.find((m) => m.mentorId === value) ?? null

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          INPUT_CLASS,
          'flex items-center justify-between text-left',
        )}
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-fg truncate font-semibold">
              {selected.name}
            </span>
            <span className="text-fg-subtle shrink-0 text-[11px]">
              담당 {selected.activeCount}건
              {selected.avgProgress != null &&
                ` · 진행률 ${selected.avgProgress}%`}
            </span>
          </span>
        ) : (
          <span className="text-fg-subtle">멘토 선택</span>
        )}
        <ChevronDown className="text-fg-subtle h-4 w-4 shrink-0" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="border-border absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-white p-1 shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
        >
          {mentors.length === 0 && (
            <li className="text-fg-subtle px-3 py-3 text-center text-xs">
              선택 가능한 멘토가 없어요
            </li>
          )}
          {mentors.map((m) => {
            const isSel = m.mentorId === value
            return (
              <li key={m.mentorId}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(m.mentorId)
                    setOpen(false)
                  }}
                  className={cn(
                    'hover:bg-surface-muted flex w-full flex-col gap-1.5 rounded-md px-3 py-2.5 text-left',
                    isSel && 'bg-brand/5',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      {isSel && <Check className="text-brand h-3.5 w-3.5" />}
                      <span className="text-fg text-sm font-bold">
                        {m.name}
                      </span>
                    </span>
                    <span className="text-fg-subtle text-[11px] tabular-nums">
                      담당 {m.activeCount}건
                      {m.avgProgress != null && ` · 평균 ${m.avgProgress}%`}
                    </span>
                  </span>
                  {/* 담당 중인 멘토링 정보 + 진행률 */}
                  {m.mentorings.length > 0 ? (
                    <ul className="flex flex-col gap-1">
                      {m.mentorings.map((mt, i) => (
                        <li
                          key={`${mt.teamName}-${i}`}
                          className="flex items-center gap-2 text-[11px]"
                        >
                          <span className="text-fg-muted min-w-0 flex-1 truncate">
                            {mt.teamName}
                          </span>
                          <span className="bg-surface-muted h-1.5 w-16 shrink-0 overflow-hidden rounded-full">
                            <span
                              className="block h-full rounded-full"
                              style={{
                                width: `${Math.min(100, mt.progressPct ?? 0)}%`,
                                background: pctColor(mt.progressPct),
                              }}
                            />
                          </span>
                          <span
                            className="w-9 shrink-0 text-right font-bold tabular-nums"
                            style={{ color: pctColor(mt.progressPct) }}
                          >
                            {mt.progressPct == null
                              ? '-'
                              : `${mt.progressPct}%`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-fg-subtle text-[11px]">
                      담당 중인 멘토링 없음
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * 새 배정 추가 — 수강생 선택으로 새 멘토링 팀 생성 + 멘토 배정.
 * 반/기수는 상단 셀렉터 값으로 고정. 팀명은 자동 생성('{기수} 멘토링팀 N').
 * 수강생·템플릿·멘토(부하 포함)는 선택 기수 기준(cohort options)으로 로드.
 */
export function AssignmentCreateModal({
  open,
  onClose,
  cohortId,
  cohortLabel,
  existingTeamCount,
}: AssignmentCreateModalProps) {
  const toast = useToast()
  const options = useCohortStudents(cohortId)
  const createFromStudents = useCreateMentorAssignmentFromStudents()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [mentorId, setMentorId] = useState('')
  const [hours, setHours] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 기본 템플릿 자동 선택(로드 후 1회).
  const defaultTemplate = options.data?.templates.find((t) => t.isDefault)
  useEffect(() => {
    if (!templateId && defaultTemplate)
      setTemplateId(defaultTemplate.templateId)
  }, [defaultTemplate, templateId])

  const autoName = `${cohortLabel} 멘토링팀 ${existingTeamCount + 1}`
  const students = useMemo(() => options.data?.students ?? [], [options.data])
  const templates = options.data?.templates ?? []
  const mentors = options.data?.mentors ?? []
  const hasTemplates = templates.length > 0

  const filteredStudents = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return students
    return students.filter((s) => s.name.toLowerCase().includes(needle))
  }, [students, q])

  const toggle = (userId: string) =>
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    )

  const close = () => {
    setSelectedIds([])
    setMentorId('')
    setHours('')
    setTemplateId('')
    setQ('')
    setError(null)
    onClose()
  }

  const submit = () => {
    setError(null)
    if (selectedIds.length === 0)
      return setError('수강생을 1명 이상 선택해 주세요.')
    if (!mentorId) return setError('멘토를 선택해 주세요.')
    const h = Number(hours)
    if (!Number.isFinite(h) || h <= 0)
      return setError('배정 N시간은 0보다 커야 합니다.')
    if (hasTemplates && !templateId)
      return setError('일지 템플릿을 선택해 주세요.')
    createFromStudents.mutate(
      {
        cohortId,
        name: autoName,
        studentUserIds: selectedIds,
        mentorId,
        allocatedHours: h,
        logTemplateId: templateId || undefined,
      },
      {
        onSuccess: (row) => {
          toast.success(
            `배정 완료 — ${row.teamName} · ${row.mentor?.name ?? ''} · ${row.allocatedHours}h`,
          )
          close()
        },
        onError: (err) => {
          const { message } = apiErrorOf(err)
          setError(message ?? '배정에 실패했어요 — 잠시 후 다시 시도해 주세요.')
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="새 배정 추가 — 수강생 선택"
      closeOnBackdrop={false}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={close}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-sm font-bold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={createFromStudents.isPending}
            className="bg-brand-deep text-on-color hover:bg-brand-deep/90 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createFromStudents.isPending ? '저장 중…' : '배정 저장'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* 반/기수 고정 + 팀명 자동 */}
        <div className="bg-brand/10 text-brand flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium">
          <span className="font-bold">반/기수 고정</span>
          <span className="text-fg-muted">{cohortLabel}</span>
          <span className="text-fg-subtle">·</span>
          <span className="font-bold">팀명</span>
          <span className="text-fg-muted">{autoName}</span>
        </div>

        {/* 수강생 다중 선택 */}
        <div className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL}>
            수강생 선택 * ({selectedIds.length}명 선택됨)
          </label>
          <div className="relative">
            <Search className="text-fg-subtle pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="이름 검색"
              className={`${INPUT_CLASS} pl-9`}
            />
          </div>
          <div className="border-border max-h-56 overflow-y-auto rounded-lg border">
            {options.isPending ? (
              <p className="text-fg-subtle p-4 text-center text-xs">
                수강생을 불러오는 중…
              </p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-fg-subtle p-4 text-center text-xs">
                {students.length
                  ? '검색 결과가 없어요'
                  : '이 기수에 등록된 수강생이 없어요'}
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {filteredStudents.map((s) => (
                  <li key={s.userId}>
                    <label className="hover:bg-surface-muted flex cursor-pointer items-center gap-3 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.userId)}
                        onChange={() => toggle(s.userId)}
                        className="accent-brand h-4 w-4"
                      />
                      <span className="text-fg text-sm font-medium">
                        {s.name}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 멘토 — 커스텀 드롭다운(담당 개수·정보·진행률) */}
        <div className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL}>멘토 *</label>
          <MentorPicker
            mentors={mentors}
            value={mentorId}
            onChange={setMentorId}
          />
        </div>

        {/* 배정 N시간 */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="create-hours" className={FIELD_LABEL}>
            배정 N시간 *
          </label>
          <input
            id="create-hours"
            type="number"
            min={0.5}
            step={0.5}
            placeholder="예: 10"
            className={INPUT_CLASS}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>

        {/* 기본 일지 템플릿 */}
        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>
            기본 일지 템플릿{hasTemplates ? ' *' : ''}
          </span>
          {!options.isPending && !hasTemplates ? (
            <div className="border-border bg-surface-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-3">
              <span className="text-fg-subtle inline-flex items-center gap-1.5 text-xs">
                <FileWarning className="h-4 w-4" />
                활성 템플릿 없음 · 일지 항목 없이 배정
              </span>
              <Link
                to="/admin/mentoring/log-templates"
                className="bg-brand-deep text-on-color hover:bg-brand-deep/90 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-bold"
              >
                <Plus className="h-3.5 w-3.5" />
                템플릿 관리
              </Link>
            </div>
          ) : (
            <TemplatePicker
              templates={templates}
              value={templateId}
              onChange={setTemplateId}
            />
          )}
        </div>

        {error && <p className="text-danger text-xs">{error}</p>}
      </div>
    </Modal>
  )
}
