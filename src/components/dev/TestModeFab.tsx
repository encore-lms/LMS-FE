import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

// 테스트/데모 전용 플로팅 버튼(FAB) — 드래그로 옮길 수 있는 동그란 "🧪" 버튼.
// (FE 목) BE 연동 시 사용처와 함께 제거한다.
// 평소엔 정식 화면을 가리지 않게 버튼만 떠 있고, 펼치면 시뮬레이션 컨트롤이 나온다(드래그하면 이동).
// 데모 컨트롤(멘토 배정 전/후, 증명서 인증 요청 흐름 등)을 children 으로 받는다.
// 토스트와 동일하게 createPortal 로 body 에 붙인다 — 레이아웃의 transform 조상에 위치가 휘둘리지 않게.
// 공용 토스트(우하단 30/30, z-60)와 코너를 공유하므로 z-40으로 두어 토스트가 항상 위에 보이게 한다.
//
// 펼침 방식 2가지:
//   · 기본(클릭): 짧게 누르면 버튼 옆에 분리 패널이 뜬다.
//   · openOnHover: 마우스를 올린 채 1초 기다리면(원 둘레 프로그래스 링이 한 바퀴 차오르면)
//     원형 버튼에서 컨트롤 패널이 펼쳐진다(버튼 코너에서 scale 로 자라남). 바로 펼치지 않아 드래그 이동이 방해받지 않는다.

const FAB_SIZE = 56 // h-14 w-14
const MARGIN = 30 // 토스트와 동일한 코너 여백
const DRAG_THRESHOLD = 4 // 이만큼 움직이면 "클릭"이 아니라 "드래그"로 본다
const STORAGE_KEY = 'lms:test-fab-pos' // 페이지 이동/새로고침에도 위치 유지
const HOLD_MS = 1000 // 호버 유지 후 펼쳐지기까지 (프로그래스 링 한 바퀴)
const RING_R = 26 // 프로그래스 링 반지름 (지름 52 < 56)
const RING_C = 2 * Math.PI * RING_R // 링 둘레 = stroke-dash 길이

type Pos = { x: number; y: number }

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

// 버튼이 화면 밖으로 나가지 않게 현재 뷰포트 기준으로 가둔다.
function clampToViewport(p: Pos): Pos {
  return {
    x: clamp(
      p.x,
      MARGIN,
      Math.max(MARGIN, window.innerWidth - FAB_SIZE - MARGIN),
    ),
    y: clamp(
      p.y,
      MARGIN,
      Math.max(MARGIN, window.innerHeight - FAB_SIZE - MARGIN),
    ),
  }
}

// 기본 위치 = 우하단(토스트와 같은 코너). 저장된 위치가 있으면 그걸 쓴다.
function loadPos(): Pos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Pos>
      if (typeof p.x === 'number' && typeof p.y === 'number')
        return clampToViewport({ x: p.x, y: p.y })
    }
  } catch {
    // 무시하고 기본 위치로
  }
  return {
    x: window.innerWidth - MARGIN - FAB_SIZE,
    y: window.innerHeight - MARGIN - FAB_SIZE,
  }
}

