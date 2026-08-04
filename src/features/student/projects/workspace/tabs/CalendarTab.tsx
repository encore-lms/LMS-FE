import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { inputClass } from '@/components/ui/inputClass'
import { Modal } from '@/components/ui/Modal'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import {
  useAddSchedule,
  useEditSchedule,
  useDeleteSchedule,
  wsWriteError,
} from '../../../api/projects'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Tone, WorkspaceData } from '../../types'
import { Chip, SectionHead } from '../components/ws-shared'
import { card, dateStr, formatKoreanDate, pad2 } from '../components/ws-style'

const CAL_BASE = '2026-05'
const TONE_TYPE: Record<Tone, string> = {
  brand: '작업',
  info: '회의',
  warning: '발표',
  accent: '인증',
  success: '기타',
  danger: '기타',
}
// 일정 유형 선택지(객관식) + 기타(직접 입력).
const SCHEDULE_TYPES: { v: string; label: string; tone: Tone }[] = [
  { v: 'brand', label: '작업', tone: 'brand' },
  { v: 'info', label: '회의', tone: 'info' },
  { v: 'warning', label: '발표', tone: 'warning' },
  { v: 'accent', label: '인증', tone: 'accent' },
  { v: 'etc', label: '기타', tone: 'success' },
]

interface CalItem {
  /** 일정 id — 이 화면에서 만든 일정만 갖는다. 보드 작업에서 끌어온 항목은 없다(보드에서 고친다). */
  id?: string
  date: string // YYYY-MM-DD
  label: string // 일정명
  tone: Tone
  type: string // 유형명(작업/회의/…/직접 입력)
}

