import { useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useProjectWorkspace } from '../../api/projects'
import type {
  Badge,
  Tone,
  WorkspaceData,
  WsColumn,
  WsTab,
  WsTask,
} from '../types'
import { WorkspaceShell } from './WorkspaceShell'

// 담당자 이름 → 결정론적 아바타 색(타입에 avatarTone이 없어 이름 해시로 매핑)
const TONES: Tone[] = [
  'brand',
  'info',
  'warning',
  'danger',
  'accent',
  'success',
]
function toneOf(name: string): Tone {
  let h = 0
  for (let i = 0; i < name.length; i++)
    h = (h + name.charCodeAt(i)) % TONES.length
  return TONES[h]
}

const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
const SOLID: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const TABS: WsTab[] = [
  'home',
  'board',
  'calendar',
  'meetings',
  'docs',
  'issues',
  'team',
  'outcomes',
  'peer-evaluation',
  'certification',
]

// 프로젝트 워크스페이스 (/student/projects/:projectId ?tab=) — Figma 342:1032 외 9탭.
export default function WorkspacePage() {
  const { projectId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: WsTab = (TABS as string[]).includes(raw ?? '')
    ? (raw as WsTab)
    : 'home'
  const { data, isPending, isError, refetch } = useProjectWorkspace(projectId)

  if (isPending)
    return <div className="text-fg-muted p-8">워크스페이스를 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="워크스페이스를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const setTab = (t: WsTab) =>
    setParams(t === 'home' ? {} : { tab: t }, { replace: true })

  return (
    <WorkspaceShell
      title={data.title}
      meta={data.meta}
      active={tab}
      onTab={setTab}
    >
      {tab === 'home' && <HomeTab d={data} />}
      {tab === 'board' && <BoardTab d={data} />}
      {tab === 'calendar' && <CalendarTab d={data} />}
      {tab === 'meetings' && <MeetingsTab d={data} />}
      {tab === 'docs' && <DocsTab d={data} />}
      {tab === 'issues' && <IssuesTab d={data} />}
      {tab === 'team' && <TeamTab d={data} />}
      {tab === 'outcomes' && <OutcomesTab d={data} />}
      {tab === 'peer-evaluation' && <PeerTab d={data} />}
      {tab === 'certification' && <CertTab d={data} />}
    </WorkspaceShell>
  )
}

/* 공용 소품 */
function Chip({ badge }: { badge: Badge }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-bold',
        CHIP[badge.tone],
      )}
    >
      {badge.label}
    </span>
  )
}
function SectionHead({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-fg text-[16px] font-bold">{title}</h2>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="bg-brand rounded-lg px-4 py-2 text-[12px] font-bold text-white"
        >
          {action}
        </button>
      )}
    </div>
  )
}
function Avatar({ name, tone }: { name: string; tone: Tone }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white',
        SOLID[tone],
      )}
    >
      {name.slice(0, 1)}
    </span>
  )
}
function TaskCard({ t }: { t: WsTask }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-2 rounded-[12px] border p-3.5">
      <span className="text-fg text-[13px] font-bold">{t.title}</span>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
            SOLID[toneOf(t.assignee)],
          )}
        >
          {t.assignee.slice(0, 1)}
        </span>
        <span className="text-fg-subtle text-[11px]">
          {t.assignee} · {t.due}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {t.tags.map((tg, i) => (
          <Chip key={i} badge={tg} />
        ))}
      </div>
    </div>
  )
}

