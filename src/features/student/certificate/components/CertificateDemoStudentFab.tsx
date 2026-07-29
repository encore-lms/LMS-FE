import { useEffect, useRef, useState } from 'react'
import { Check, FlaskConical, GripVertical, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type {
  CertificateDemoStudent,
  DemoRecommendationState,
} from '../demoStudents'

const BUTTON_SIZE = 56
const VIEWPORT_MARGIN = 16
const PANEL_WIDTH = 336
const PANEL_HEIGHT = 472

interface Point {
  x: number
  y: number
}

interface DragState {
  pointerId: number
  pointerStart: Point
  positionStart: Point
  moved: boolean
}

const recommendationLabel: Record<DemoRecommendationState, string> = {
  BOTH: '강사·멘토 추천',
  MENTOR_ONLY: '멘토 추천',
  INSTRUCTOR_ONLY: '강사 추천',
  NONE: '추천 없음',
}

function initialPosition(): Point {
  if (typeof window === 'undefined') return { x: 24, y: 24 }
  return {
    x: window.innerWidth - BUTTON_SIZE - 32,
    y: window.innerHeight - BUTTON_SIZE - 32,
  }
}

function clampPosition(position: Point): Point {
  if (typeof window === 'undefined') return position
  return {
    x: Math.min(
      Math.max(VIEWPORT_MARGIN, position.x),
      window.innerWidth - BUTTON_SIZE - VIEWPORT_MARGIN,
    ),
    y: Math.min(
      Math.max(VIEWPORT_MARGIN, position.y),
      window.innerHeight - BUTTON_SIZE - VIEWPORT_MARGIN,
    ),
  }
}

export function CertificateDemoStudentFab({
  students,
  selectedStudentId,
  onSelect,
}: {
  students: CertificateDemoStudent[]
  selectedStudentId: string
  onSelect: (studentId: string) => void
}) {
  const [position, setPosition] = useState<Point>(initialPosition)
  const [open, setOpen] = useState(false)
  const dragRef = useRef<DragState | null>(null)
  const suppressClickRef = useRef(false)
  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) ?? students[0]

  useEffect(() => {
    const handleResize = () => setPosition((current) => clampPosition(current))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      pointerStart: { x: event.clientX, y: event.clientY },
      positionStart: position,
      moved: false,
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaX = event.clientX - drag.pointerStart.x
    const deltaY = event.clientY - drag.pointerStart.y
    if (Math.hypot(deltaX, deltaY) > 4) drag.moved = true
    if (!drag.moved) return
    setPosition(
      clampPosition({
        x: drag.positionStart.x + deltaX,
        y: drag.positionStart.y + deltaY,
      }),
    )
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    suppressClickRef.current = drag.moved
    dragRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  function handleClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    setOpen((current) => !current)
  }

  const opensLeft =
    typeof window !== 'undefined' && position.x > window.innerWidth / 2
  const desiredPanelLeft = opensLeft
    ? position.x - PANEL_WIDTH - 12
    : position.x + BUTTON_SIZE + 12
  const panelLeft =
    typeof window === 'undefined'
      ? desiredPanelLeft
      : Math.min(
          Math.max(VIEWPORT_MARGIN, desiredPanelLeft),
          Math.max(
            VIEWPORT_MARGIN,
            window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN,
          ),
        )
  const panelTop =
    typeof window === 'undefined'
      ? position.y
      : Math.min(
          Math.max(VIEWPORT_MARGIN, position.y - PANEL_HEIGHT + BUTTON_SIZE),
          Math.max(
            VIEWPORT_MARGIN,
            window.innerHeight - PANEL_HEIGHT - VIEWPORT_MARGIN,
          ),
        )

  return (
    <div data-certificate-demo-student-ui>
      {open && (
        <section
          aria-label="시연 수강생 선택 패널"
          className="border-border bg-surface fixed z-[70] flex w-[336px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border shadow-[0px_18px_48px_0px_rgba(18,23,38,0.22)]"
          style={{ left: panelLeft, top: panelTop, maxHeight: PANEL_HEIGHT }}
        >
          <div className="border-divider bg-surface-muted/70 flex items-start justify-between gap-3 border-b px-4 py-3.5">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-fg text-[13px] font-bold">
                시연 수강생 선택
              </span>
              <span className="text-fg-subtle text-[10px] leading-4">
                프로젝트·이력서를 제외한 주요 결과가 함께 전환됩니다.
              </span>
            </div>
            <button
              type="button"
              aria-label="시연 수강생 선택 닫기"
              className="text-fg-subtle hover:bg-surface hover:text-fg flex size-7 shrink-0 items-center justify-center rounded-lg"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto p-3">
            {students.map((student) => {
              const selected = student.id === selectedStudentId
              return (
                <button
                  key={student.id}
                  type="button"
                  aria-pressed={selected}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                    selected
                      ? 'border-brand bg-brand/5'
                      : 'border-border-subtle hover:border-brand/30 hover:bg-surface-muted/60',
                  )}
                  onClick={() => {
                    onSelect(student.id)
                    setOpen(false)
                  }}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                      selected
                        ? 'bg-brand text-white'
                        : 'bg-surface-muted text-fg-muted',
                    )}
                  >
                    {selected ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : (
                      student.name.slice(-1)
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-fg text-[12px] font-bold">
                        {student.name}
                      </span>
                      <span className="text-fg-subtle text-[10px]">
                        {student.cohortName}
                      </span>
                      <span className="bg-accent-bg text-accent-strong rounded px-1.5 py-0.5 text-[9px] font-bold">
                        {student.profileLabel}
                      </span>
                    </span>
                    <span className="text-fg-muted line-clamp-2 text-[10px] leading-4">
                      {student.profileSummary}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[9px]">
                      <span className="text-brand font-bold">
                        종합 {student.overallScore}
                      </span>
                      <span className="text-fg-subtle">
                        {recommendationLabel[student.recommendationState]}
                      </span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="border-divider text-fg-subtle flex items-center gap-1.5 border-t px-4 py-2.5 text-[9px]">
            <GripVertical className="size-3" aria-hidden="true" />
            원형 버튼을 잡아 원하는 위치로 이동할 수 있습니다.
          </div>
        </section>
      )}

      <button
        type="button"
        aria-label={`시연 수강생 선택 · 현재 ${selectedStudent.name}`}
        aria-expanded={open}
        className="bg-brand-deep fixed z-[71] flex size-14 touch-none items-center justify-center rounded-full text-white shadow-[0px_10px_28px_0px_rgba(18,23,38,0.28)] transition-[box-shadow,transform] select-none hover:shadow-[0px_14px_34px_0px_rgba(18,23,38,0.34)] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95"
        style={{ left: position.x, top: position.y }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current = null
        }}
        onClick={handleClick}
      >
        <FlaskConical className="size-5" aria-hidden="true" />
        <span className="bg-warning absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white">
          5
        </span>
      </button>
    </div>
  )
}