export function CalendarTab({
  d,
  readOnly = false,
}: {
  d: WorkspaceData
  /** 검토자(매니저·강사) 열람 — 일정 추가·수정·삭제 미노출(2026-08-04). */
  readOnly?: boolean
}) {
  const toast = useToast()
  const today = new Date()
  const todayStr = dateStr(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
  // 기본은 현재 월. ‹ › 로 이동.
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  })
  // 서버 데이터에서 곧장 파생한다. 예전에는 추가한 항목을 로컬 배열에 밀어 넣었는데,
  // 그 항목엔 서버 id 가 없어 새로고침 전까지 수정·삭제가 잠겨 있었다.
  const events: CalItem[] = useMemo(
    () => [
      ...d.calEvents.map((e) => ({
        // 서버가 실제 날짜를 준다. 예전에는 고정 월(CAL_BASE)에 일(day)만 붙여
        // 다른 달 일정이 엉뚱한 날에 붙고, 탭을 다시 열면 위치가 어긋났다.
        id: e.id,
        date: e.date ?? `${CAL_BASE}-${pad2(e.day)}`,
        label: e.label,
        tone: e.tone,
        type: TONE_TYPE[e.tone],
      })),
      // 보드 작업(시작일 기준)을 캘린더에 함께 표시.
      ...d.columns
        .flatMap((col) => col.tasks)
        .filter((t) => t.startDate)
        .map((t) => ({
          date: t.startDate as string,
          label: t.title,
          tone: 'brand' as const,
          type: '작업',
        })),
    ],
    [d.calEvents, d.columns],
  )
  // null = 닫힘, 그 외 = 해당 날짜(YYYY-MM-DD)로 일정 추가 모달 열림.
  const [addDate, setAddDate] = useState<string | null>(null)
  const addScheduleM = useAddSchedule(d.id)
  const editScheduleM = useEditSchedule(d.id)
  const deleteScheduleM = useDeleteSchedule(d.id)
  const [editing, setEditing] = useState<CalItem | null>(null)
  const [deleting, setDeleting] = useState<CalItem | null>(null)

  const offset = (new Date(cursor.y, cursor.m, 1).getDay() + 6) % 7
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const eventsOf = (day: number) =>
    events.filter((e) => e.date === dateStr(cursor.y, cursor.m, day))
  const prevMonth = () =>
    setCursor((c) =>
      c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 },
    )
  const nextMonth = () =>
    setCursor((c) =>
      c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 },
    )
  // 다가오는 일정 — 오늘 이후 일정을 날짜순으로(데모).
  const upcoming = [...events]
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  const navBtn =
    'text-fg-muted hover:bg-surface-muted hover:text-fg flex size-8 items-center justify-center rounded-lg border border-border transition-colors'

  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="캘린더"
        action={readOnly ? undefined : '일정 추가'}
        onAction={readOnly ? undefined : () => setAddDate(todayStr)}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex-1')}>
          {/* 연·월 네비게이션 */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="이전 달"
              onClick={prevMonth}
              className={navBtn}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-fg text-[15px] font-bold">
              {cursor.y}년 {cursor.m + 1}월
            </span>
            <button
              type="button"
              aria-label="다음 달"
              onClick={nextMonth}
              className={navBtn}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="text-fg-subtle grid grid-cols-7 gap-1 pb-2 text-center text-[11px] font-semibold">
            {['월', '화', '수', '목', '금', '토', '일'].map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) =>
              day === null ? (
                <div key={i} className="min-h-[78px] opacity-0" />
              ) : (
                (() => {
                  const ds = dateStr(cursor.y, cursor.m, day)
                  const isToday = ds === todayStr
                  return (
                    // 칸 안에 일정별 버튼을 두어야 해서 칸 자체는 div — 버튼 안에 버튼은 둘 수 없다.
                    <div
                      key={i}
                      {...(readOnly
                        ? {}
                        : {
                            role: 'button',
                            tabIndex: 0,
                            onClick: () => setAddDate(ds),
                            onKeyDown: (e: React.KeyboardEvent) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setAddDate(ds)
                              }
                            },
                            'aria-label': `${cursor.m + 1}월 ${day}일 일정 추가`,
                          })}
                      className={cn(
                        'flex min-h-[78px] flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors',
                        !readOnly && 'cursor-pointer',
                        isToday
                          ? 'border-brand bg-brand/5'
                          : cn(
                              'border-border',
                              !readOnly &&
                                'hover:border-brand/50 hover:bg-surface-muted/60',
                            ),
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full text-[11px]',
                          isToday
                            ? 'bg-brand font-bold text-white'
                            : 'text-fg-subtle',
                        )}
                      >
                        {day}
                      </span>
                      {/* items-start 컨테이너라 폭이 max-content로 벌어진다 —
                          w-full·min-w-0으로 일자 칸(~104px) 안에 가둬야 line-clamp가 먹는다 */}
                      {eventsOf(day).map((ev, idx) => (
                        <button
                          key={ev.id ?? idx}
                          type="button"
                          // 칸을 누르면 '추가'라, 일정 자체를 누른 것은 전파를 끊어야 한다.
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!readOnly && ev.id) setEditing(ev)
                          }}
                          disabled={readOnly || !ev.id}
                          title={
                            readOnly
                              ? ev.label
                              : ev.id
                                ? `${ev.label} 수정`
                                : '보드에서 만든 작업이에요'
                          }
                          className="hover:bg-surface-muted flex w-full min-w-0 flex-col items-start gap-0.5 rounded p-0.5 text-left disabled:cursor-default disabled:hover:bg-transparent"
                        >
                          <Chip badge={{ label: ev.type, tone: ev.tone }} />
                          <span className="text-fg-muted line-clamp-1 w-full text-[10px]">
                            {ev.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                })()
              ),
            )}
          </div>
        </section>
        <section className={cn(card, 'flex flex-col gap-3 lg:w-[280px]')}>
          <span className="text-fg text-[14px] font-bold">다가오는 일정</span>
          {upcoming.length === 0 ? (
            <span className="text-fg-subtle text-[12px]">
              예정된 일정이 없어요.
            </span>
          ) : (
            upcoming.map((u, i) => (
              <div key={i} className="flex flex-col items-start gap-1">
                <span className="text-fg-subtle text-[11px]">
                  {Number(u.date.slice(5, 7))}/{Number(u.date.slice(8, 10))}
                </span>
                <span className="text-fg text-[13px] font-semibold">
                  {u.label}
                </span>
                <Chip badge={{ label: u.type, tone: u.tone }} />
              </div>
            ))
          )}
        </section>
      </div>
      {editing && (
        <AddScheduleModal
          initialDate={editing.date}
          editing={editing}
          onClose={() => setEditing(null)}
          onDelete={() => {
            setDeleting(editing)
            setEditing(null)
          }}
          onAdd={(item) => {
            editScheduleM.mutate(
              {
                scheduleId: editing.id!,
                title: item.label,
                startsAt: item.date,
              },
              {
                onSuccess: () => {
                  setEditing(null)
                  toast.success('일정을 수정했습니다')
                },
                onError: (e) =>
                  toast.danger(wsWriteError(e, '일정 수정에 실패했어요.')),
              },
            )
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        title="일정 삭제"
        confirmLabel="삭제"
        tone="danger"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting?.id) return
          deleteScheduleM.mutate(
            { scheduleId: deleting.id },
            {
              onSuccess: () => {
                setDeleting(null)
                toast.success('일정을 삭제했습니다')
              },
              onError: (e) =>
                toast.danger(wsWriteError(e, '일정 삭제에 실패했어요.')),
            },
          )
        }}
      >
        <p className="text-fg-muted text-[13px]">
          '{deleting?.label ?? ''}' 일정을 삭제할까요? 되돌릴 수 없어요.
        </p>
      </ConfirmDialog>
      {addDate !== null && (
        <AddScheduleModal
          initialDate={addDate}
          onClose={() => setAddDate(null)}
          onAdd={(item) => {
            addScheduleM.mutate(
              { title: item.label, date: item.date },
              {
                onSuccess: () => {
                  setCursor({
                    y: Number(item.date.slice(0, 4)),
                    m: Number(item.date.slice(5, 7)) - 1,
                  })
                  setAddDate(null)
                  toast.success('일정을 추가했습니다')
                },
                onError: (e) =>
                  toast.danger(wsWriteError(e, '일정 추가에 실패했어요.')),
              },
            )
          }}
        />
      )}
    </div>
  )
}