/* ── 홈 ── */
function HomeTab({ d }: { d: WorkspaceData }) {
  return (
    <div className="flex flex-col gap-4">
      {d.banner && (
        <div className="bg-info-bg/60 text-fg-muted rounded-xl px-4 py-3 text-[12px]">
          ⓘ {d.banner}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {d.stats.map((s) => (
          <div key={s.label} className={cn(card, 'flex flex-col gap-2')}>
            <span className="text-fg-muted text-[12px]">{s.label}</span>
            <span className="text-fg text-[26px] leading-none font-bold">
              {s.value}
              {s.unit && (
                <span className="text-fg-muted ml-0.5 text-[13px]">
                  {s.unit}
                </span>
              )}
            </span>
            <span className="text-fg-subtle text-[11px]">{s.sub}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <section className={cn(card, 'flex flex-col gap-3')}>
            <SectionHead title="내 할 일" />
            {d.myTasks.map((t, i) => (
              <div
                key={i}
                className="border-border flex items-center gap-3 rounded-[10px] border p-3"
              >
                <span className="text-fg flex-1 text-[13px] font-semibold">
                  {t.title}
                </span>
                <span className="text-fg-subtle text-[11px]">{t.due}</span>
                {t.tags.slice(0, 2).map((tg, j) => (
                  <Chip key={j} badge={tg} />
                ))}
              </div>
            ))}
          </section>
          <section className={cn(card, 'flex flex-col gap-3')}>
            <SectionHead title="최근 활동" />
            {d.activities.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Avatar name={a.who} tone="info" />
                <span className="text-fg-muted flex-1 text-[12px]">
                  <b className="text-fg">{a.who}</b> {a.action}
                </span>
                <span className="text-fg-subtle text-[11px]">{a.when}</span>
              </div>
            ))}
          </section>
        </div>
        <div className="flex flex-col gap-4 lg:w-[360px]">
          <section className={cn(card, 'flex flex-col gap-2')}>
            <span className="text-fg text-[14px] font-bold">팀 구성</span>
            {d.members.map((m) => (
              <div key={m.name} className="flex items-center gap-2.5">
                <Avatar name={m.name} tone={m.avatarTone} />
                <div className="flex flex-1 flex-col">
                  <span className="text-fg text-[12px] font-bold">
                    {m.name}
                  </span>
                  <span className="text-fg-subtle text-[11px]">{m.role}</span>
                </div>
                <span className="text-fg-muted text-[11px] font-bold">
                  {m.contrib}%
                </span>
              </div>
            ))}
          </section>
          <section className={cn(card, 'flex flex-col gap-2.5')}>
            <span className="text-fg text-[14px] font-bold">성과 요약</span>
            {d.metrics.map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between text-[12px]"
              >
                <span className="text-fg-muted">{m.label}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-fg font-bold">{m.after}</span>
                  <span className="bg-success-bg text-success rounded px-1 py-0.5 text-[10px] font-bold">
                    {m.delta}
                  </span>
                </span>
              </div>
            ))}
          </section>
          <section className={cn(card, 'flex flex-col gap-2')}>
            <span className="text-fg text-[14px] font-bold">기술 스택</span>
            <div className="flex flex-wrap gap-1.5">
              {d.stack.map((s) => (
                <span
                  key={s}
                  className="bg-surface-muted text-fg-muted rounded-md px-2 py-0.5 text-[11px] font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/* ── 보드 ── */
function BoardTab({ d }: { d: WorkspaceData }) {
  const [columns, setColumns] = useState(d.columns)
  const [addCol, setAddCol] = useState<number | null>(null)
  const drag = useRef<{ col: number; task: number } | null>(null)

  const drop = (toCol: number) => {
    const from = drag.current
    drag.current = null
    if (!from || from.col === toCol) return
    setColumns((cols) => {
      const next = cols.map((c) => ({ ...c, tasks: [...c.tasks] }))
      const [moved] = next[from.col].tasks.splice(from.task, 1)
      if (moved) next[toCol].tasks.push(moved)
      return next
    })
  }
  const addTask = (colIdx: number, task: WsTask) =>
    setColumns((cols) =>
      cols.map((c, i) =>
        i === colIdx ? { ...c, tasks: [...c.tasks, task] } : c,
      ),
    )

  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="보드"
        action="작업 추가"
        onAction={() => setAddCol(0)}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {columns.map((col, ci) => (
          <section
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(ci)}
            className={cn(card, 'flex flex-col gap-3')}
          >
            <div className="flex items-center justify-between">
              <span className="text-fg text-[14px] font-bold">
                {col.label}{' '}
                <span className="text-fg-subtle text-[12px]">
                  {col.tasks.length}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setAddCol(ci)}
                className="text-fg-muted hover:bg-surface-muted rounded-md px-2 py-1 text-[12px] font-semibold"
              >
                + 작업
              </button>
            </div>
            {col.tasks.map((t, ti) => (
              <div
                key={ti}
                draggable
                onDragStart={() => {
                  drag.current = { col: ci, task: ti }
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                <TaskCard t={t} />
              </div>
            ))}
            {col.tasks.length === 0 && (
              <div className="border-border text-fg-subtle rounded-[12px] border border-dashed py-6 text-center text-[11px]">
                여기로 드래그
              </div>
            )}
          </section>
        ))}
      </div>
      {addCol !== null && (
        <AddTaskModal
          columns={columns}
          initialCol={addCol}
          onClose={() => setAddCol(null)}
          onAdd={(colIdx, task) => {
            addTask(colIdx, task)
            setAddCol(null)
          }}
        />
      )}
    </div>
  )
}

/* ── 작업 추가 모달 ── */
function AddTaskModal({
  columns,
  initialCol,
  onClose,
  onAdd,
}: {
  columns: WsColumn[]
  initialCol: number
  onClose: () => void
  onAdd: (colIdx: number, task: WsTask) => void
}) {
  const [colIdx, setColIdx] = useState(initialCol)
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [due, setDue] = useState('')
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'

  const submit = () => {
    if (!title.trim()) return
    onAdd(colIdx, {
      title: title.trim(),
      assignee: assignee.trim() || '미지정',
      due: due.trim() || '-',
      tags: [],
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-[420px] flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-fg text-[16px] font-bold">작업 추가</h3>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">컬럼</span>
          <select
            value={colIdx}
            onChange={(e) => setColIdx(Number(e.target.value))}
            className={field}
          >
            {columns.map((c, i) => (
              <option key={c.key} value={i}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">제목</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="작업 제목"
            className={field}
          />
        </label>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-fg text-[12px] font-bold">담당자</span>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="이름"
              className={field}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-fg text-[12px] font-bold">마감</span>
            <input
              value={due}
              onChange={(e) => setDue(e.target.value)}
              placeholder="D-3"
              className={field}
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim()}
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 캘린더 ── */
function CalendarTab({ d }: { d: WorkspaceData }) {
  const offset = (new Date('2026-05-01').getDay() + 6) % 7
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: 31 }, (_, i) => i + 1),
  ]
  const eventOf = (day: number) => d.calEvents.find((e) => e.day === day)
  return (
    <div className="flex flex-col gap-4">
      <SectionHead title={d.calMonth} action="일정 추가" />
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex-1')}>
          <div className="text-fg-subtle grid grid-cols-7 gap-1 pb-2 text-center text-[11px] font-semibold">
            {['월', '화', '수', '목', '금', '토', '일'].map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              const ev = day ? eventOf(day) : undefined
              return (
                <div
                  key={i}
                  className={cn(
                    'border-border flex min-h-[78px] flex-col items-start gap-1 rounded-lg border p-1.5',
                    !day && 'opacity-0',
                  )}
                >
                  <span className="text-fg-subtle text-[11px]">{day}</span>
                  {ev && <Chip badge={{ label: ev.label, tone: ev.tone }} />}
                </div>
              )
            })}
          </div>
        </section>
        <section className={cn(card, 'flex flex-col gap-3 lg:w-[280px]')}>
          <span className="text-fg text-[14px] font-bold">다가오는 일정</span>
          {d.upcoming.map((u, i) => (
            <div key={i} className="flex flex-col items-start gap-1">
              <span className="text-fg-subtle text-[11px]">{u.date}</span>
              <span className="text-fg text-[13px] font-semibold">
                {u.label}
              </span>
              <Chip badge={{ label: '일정', tone: u.tone }} />
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

/* ── 회의록 ── */
function MeetingsTab({ d }: { d: WorkspaceData }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHead title="회의록" action="회의록 작성" />
      <section className={cn(card, 'flex flex-col')}>
        {d.meetings.map((m, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-4 py-3.5',
              i > 0 && 'border-divider border-t',
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-fg text-[14px] font-bold">{m.title}</span>
              <span className="text-fg-subtle text-[11px]">{m.meta}</span>
            </div>
            <span className="text-fg-muted hidden text-[12px] sm:block">
              {m.summary}
            </span>
            <Chip badge={m.status} />
          </div>
        ))}
      </section>
    </div>
  )
}

/* ── 문서·파일·위키 ── */
function DocsTab({ d }: { d: WorkspaceData }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHead title="문서·파일·위키" action="문서 추가" />
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-col gap-1.5 lg:w-[180px]')}>
          {d.docCategories.map((c, i) => (
            <span
              key={c}
              className={cn(
                'rounded-lg px-3 py-2 text-[12px] font-semibold',
                i === 0
                  ? 'bg-brand/10 text-brand'
                  : 'text-fg-muted hover:bg-surface-muted',
              )}
            >
              {c}
            </span>
          ))}
        </section>
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {d.docs.map((doc, i) => (
            <div key={i} className={cn(card, 'flex flex-col gap-2')}>
              <span className="text-fg text-[14px] font-bold">{doc.title}</span>
              <span className="text-fg-subtle text-[11px]">{doc.meta}</span>
              <div className="mt-auto flex items-center justify-between pt-1">
                <Chip badge={doc.status} />
                <button
                  type="button"
                  className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
                >
                  열기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── 이슈 ── */
function IssuesTab({ d }: { d: WorkspaceData }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHead title="이슈" action="이슈 등록" />
      <section className={cn(card, 'flex flex-col')}>
        {d.issues.map((it, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-3 py-3.5',
              i > 0 && 'border-divider border-t',
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-fg text-[14px] font-bold">{it.title}</span>
              <span className="text-fg-subtle text-[11px]">{it.meta}</span>
            </div>
            <Chip badge={it.priority} />
            <Chip badge={it.status} />
            <span className="border-border text-fg-muted shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-semibold">
              상세
            </span>
          </div>
        ))}
      </section>
    </div>
  )
}

/* ── 팀 관리 ── */
function TeamTab({ d }: { d: WorkspaceData }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHead title="팀원 관리" action="팀원 초대" />
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col py-2')}>
          {d.members.map((m, i) => (
            <div
              key={m.name}
              className={cn(
                'flex items-center gap-4 py-5',
                i > 0 && 'border-divider border-t',
              )}
            >
              <Avatar name={m.name} tone={m.avatarTone} />
              <div className="flex w-40 flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-fg text-[13px] font-bold">
                    {m.name}
                  </span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-bold',
                      m.kind === 'PM'
                        ? 'bg-accent-bg text-accent-strong'
                        : 'bg-surface-muted text-fg-muted',
                    )}
                  >
                    {m.kind}
                  </span>
                </div>
                <span className="text-fg-subtle text-[11px]">
                  기여도 {m.contrib}%
                </span>
                <span className="text-fg-subtle text-[11px]">{m.role}</span>
              </div>
              <div className="bg-surface-muted h-2 flex-1 overflow-hidden rounded-full">
                <div
                  className="bg-brand h-full rounded-full"
                  style={{ width: `${m.contrib}%` }}
                />
              </div>
              <button
                type="button"
                className="border-border text-fg-muted shrink-0 rounded-lg border px-3.5 py-1.5 text-[12px] font-semibold"
              >
                상세
              </button>
            </div>
          ))}
        </section>
        <section className={cn(card, 'flex flex-col gap-4 lg:w-[300px]')}>
          <span className="text-fg text-[14px] font-bold">역할 정책</span>
          {d.rolePolicy.map((r, i) => (
            <span key={i} className="text-fg-muted text-[12px] leading-5">
              {i + 1}. {r}
            </span>
          ))}
        </section>
      </div>
    </div>
  )
}

/* ── 성과·기술스택 ── */
function OutcomesTab({ d }: { d: WorkspaceData }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHead title="성과 지표" action="지표 추가" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {d.metrics.map((m) => (
          <section key={m.label} className={cn(card, 'flex flex-col gap-3')}>
            <span className="text-fg text-[14px] font-bold">{m.label}</span>
            <div className="flex items-end gap-6">
              <div className="flex flex-col">
                <span className="text-fg-subtle text-[11px]">Before</span>
                <span className="text-fg-muted text-[20px] font-bold">
                  {m.before}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-fg-subtle text-[11px]">After</span>
                <span className="text-brand text-[20px] font-bold">
                  {m.after}
                </span>
              </div>
            </div>
            <span
              className={cn(
                'w-fit rounded px-1.5 py-0.5 text-[11px] font-bold',
                m.good
                  ? 'bg-success-bg text-success'
                  : 'bg-danger-bg text-danger',
              )}
            >
              {m.delta}
            </span>
          </section>
        ))}
      </div>
      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[14px] font-bold">기술 스택</span>
        <div className="flex flex-wrap gap-2">
          {d.stack.map((s) => (
            <span
              key={s}
              className="bg-surface-muted text-fg-muted rounded-lg px-3 py-1.5 text-[12px] font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ── 상호평가 ── */
function PeerTab({ d }: { d: WorkspaceData }) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-fg text-[16px] font-bold">프로젝트 상호평가</h2>
        <span className="text-fg-subtle text-[12px]">
          완료된 프로젝트의 팀원을 평가합니다. 평가 정보와 코멘트는 팀원에게
          공개되지 않습니다.
        </span>
      </div>
      <section className={cn(card, 'flex items-center justify-between gap-4')}>
        <div className="flex flex-col gap-1">
          <span className="text-fg text-[14px] font-bold">
            필수 제출 · 마감 {d.peerDue}
          </span>
          <span className="text-fg-muted text-[12px]">
            PM 포함 모든 멤버가 자기 자신을 제외한 팀원을 평가합니다. 마감
            전까지 수정 가능하며, 최종본이 증명서에 반영됩니다.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Chip badge={d.peerMyStatus} />
          <Chip badge={d.peerTeamStatus} />
        </div>
      </section>
      {d.peerTargets.map((t) => (
        <section key={t.name} className={cn(card, 'flex flex-col gap-3')}>
          <div className="flex items-center gap-2">
            <span className="text-fg text-[14px] font-bold">{t.name}</span>
            <span className="text-fg-subtle text-[11px]">{t.role}</span>
            <span className="text-fg-subtle ml-auto text-[11px]">
              5개 축은 모두 필수, 코멘트는 선택입니다.
            </span>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {t.axes.map((a) => (
              <div key={a.key} className="flex items-center gap-2">
                <span className="text-fg w-16 shrink-0 text-[12px] font-medium">
                  {a.key}
                </span>
                <div className="bg-surface-muted h-2 flex-1 overflow-hidden rounded-full">
                  <div
                    className="bg-brand h-full rounded-full"
                    style={{ width: `${(a.score / 5) * 100}%` }}
                  />
                </div>
                <span className="text-fg w-7 shrink-0 text-right text-[12px] font-bold">
                  {a.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-fg-subtle text-[11px]">카테고리 태그</span>
              {t.tags.map((tg, i) => (
                <Chip key={i} badge={tg} />
              ))}
            </div>
            <span className="border-border text-fg-subtle flex-1 rounded-lg border px-3 py-2 text-[11px]">
              선택 코멘트: 프로젝트에서 드러난 협업/기여 근거를 적어주세요.
            </span>
          </div>
        </section>
      ))}
      <div className="border-border flex items-center justify-between border-t pt-4">
        <span className="text-fg-subtle text-[11px]">
          제출 후에도 마감 전까지 수정할 수 있습니다. 미제출 시 본인 증명서의
          프로젝트 협업 근거가 제한됩니다.
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="border-border text-fg rounded-lg border px-4 py-2.5 text-[13px] font-semibold"
          >
            임시 저장
          </button>
          <button
            type="button"
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold text-white"
          >
            제출
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 인증 요청 ── */
function CertTab({ d }: { d: WorkspaceData }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-fg text-[16px] font-bold">프로젝트 인증 요청</h2>
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-1')}>
          <span className="text-fg pb-2 text-[14px] font-bold">
            요청 전 체크리스트
          </span>
          {d.certChecklist.map((c, i) => {
            const done = c.status.tone === 'success'
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 py-3',
                  i > 0 && 'border-divider border-t',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                    done
                      ? 'bg-success text-white'
                      : 'border-border text-fg-subtle border',
                  )}
                >
                  {done ? '✓' : ''}
                </span>
                <span className="text-fg flex-1 text-[13px] font-semibold">
                  {c.label}
                </span>
                <Chip badge={c.status} />
              </div>
            )
          })}
        </section>
        <div className="flex flex-col gap-4 lg:w-[320px]">
          <section className={cn(card, 'flex flex-col gap-3')}>
            <div className="flex items-center justify-between">
              <span className="text-fg text-[14px] font-bold">인증 상태</span>
              <Chip badge={d.certStatus} />
            </div>
            <span className="text-fg-muted text-[12px] leading-5">
              요청하면 담당 강사가 산출물과 발표 내용을 검토합니다. 인증 완료 후
              프로젝트는 증명서 대표 후보가 됩니다.
            </span>
            <button
              type="button"
              className="bg-brand rounded-lg py-3 text-[13px] font-bold text-white"
            >
              인증 요청 제출
            </button>
            <button
              type="button"
              className="border-border text-fg rounded-lg border py-2.5 text-[13px] font-semibold"
            >
              변경 제안 보기
            </button>
          </section>
          <section className={cn(card, 'flex flex-col gap-2')}>
            <span className="text-fg text-[14px] font-bold">
              최근 변경 제안
            </span>
            <div className="flex items-center justify-between">
              <span className="text-fg text-[13px] font-semibold">
                {d.certRecentChange.label}
              </span>
              <Chip badge={d.certRecentChange.status} />
            </div>
            <span className="text-fg-subtle text-[11px]">
              {d.certRecentChange.date}
            </span>
          </section>
        </div>
      </div>
    </div>
  )
}