export function TestModeFab({
  note,
  children,
  openOnHover = false,
}: {
  /** 패널 상단 보조 설명(무엇을 시뮬레이션하는지) */
  note?: string
  children?: ReactNode
  /** 마우스를 올린 채 1.5초 기다리면 버튼이 패널로 펼쳐진다(기본은 클릭 토글). */
  openOnHover?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [holding, setHolding] = useState(false) // 호버 유지 중(링 차오름)
  const [pos, setPos] = useState<Pos>(loadPos)
  // 펼친 카드의 목표 높이(px) — 내용을 실제 측정해 그 값으로 height 를 transition 한다.
  // max-height 오버슈트(목표를 내용보다 크게 잡아 애니메이션이 일찍 끝나고 멈칫하던 현상)를 없앤다.
  const [contentH, setContentH] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  // 드래그 시작 지점 + 이동 여부. 이동했으면 뒤따르는 click 을 토글로 처리하지 않는다.
  const drag = useRef<{
    px: number
    py: number
    baseX: number
    baseY: number
  } | null>(null)
  const moved = useRef(false)
  const closeTimer = useRef<number | null>(null) // 호버 이탈 후 닫기 지연
  const holdTimer = useRef<number | null>(null) // 호버 유지 1.5초 → 펼침

  // 위치 저장 + 창 크기 변경 시 화면 안으로 다시 가둔다.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
    } catch {
      // 저장 실패는 무시
    }
  }, [pos])

  // 내용(고정폭) 높이를 측정 — 폭이 고정이라 한 번 측정되면 안정적. note 변경 시 재측정.
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const update = () => setContentH(el.scrollHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onResize = () => setPos((p) => clampToViewport(p))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 언마운트 시 타이머 정리.
  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    }
  }, [])

  function cancelClose() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  // 호버 유지(링) 취소 — 누르거나 마우스가 떠나면 자동 펼침을 멈춘다.
  function cancelHold() {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
    setHolding(false)
  }

  function handleMouseEnter() {
    if (!openOnHover || drag.current) return
    cancelClose()
    if (open) return
    // 1.5초 동안 링을 채우고, 끝까지 유지되면 펼친다.
    setHolding(true)
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null
      setHolding(false)
      setOpen(true)
    }, HOLD_MS)
  }
  function handleMouseLeave() {
    if (!openOnHover || drag.current) return
    cancelHold()
    if (open) closeTimer.current = window.setTimeout(() => setOpen(false), 120)
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    cancelHold() // 누르면(드래그/클릭 의도) 호버 자동 펼침은 멈춘다
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, baseX: pos.x, baseY: pos.y }
    moved.current = false
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.px
    const dy = e.clientY - d.py
    if (!moved.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    moved.current = true
    setPos(clampToViewport({ x: d.baseX + dx, y: d.baseY + dy }))
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    drag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function handleClick() {
    // 드래그였으면 토글하지 않는다. (다음 pointerdown 에서 moved 는 다시 false 로 초기화됨)
    if (moved.current) {
      moved.current = false
      return
    }
    // 호버 모드에선 호버가 열고 닫음을 제어하므로 클릭 토글은 무시한다.
    if (openOnHover) return
    setOpen((v) => !v)
  }

  // 버튼이 화면 어느 쪽에 있느냐에 따라 펼쳐질 방향을 정한다(밖으로 안 넘치게).
  const openUp = pos.y + FAB_SIZE / 2 > window.innerHeight / 2
  const openLeft = pos.x + FAB_SIZE / 2 > window.innerWidth / 2
  // 펼친 높이 = 측정한 내용 높이 + 핸들행(32) + gap(10) + 패딩(24) + 보더(2) + 여유(2).
  // 측정 전(0)에는 임시값으로 둔다(펼침은 1초 호버 후라 그땐 이미 측정 완료).
  const openH = contentH ? contentH + 70 : 200

  // 드래그 핸들 겸 "🧪" 얼굴 — 두 모드 공통(클래스는 모드별로 다름).
  const handleProps = {
    type: 'button' as const,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onClick: handleClick,
    'aria-expanded': open,
  }

  return createPortal(
    <div
      className="fixed z-40 h-14 w-14"
      style={{ left: pos.x, top: pos.y }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {openOnHover ? (
        // ── 호버 모드: 원형 버튼 하나가 그대로 늘어나 카드가 되고, 내용은 그 안에 담긴다 ──
        // 면(div)을 원↔카드로 모핑(폭·높이·배경색·라운드 transition). 접힘 땐 56 원으로 클립.
        // 코너에 고정해 화면 안쪽으로 자란다. 🧪 는 드래그 핸들(접힘=얼굴 / 열림=작은 핸들).
        <div
          style={{ height: open ? openH : FAB_SIZE }}
          className={cn(
            // gap·border-width 는 상수로 두고 변하는 속성(폭·높이(측정값)·배경·라운드·보더색·패딩)만 전이되게 한다.
            'absolute flex gap-2.5 overflow-hidden border border-dashed border-transparent shadow-[0px_10px_28px_0px_rgba(18,23,38,0.22)] transition-all duration-300 ease-out',
            openUp ? 'bottom-0 flex-col-reverse' : 'top-0 flex-col',
            openLeft ? 'right-0' : 'left-0',
            open
              ? 'bg-accent-bg border-accent-strong/40 w-[232px] rounded-[22px] p-3'
              : 'bg-accent-strong w-14 rounded-full p-0',
          )}
        >
          {/* 🧪 핸들 행 — 접힘: 원의 얼굴(중앙) / 열림: 작은 핸들 + 라벨(펼침의 기준점) */}
          <div
            className={cn(
              'flex shrink-0 items-center gap-2',
              open
                ? cn('self-stretch', openLeft ? 'flex-row-reverse' : 'flex-row')
                : 'h-14 w-14 justify-center',
            )}
          >
            <button
              {...handleProps}
              aria-label="테스트 버전 컨트롤 (드래그해 이동 · 마우스를 올리고 기다리면 펼쳐짐)"
              title="테스트 버전 · 드래그해 이동 / 마우스를 올린 채 기다리면 펼쳐짐"
              className={cn(
                'bg-accent-strong relative flex shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-white shadow-[0px_6px_18px_0px_rgba(18,23,38,0.22)] transition-all duration-300 select-none active:cursor-grabbing',
                open
                  ? 'h-8 w-8 text-base'
                  : 'h-14 w-14 text-2xl hover:scale-105',
              )}
            >
              🧪
              {/* 1초 프로그래스 링 — 접힘 + 호버 유지 중에만 차오른다. */}
              {!open && (
                <svg
                  className="pointer-events-none absolute inset-0 -rotate-90"
                  width={FAB_SIZE}
                  height={FAB_SIZE}
                  viewBox="0 0 56 56"
                  aria-hidden
                >
                  <circle
                    cx="28"
                    cy="28"
                    r={RING_R}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="text-white"
                    style={{
                      strokeDasharray: RING_C,
                      strokeDashoffset: holding ? 0 : RING_C,
                      opacity: holding ? 1 : 0,
                      transition: holding
                        ? `stroke-dashoffset ${HOLD_MS}ms linear`
                        : 'stroke-dashoffset 150ms ease-out, opacity 200ms ease-out',
                    }}
                  />
                </svg>
              )}
            </button>
            <span
              className={cn(
                'text-accent-strong text-[13px] font-bold whitespace-nowrap',
                open ? 'inline' : 'hidden',
              )}
            >
              테스트 버전
            </span>
          </div>

          {/* 내용 — 카드 안에 담긴다. 폭을 고정해(열림 기준) 펼치는 동안 버튼이 리플로우되지 않게 한다. */}
          <div
            ref={contentRef}
            className={cn(
              'flex w-[206px] flex-col gap-2 transition-opacity duration-200',
              open ? 'opacity-100 delay-100' : 'pointer-events-none opacity-0',
            )}
          >
            {note && (
              <p className="text-accent-strong/80 text-[11px] leading-snug font-semibold">
                {note}
              </p>
            )}
            <div className="flex flex-col items-stretch gap-2">{children}</div>
          </div>
        </div>
      ) : (
        // ── 클릭 모드(기존): 동그란 버튼 + 분리 패널 ──
        <>
          {open && (
            <div
              className={cn(
                'border-accent-strong/40 bg-accent-bg absolute w-[min(360px,calc(100vw-2rem))] rounded-xl border border-dashed p-3 shadow-[0px_12px_32px_0px_rgba(18,23,38,0.16)]',
                openUp ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+12px)]',
                openLeft ? 'right-0' : 'left-0',
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="bg-accent-strong inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-white">
                  🧪 테스트 버전
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-accent-strong/70 hover:text-accent-strong text-[12px] font-bold"
                >
                  닫기 ✕
                </button>
              </div>
              {note && (
                <p className="text-accent-strong mb-2 text-[11px] font-semibold">
                  {note}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {children}
              </div>
            </div>
          )}

          <button
            {...handleProps}
            aria-label="테스트 버전 시뮬레이션 컨트롤 (드래그해 이동)"
            title="테스트 버전 · 드래그해 이동 / 클릭해 열기"
            className="bg-accent-strong flex h-14 w-14 cursor-grab touch-none items-center justify-center rounded-full text-2xl shadow-[0px_8px_24px_0px_rgba(18,23,38,0.24)] transition-transform select-none hover:scale-105 active:cursor-grabbing"
          >
            🧪
          </button>
        </>
      )}
    </div>,
    document.body,
  )
}
