import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

// 공통 날짜·시간 선택기 (Figma 공통 컴포넌트). 라이브러리 없이 디자인 토큰으로 구현.
// 4모드: date(달력) · time(시·분) · datetime(달력 선택 후 시간 선택) · month(연·월 격자). 네이티브 type=date/time 대체.
// 값 포맷 — date: 'YYYY-MM-DD' · time: 'HH:mm' · datetime: 'YYYY-MM-DDTHH:mm' · month: 'YYYY-MM'. 빈값은 ''.

export type DateTimeMode = 'date' | 'time' | 'datetime' | 'month'

export interface DateTimePickerProps {
  mode?: DateTimeMode
  /** 분 단위 간격 — 기본 5분(슬롯 선택). 정밀 입력(멘토 일지 등)은 1 */
  minuteStep?: number
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
  error?: string
  ariaLabel?: string
  /** 선택 가능한 최소값(date: YYYY-MM-DD · month: YYYY-MM) — 범위 입력의 종료일 등 */
  min?: string
  /** 선택 가능한 최대값(date: YYYY-MM-DD · month: YYYY-MM) */
  max?: string
  className?: string
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
// 12시간제 시 목록(12,1,…,11) — 오전/오후 토글과 함께. 값은 24시간제 'HH:mm'로 저장.
const HOURS12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const to24 = (h12: number, period: 'AM' | 'PM') =>
  period === 'AM' ? (h12 === 12 ? 0 : h12) : h12 === 12 ? 12 : h12 + 12
const from24 = (h: number): { period: 'AM' | 'PM'; h12: number } => ({
  period: h < 12 ? 'AM' : 'PM',
  h12: h % 12 === 0 ? 12 : h % 12,
})
const periodLabel = (p: 'AM' | 'PM') => (p === 'AM' ? '오전' : '오후')
const pad = (n: number) => String(n).padStart(2, '0')
const toDateStr = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`
const VIEWPORT_PADDING = 8
const TRIGGER_GAP = 6
const MIN_PANEL_WIDTH = 300
const ESTIMATED_PANEL_HEIGHT = 360

interface PopoverPosition {
  top: number
  left: number
  width: number
  maxHeight: number
}

function parseDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null
}
function parseTime(s: string) {
  const m = /(\d{2}):(\d{2})(?::\d{2})?$/.exec(s)
  return m ? { h: +m[1], min: +m[2] } : null
}
function parseMonth(s: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(s)
  return m ? { y: +m[1], m: +m[2] - 1 } : null
}
function monthCells(y: number, m: number): (number | null)[] {
  const startDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells: (number | null)[] = Array.from({ length: startDow }, () => null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export function DateTimePicker({
  mode = 'date',
  minuteStep = 5,
  value,
  onChange,
  label,
  required,
  placeholder,
  disabled,
  error,
  ariaLabel,
  min,
  max,
  className,
}: DateTimePickerProps) {
  const id = useId()
  // 팝오버는 body 로 portal 렌더한다 — 모달 등 overflow 컨테이너 안에서 잘리지 않게.
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  // 팝오버 fixed 위치(트리거 기준). 가용 공간이 더 넓은 쪽에 배치한다.
  const [pos, setPos] = useState<PopoverPosition>({
    top: 0,
    left: 0,
    width: MIN_PANEL_WIDTH,
    maxHeight: ESTIMATED_PANEL_HEIGHT,
  })

  const updatePos = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return

    // 모바일 주소창·키보드가 열린 상태도 반영하도록 visual viewport를 우선한다.
    const viewport = window.visualViewport
    const viewportTop = viewport?.offsetTop ?? 0
    const viewportLeft = viewport?.offsetLeft ?? 0
    const viewportWidth = viewport?.width ?? window.innerWidth
    const viewportHeight = viewport?.height ?? window.innerHeight
    const viewportRight = viewportLeft + viewportWidth
    const viewportBottom = viewportTop + viewportHeight

    const width = Math.min(
      Math.max(r.width, MIN_PANEL_WIDTH),
      Math.max(0, viewportWidth - VIEWPORT_PADDING * 2),
    )
    const minLeft = viewportLeft + VIEWPORT_PADDING
    const maxLeft = Math.max(minLeft, viewportRight - VIEWPORT_PADDING - width)
    const left = Math.min(Math.max(r.left, minLeft), maxLeft)

    // 첫 렌더 전에는 추정값을 쓰고, 마운트 후에는 실제 콘텐츠 높이로 재계산한다.
    // scrollHeight를 포함해 이전 max-height에 의해 줄어든 패널도 원래 높이를 복원한다.
    const panelRectHeight =
      panelRef.current?.getBoundingClientRect().height ?? 0
    const panelHeight = Math.max(
      panelRef.current?.scrollHeight ?? 0,
      panelRectHeight,
      panelRef.current ? 0 : ESTIMATED_PANEL_HEIGHT,
    )
    const naturalHeight = panelHeight || ESTIMATED_PANEL_HEIGHT
    const spaceBelow = Math.max(
      0,
      viewportBottom - VIEWPORT_PADDING - r.bottom - TRIGGER_GAP,
    )
    const spaceAbove = Math.max(
      0,
      r.top - TRIGGER_GAP - (viewportTop + VIEWPORT_PADDING),
    )
    const placeAbove = naturalHeight > spaceBelow && spaceAbove > spaceBelow
    const maxHeight = placeAbove ? spaceAbove : spaceBelow
    const renderedHeight = Math.min(naturalHeight, maxHeight)
    const minTop = viewportTop + VIEWPORT_PADDING
    const maxTop = Math.max(
      minTop,
      viewportBottom - VIEWPORT_PADDING - renderedHeight,
    )
    const idealTop = placeAbove
      ? r.top - TRIGGER_GAP - renderedHeight
      : r.bottom + TRIGGER_GAP
    const top = Math.min(Math.max(idealTop, minTop), maxTop)

    setPos({
      top,
      left,
      width,
      maxHeight,
    })
  }, [])
  // datetime 모드의 단계: 달력 → 시간.
  const [view, setView] = useState<'calendar' | 'time'>(
    mode === 'time' ? 'time' : 'calendar',
  )

  const today = useMemo(() => new Date(), [])
  const minutes = useMemo(
    () =>
      Array.from(
        { length: Math.floor(60 / minuteStep) },
        (_, i) => i * minuteStep,
      ),
    [minuteStep],
  )
  const parsedDate = parseDate(value)
  const parsedTime = parseTime(value)
  const parsedMonth = mode === 'month' ? parseMonth(value) : null

  // 달력에 표시 중인 연/월(선택값 있으면 그 달, 없으면 이번 달). month 모드는 연도만 사용.
  const [cursor, setCursor] = useState(() => ({
    y: parsedDate?.y ?? parsedMonth?.y ?? today.getFullYear(),
    m: parsedDate?.m ?? today.getMonth(),
  }))
  // 시간 드래프트(적용 전까지 보관) — 12시간제 + 오전/오후.
  const initTime = parsedTime ? from24(parsedTime.h) : null
  const [draftH12, setDraftH12] = useState<number | null>(initTime?.h12 ?? null)
  const [draftPeriod, setDraftPeriod] = useState<'AM' | 'PM'>(
    initTime?.period ?? 'AM',
  )
  const [draftMin, setDraftMin] = useState<number | null>(
    parsedTime?.min ?? null,
  )
  // datetime 에서 달력으로 고른 날짜(시간 적용 시 합친다).
  const [draftDate, setDraftDate] = useState<string | null>(
    parsedDate ? toDateStr(parsedDate.y, parsedDate.m, parsedDate.d) : null,
  )

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      // 트리거·패널(portal) 밖 클릭이면 닫는다.
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    // 스크롤·리사이즈로 트리거가 움직이면 팝오버 위치를 따라간다.
    const onReflow = () => updatePos()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onReflow, true)
    window.addEventListener('resize', onReflow)
    window.visualViewport?.addEventListener('scroll', onReflow)
    window.visualViewport?.addEventListener('resize', onReflow)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onReflow, true)
      window.removeEventListener('resize', onReflow)
      window.visualViewport?.removeEventListener('scroll', onReflow)
      window.visualViewport?.removeEventListener('resize', onReflow)
    }
  }, [open, updatePos])

  // portal이 마운트되거나 달력/시간 화면의 높이가 바뀐 직후 실제 크기로 보정한다.
  useLayoutEffect(() => {
    if (open) updatePos()
  }, [cursor.m, cursor.y, mode, open, updatePos, view])

  const openPanel = () => {
    if (disabled) return
    setView(mode === 'time' ? 'time' : 'calendar')
    const t = parsedTime ? from24(parsedTime.h) : null
    setDraftH12(t?.h12 ?? null)
    setDraftPeriod(t?.period ?? 'AM')
    setDraftMin(parsedTime?.min ?? null)
    setDraftDate(
      parsedDate ? toDateStr(parsedDate.y, parsedDate.m, parsedDate.d) : null,
    )
    if (parsedDate) setCursor({ y: parsedDate.y, m: parsedDate.m })
    else if (parsedMonth) setCursor((c) => ({ ...c, y: parsedMonth.y }))
    updatePos()
    setOpen((v) => !v)
  }

  const inRange = (dateStr: string) =>
    (!min || dateStr >= min) && (!max || dateStr <= max)

  const pickDay = (d: number) => {
    const ds = toDateStr(cursor.y, cursor.m, d)
    if (!inRange(ds)) return
    if (mode === 'date') {
      onChange(ds)
      setOpen(false)
    } else {
      // datetime — 날짜 고르고 시간 단계로.
      setDraftDate(ds)
      setView('time')
    }
  }

  // month — 연·월 격자에서 한 달 선택. 값은 'YYYY-MM'. min/max 도 'YYYY-MM' 로 비교(문자열 사전순).
  const pickMonth = (m: number) => {
    const ms = `${cursor.y}-${pad(m + 1)}`
    if (!inRange(ms)) return
    onChange(ms)
    setOpen(false)
  }

  const applyTime = () => {
    const h = draftH12 != null ? to24(draftH12, draftPeriod) : 0
    const m = draftMin ?? 0
    const t = `${pad(h)}:${pad(m)}`
    if (mode === 'time') {
      onChange(t)
    } else if (draftDate) {
      onChange(`${draftDate}T${t}`)
    }
    setOpen(false)
  }

  // 트리거에 보일 텍스트(시간은 오전/오후 + 12시간제).
  const fmtTime = (h: number, mm: number) => {
    const { period, h12 } = from24(h)
    return `${periodLabel(period)} ${pad(h12)}:${pad(mm)}`
  }
  const display = (() => {
    if (mode === 'time')
      return parsedTime ? fmtTime(parsedTime.h, parsedTime.min) : ''
    if (mode === 'month') return parsedMonth ? value : ''
    if (mode === 'date') return parsedDate ? value : ''
    // datetime
    if (parsedDate && parsedTime) {
      return `${toDateStr(parsedDate.y, parsedDate.m, parsedDate.d)} ${fmtTime(parsedTime.h, parsedTime.min)}`
    }
    return ''
  })()

  const TriggerIcon = mode === 'time' ? Clock : Calendar
  const todayStr = toDateStr(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )

  return (
    <div className={cn('flex w-full flex-col gap-[6px]', className)}>
      {label && (
        <label htmlFor={id} className="text-fg text-[13px] font-bold">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      <div className="relative">
        <button
          id={id}
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={openPanel}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={ariaLabel ?? label}
          aria-invalid={error ? true : undefined}
          className={cn(
            'border-border focus:border-brand flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-sm transition-colors outline-none',
            error && 'border-danger',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <span className={cn(display ? 'text-fg' : 'text-fg-subtle')}>
            {display || placeholder || '선택'}
          </span>
          <TriggerIcon className="text-fg-subtle h-4 w-4 shrink-0" />
        </button>

        {open &&
          createPortal(
            <div
              ref={panelRef}
              role="dialog"
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: pos.width,
                maxHeight: pos.maxHeight,
                overflowY: 'auto',
              }}
              className="border-border z-[60] rounded-xl border bg-white p-3 shadow-[0px_12px_32px_0px_rgba(18,23,38,0.16)]"
            >
              {mode === 'month' ? (
                <>
                  {/* 연도 네비게이션 */}
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      aria-label="이전 해"
                      onClick={() => setCursor((c) => ({ ...c, y: c.y - 1 }))}
                      className="text-fg-muted hover:bg-surface-muted hover:text-fg rounded-md p-1.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-fg text-[13px] font-bold">
                      {cursor.y}년
                    </span>
                    <button
                      type="button"
                      aria-label="다음 해"
                      onClick={() => setCursor((c) => ({ ...c, y: c.y + 1 }))}
                      className="text-fg-muted hover:bg-surface-muted hover:text-fg rounded-md p-1.5"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 월 격자(1~12월) */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {Array.from({ length: 12 }, (_, m) => {
                      const ms = `${cursor.y}-${pad(m + 1)}`
                      const selected = value === ms
                      const disabledMonth = !inRange(ms)
                      return (
                        <button
                          key={ms}
                          type="button"
                          disabled={disabledMonth}
                          onClick={() => pickMonth(m)}
                          className={cn(
                            'flex h-9 items-center justify-center rounded-md text-[13px] tabular-nums transition-colors',
                            selected
                              ? 'bg-brand font-bold text-white'
                              : 'text-fg hover:bg-surface-muted',
                            disabledMonth &&
                              'cursor-not-allowed opacity-30 hover:bg-transparent',
                          )}
                        >
                          {m + 1}월
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : view === 'calendar' ? (
                <>
                  {/* 월 네비게이션 */}
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      aria-label="이전 달"
                      onClick={() =>
                        setCursor((c) =>
                          c.m === 0
                            ? { y: c.y - 1, m: 11 }
                            : { y: c.y, m: c.m - 1 },
                        )
                      }
                      className="text-fg-muted hover:bg-surface-muted hover:text-fg rounded-md p-1.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-fg text-[13px] font-bold">
                      {cursor.y}년 {cursor.m + 1}월
                    </span>
                    <button
                      type="button"
                      aria-label="다음 달"
                      onClick={() =>
                        setCursor((c) =>
                          c.m === 11
                            ? { y: c.y + 1, m: 0 }
                            : { y: c.y, m: c.m + 1 },
                        )
                      }
                      className="text-fg-muted hover:bg-surface-muted hover:text-fg rounded-md p-1.5"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {WEEKDAYS.map((w, i) => (
                      <span
                        key={w}
                        className={cn(
                          'flex h-7 items-center justify-center text-[11px] font-semibold',
                          i === 0
                            ? 'text-danger'
                            : i === 6
                              ? 'text-info'
                              : 'text-fg-subtle',
                        )}
                      >
                        {w}
                      </span>
                    ))}
                    {monthCells(cursor.y, cursor.m).map((d, i) =>
                      d === null ? (
                        <span key={`e${i}`} className="h-8" />
                      ) : (
                        (() => {
                          const ds = toDateStr(cursor.y, cursor.m, d)
                          const selected =
                            draftDate === ds || value.startsWith(ds)
                          const isToday = ds === todayStr
                          const disabledDay = !inRange(ds)
                          return (
                            <button
                              key={ds}
                              type="button"
                              disabled={disabledDay}
                              onClick={() => pickDay(d)}
                              className={cn(
                                'flex h-8 items-center justify-center rounded-md text-[13px] tabular-nums transition-colors',
                                selected
                                  ? 'bg-brand font-bold text-white'
                                  : 'text-fg hover:bg-surface-muted',
                                !selected && isToday && 'text-brand font-bold',
                                disabledDay &&
                                  'cursor-not-allowed opacity-30 hover:bg-transparent',
                              )}
                            >
                              {d}
                            </button>
                          )
                        })()
                      ),
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* 시간 선택 */}
                  {mode === 'datetime' && (
                    <button
                      type="button"
                      onClick={() => setView('calendar')}
                      className="text-fg-muted hover:text-fg mb-2 inline-flex items-center gap-1 text-xs font-medium"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      {draftDate ?? '날짜'}
                    </button>
                  )}
                  {/* 오전/오후 */}
                  <div className="border-border bg-surface-muted/40 mb-2 grid grid-cols-2 gap-1 rounded-lg border p-1">
                    {(['AM', 'PM'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDraftPeriod(p)}
                        className={cn(
                          'rounded-md py-1.5 text-[13px] font-semibold transition-colors',
                          draftPeriod === p
                            ? 'bg-brand text-white'
                            : 'text-fg-muted hover:bg-surface-muted',
                        )}
                      >
                        {periodLabel(p)}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <TimeColumn
                      title="시"
                      values={HOURS12}
                      selected={draftH12}
                      onSelect={setDraftH12}
                    />
                    <TimeColumn
                      title="분"
                      values={minutes}
                      selected={draftMin}
                      onSelect={setDraftMin}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={draftH12 === null}
                    onClick={applyTime}
                    className="bg-brand-deep hover:bg-brand-deep/90 mt-3 h-9 w-full rounded-lg text-[13px] font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    적용
                  </button>
                </>
              )}
            </div>,
            document.body,
          )}
      </div>
      {error && (
        <p role="alert" className="text-danger text-[13px]">
          {error}
        </p>
      )}
    </div>
  )
}

// 시간 컬럼(시/분) — 스크롤 가능한 버튼 리스트.
function TimeColumn({
  title,
  values,
  selected,
  onSelect,
}: {
  title: string
  values: number[]
  selected: number | null
  onSelect: (v: number) => void
}) {
  return (
    <div className="flex flex-col">
      <span className="text-fg-subtle mb-1 text-center text-[11px] font-semibold">
        {title}
      </span>
      <div className="border-border flex max-h-40 flex-col gap-0.5 overflow-y-auto rounded-lg border p-1">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            aria-label={`${pad(v)}${title}`}
            onClick={() => onSelect(v)}
            className={cn(
              'rounded-md py-1.5 text-center text-[13px] tabular-nums transition-colors',
              selected === v
                ? 'bg-brand font-bold text-white'
                : 'text-fg hover:bg-surface-muted',
            )}
          >
            {pad(v)}
          </button>
        ))}
      </div>
    </div>
  )
}