function AddScheduleModal({
  initialDate,
  editing,
  onClose,
  onDelete,
  onAdd,
}: {
  initialDate: string
  /** 주면 수정 모드 — 기존 값으로 채워 시작한다. */
  editing?: CalItem
  onClose: () => void
  /** 수정 모드에서만 — 모달 안에서 바로 지울 수 있게. */
  onDelete?: () => void
  onAdd: (item: CalItem) => void
}) {
  const [date, setDate] = useState(initialDate)
  const [label, setLabel] = useState(editing?.label ?? '')
  const [typeKey, setTypeKey] = useState<string>(editing?.tone ?? 'brand')
  const [customType, setCustomType] = useState('')
  const field = inputClass()
  const isEtc = typeKey === 'etc'
  const picked =
    SCHEDULE_TYPES.find((t) => t.v === typeKey) ?? SCHEDULE_TYPES[0]
  const tone: Tone = picked.tone
  const typeName = isEtc ? customType.trim() || '기타' : picked.label
  const submit = () => {
    if (!label.trim() || !date) return
    onAdd({ date, label: label.trim(), tone, type: typeName })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? '일정 수정' : '일정 추가'}
      footer={
        <>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-danger hover:bg-danger-bg mr-auto rounded-lg px-3 py-1.5 text-[13px] font-semibold"
            >
              삭제
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!label.trim()}
            className={buttonClass({ size: 'sm' })}
          >
            {editing ? '저장' : '추가'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">내용</span>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="내용"
            className={field}
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">날짜</span>
          <DateTimePicker
            mode="date"
            value={date}
            onChange={setDate}
            ariaLabel="일정 날짜"
            placeholder="날짜 선택"
          />
          {date && (
            <span className="text-fg-subtle text-[11px]">
              {formatKoreanDate(date)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">이슈</span>
          <Select
            aria-label="이슈 유형"
            value={typeKey}
            onChange={setTypeKey}
            options={SCHEDULE_TYPES.map((t) => ({
              value: t.v,
              label: t.label,
            }))}
            className="h-10 w-full"
          />
        </div>
        {isEtc && (
          <input
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="유형을 직접 입력하세요"
            aria-label="유형 직접 입력"
            className={field}
          />
        )}
      </div>
    </Modal>
  )
}
