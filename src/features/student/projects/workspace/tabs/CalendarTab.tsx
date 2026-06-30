import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/components/ui/Modal'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
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
  date: string // YYYY-MM-DD
  label: string // 일정명
  tone: Tone
  type: string // 유형명(작업/회의/…/직접 입력)
}

export function CalendarTab({ d }: { d: WorkspaceData }) {
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
  const [events, setEvents] = useState<CalItem[]>(() => [
    ...d.calEvents.map((e) => ({
      date: `${CAL_BASE}-${pad2(e.day)}`,
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
  ])
  // null = 닫힘, 그 외 = 해당 날짜(YYYY-MM-DD)로 일정 추가 모달 열림.
  const [addDate, setAddDate] = useState<string | null>(null)

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
        action="일정 추가"
        onAction={() => setAddDate(todayStr)}
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
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAddDate(ds)}
                      aria-label={`${cursor.m + 1}월 ${day}일 일정 추가`}
                      className={cn(
                        'flex min-h-[78px] flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors',
                        isToday
                          ? 'border-brand bg-brand/5'
                          : 'border-border hover:border-brand/50 hover:bg-surface-muted/60',
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
                      {eventsOf(day).map((ev, idx) => (
                        <span key={idx} className="flex flex-col gap-0.5">
                          <Chip badge={{ label: ev.type, tone: ev.tone }} />
                          <span className="text-fg-muted line-clamp-1 text-[10px]">
                            {ev.label}
                          </span>
                        </span>
                      ))}
                    </button>
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
      {addDate !== null && (
        <AddScheduleModal
          initialDate={addDate}
          onClose={() => setAddDate(null)}
          onAdd={(item) => {
            setEvents((prev) => [...prev, item])
            // 추가한 일정의 달로 이동해 바로 보이게.
            setCursor({
              y: Number(item.date.slice(0, 4)),
              m: Number(item.date.slice(5, 7)) - 1,
            })
            setAddDate(null)
            toast.success('일정을 추가했습니다')
          }}
        />
      )}
    </div>
  )
}

function AddScheduleModal({
  initialDate,
  onClose,
  onAdd,
}: {
  initialDate: string
  onClose: () => void
  onAdd: (item: CalItem) => void
}) {
  const [date, setDate] = useState(initialDate)
  const [label, setLabel] = useState('')
  const [typeKey, setTypeKey] = useState('brand')
  const [customType, setCustomType] = useState('')
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'
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
      title="일정 추가"
      footer={
        <>
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
            disabled={!label.trim()}
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            추가
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
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">이슈</span>
          <select
            value={typeKey}
            onChange={(e) => setTypeKey(e.target.value)}
            className={field}
          >
            {SCHEDULE_TYPES.map((t) => (
              <option key={t.v} value={t.v}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
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
