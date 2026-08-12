import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { Ontology, OntologyKind } from '../ai'
import { buildOntologyDisplayGraph } from './ontologyGraph'

// 캔버스 물리 시뮬 맵 — 살아 움직이고, 끌 수 있고, 짚으면 그 노드의 관계만 자기 색으로
// 밝아진다(2026-08-10 확정, soulhn.github.io Graph 인터랙션 이식).
// 노드·관계 데이터는 기존과 동일하게 근거 기반 분석 결과(buildOntologyDisplayGraph)를 쓴다.
const KIND_LABEL: Record<OntologyKind, string> = {
  self: '본인',
  subject: '과목',
  skill: '기술',
  method: '방법론',
  project: '프로젝트',
  domain: '도메인',
}
// 캔버스는 tailwind 클래스를 못 읽으므로 토큰 CSS 변수에서 실색을 가져온다(폴백 = 토큰 원값).
const KIND_COLOR_VAR: Record<OntologyKind, [string, string]> = {
  self: ['--color-brand', '#1a8c85'],
  subject: ['--color-info', '#3b82f5'],
  skill: ['--color-success', '#0ab080'],
  method: ['--color-accent-strong', '#5c4fd9'],
  project: ['--color-warning', '#b27300'],
  domain: ['--color-danger', '#f04545'],
}
const KINDS: OntologyKind[] = [
  'self',
  'subject',
  'project',
  'domain',
  'skill',
  'method',
]
const KIND_DATA_SOURCE: Record<OntologyKind, string> = {
  self: '수강생 기본정보 · 수강역량증명서 발급 대상자',
  subject: '성취도 평가 · CS 평가',
  project: '인증 프로젝트 · 프로젝트 참여 정보 · 본인 수행업무',
  domain: '인증 프로젝트 도메인',
  skill: '개인 활용기술 · 본인 수행업무 · 인증 트러블슈팅 기술 태그',
  method: '인증 트러블슈팅 문제 유형 · 해결 과정',
}
const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

// 물리 상수 — 08-10 목업에서 캔버스 폭 대비 퍼짐이 자연스럽다고 확인한 값.
const REPULSION = 3600
const REST_DIRECT = 104
const REST_CONTEXT = 185
const K_DIRECT = 0.03
const K_CONTEXT = 0.006
const ANCHOR = 0.009
const ANCHOR_SELF = 0.05
const DAMP = 0.82
const SETTLE_TICKS = 300

type SimNode = {
  id: string
  label: string
  kind: OntologyKind
  x: number
  y: number
  vx: number
  vy: number
  r: number
  cr: number
}
type SimEdge = { an: SimNode; bn: SimNode; direct: boolean }

export function OntologyMap({
  ontology,
  className,
  compact = false,
}: {
  ontology: Ontology
  className?: string
  compact?: boolean
}) {
  const displayGraph = useMemo(
    () => buildOntologyDisplayGraph(ontology.nodes, ontology.edges),
    [ontology.nodes, ontology.edges],
  )
  const { nodes, directEdges, contextEdges } = displayGraph

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const [selectedKind, setSelectedKind] = useState<OntologyKind | null>(null)
  const [showContext, setShowContext] = useState(true)
  // 캔버스 내부 상태는 ref — 프레임마다 리렌더하지 않는다.
  const simRef = useRef<{ nodes: SimNode[]; edges: SimEdge[] } | null>(null)
  const focusRef = useRef<{ hover: SimNode | null; pinned: SimNode | null }>({
    hover: null,
    pinned: null,
  })
  const kindRef = useRef<OntologyKind | null>(null)
  const ctxVisibleRef = useRef(true)
  kindRef.current = selectedKind
  ctxVisibleRef.current = showContext

  // 시뮬 구성 — 노드 셋이 바뀔 때만 다시 만든다.
  useEffect(() => {
    const simNodes: SimNode[] = nodes.map((node) => ({
      id: node.id,
      label: node.label,
      kind: node.kind,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 0,
      cr: 0,
    }))
    const byId = new Map(simNodes.map((n) => [n.id, n]))
    const simEdges: SimEdge[] = []
    for (const edge of [...directEdges, ...contextEdges]) {
      const an = byId.get(edge.source)
      const bn = byId.get(edge.target)
      if (an && bn)
        simEdges.push({ an, bn, direct: edge.relation === 'direct' })
    }
    // 크기 = 근거 가중 연결 수(직접 1 · 문맥 0.35). 본인은 항상 크게.
    const deg = new Map<string, number>()
    for (const e of simEdges) {
      const w = e.direct ? 1 : 0.35
      deg.set(e.an.id, (deg.get(e.an.id) ?? 0) + w)
      deg.set(e.bn.id, (deg.get(e.bn.id) ?? 0) + w)
    }
    for (const n of simNodes) {
      const base =
        n.kind === 'self'
          ? 13
          : n.kind === 'subject' || n.kind === 'project'
            ? 7.5
            : 6
      n.r = base + Math.min(deg.get(n.id) ?? 0, 8) * 0.8
      n.cr = n.r
    }
    simRef.current = { nodes: simNodes, edges: simEdges }
    focusRef.current = { hover: null, pinned: null }
  }, [nodes, directEdges, contextEdges])

  // 렌더 루프 — 리사이즈·물리·그리기·포인터를 캔버스 안에서 완결한다.
  useEffect(() => {
    const canvas = canvasRef.current
    const box = boxRef.current
    const sim = simRef.current
    if (!canvas || !box || !sim || sim.nodes.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return // jsdom 등 캔버스 미지원 환경

    const styles = getComputedStyle(document.documentElement)
    const color = (kind: OntologyKind) => {
      const [cssVar, fallback] = KIND_COLOR_VAR[kind]
      return styles.getPropertyValue(cssVar).trim() || fallback
    }
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0
    let H = 0
    function resize() {
      if (!canvas || !box || !ctx) return
      W = box.clientWidth
      H = compact
        ? Math.min(260, Math.max(210, Math.round(W * 0.52)))
        : Math.min(430, Math.max(320, Math.round(W * 0.36)))
      const dpr = window.devicePixelRatio || 1
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const nb = new Map<string, Set<string>>()
    for (const e of sim.edges) {
      if (!nb.has(e.an.id)) nb.set(e.an.id, new Set())
      if (!nb.has(e.bn.id)) nb.set(e.bn.id, new Set())
      nb.get(e.an.id)!.add(e.bn.id)
      nb.get(e.bn.id)!.add(e.an.id)
    }
    const counts = new Map<string, { direct: number; context: number }>()
    for (const e of sim.edges) {
      for (const id of [e.an.id, e.bn.id]) {
        const c = counts.get(id) ?? { direct: 0, context: 0 }
        if (e.direct) c.direct += 1
        else c.context += 1
        counts.set(id, c)
      }
    }

    // 초기 배치 — 본인 중앙, 나머지는 원형에서 출발해 물리로 자리를 잡는다.
    sim.nodes.forEach((n, i) => {
      const a = (i / sim.nodes.length) * Math.PI * 2
      n.x = W / 2 + (n.kind === 'self' ? 0 : Math.cos(a) * 120)
      n.y = H / 2 + (n.kind === 'self' ? 0 : Math.sin(a) * 80)
    })

    let dragging: SimNode | null = null
    let moved = 0

    function tick() {
      const showCtx = ctxVisibleRef.current
      const ns = sim!.nodes
      for (let i = 0; i < ns.length; i++)
        for (let j = i + 1; j < ns.length; j++) {
          const a = ns[i]
          const b = ns[j]
          let dx = b.x - a.x
          let dy = b.y - a.y
          const d2 = dx * dx + dy * dy || 1
          const f = REPULSION / d2
          const d = Math.sqrt(d2)
          dx /= d
          dy /= d
          a.vx -= dx * f
          a.vy -= dy * f
          b.vx += dx * f
          b.vy += dy * f
        }
      for (const e of sim!.edges) {
        if (!showCtx && !e.direct) continue
        const rest = e.direct ? REST_DIRECT : REST_CONTEXT
        const k = e.direct ? K_DIRECT : K_CONTEXT
        let dx = e.bn.x - e.an.x
        let dy = e.bn.y - e.an.y
        const d = Math.hypot(dx, dy) || 1
        const f = (d - rest) * k
        dx /= d
        dy /= d
        e.an.vx += dx * f
        e.an.vy += dy * f
        e.bn.vx -= dx * f
        e.bn.vy -= dy * f
      }
      const focus = focusRef.current.pinned ?? focusRef.current.hover
      for (const n of ns) {
        const ax = n.kind === 'self' ? ANCHOR_SELF : ANCHOR
        n.vx += (W / 2 - n.x) * ax
        n.vy += (H / 2 - n.y) * ax
        if (n !== dragging) {
          n.vx *= DAMP
          n.vy *= DAMP
          n.x += n.vx
          n.y += n.vy
        }
        n.x = Math.max(30, Math.min(W - 30, n.x))
        n.y = Math.max(26, Math.min(H - 30, n.y))
        const target = n === focus ? n.r * 1.3 : n.r
        n.cr += (target - n.cr) * 0.2
      }
    }

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, W, H)
      // 배경 도트 그리드
      ctx.fillStyle = 'rgba(27,31,39,.04)'
      for (let gx = 14; gx < W; gx += 26)
        for (let gy = 14; gy < H; gy += 26) ctx.fillRect(gx, gy, 1.5, 1.5)

      const focus = focusRef.current.pinned ?? focusRef.current.hover
      const kind = kindRef.current
      const showCtx = ctxVisibleRef.current
      const near = (n: SimNode) =>
        !!focus && (n === focus || nb.get(focus.id)?.has(n.id))

      for (const e of sim!.edges) {
        if (!showCtx && !e.direct) continue
        const on = !!focus && (e.an === focus || e.bn === focus)
        const kindHit = !!kind && (e.an.kind === kind || e.bn.kind === kind)
        ctx.globalAlpha = focus ? (on ? 1 : 0.1) : kind ? (kindHit ? 0.9 : 0.08) : 1
        ctx.beginPath()
        ctx.setLineDash(e.direct ? [] : [4, 5])
        ctx.strokeStyle = on
          ? color(focus!.kind)
          : e.direct
            ? '#c3cad6'
            : 'rgba(150,158,172,.5)'
        ctx.lineWidth = on ? 2 : e.direct ? 1.5 : 1
        ctx.moveTo(e.an.x, e.an.y)
        ctx.lineTo(e.bn.x, e.bn.y)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.textAlign = 'center'
      for (const n of sim!.nodes) {
        const vis = focus ? (near(n) ? 1 : 0.18) : kind ? (n.kind === kind ? 1 : 0.2) : 1
        ctx.globalAlpha = vis
        if (n === focus) {
          ctx.shadowColor = color(n.kind)
          ctx.shadowBlur = 16
        }
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.cr, 0, Math.PI * 2)
        ctx.fillStyle = color(n.kind)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.lineWidth = 2
        ctx.strokeStyle = '#ffffff'
        ctx.stroke()
        ctx.font = `${n === focus ? 700 : 600} ${
          n.kind === 'self' ? '12.5px' : '11.5px'
        } 'Pretendard Variable', Pretendard, sans-serif`
        ctx.fillStyle = vis > 0.5 ? '#3d4450' : '#9ca3b0'
        ctx.fillText(n.label, n.x, n.y + n.cr + 13)
      }
      ctx.globalAlpha = 1
    }

    // 등장 시 미리 안정화 — 첫 화면부터 자리 잡힌 지도가 보인다.
    for (let i = 0; i < SETTLE_TICKS; i++) tick()

    let raf = 0
    function loop() {
      // 모션 최소화 설정에서는 물리 이동 없이 상태 변화(호버·드래그)만 그린다.
      if (!reducedMotion || dragging) tick()
      draw()
      raf = requestAnimationFrame(loop)
    }
    loop()

    const pick = (x: number, y: number) =>
      sim.nodes.find((n) => (n.x - x) ** 2 + (n.y - y) ** 2 < (n.cr + 9) ** 2) ??
      null
    const pos = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return [ev.clientX - r.left, ev.clientY - r.top] as const
    }
    function showTip(n: SimNode, ev: PointerEvent) {
      const tip = tipRef.current
      if (!tip) return
      const c = counts.get(n.id) ?? { direct: 0, context: 0 }
      tip.innerHTML = `<b>${n.label}</b> <span>· ${KIND_LABEL[n.kind]}</span><br>직접 근거 ${c.direct} · 문맥 ${c.context}<br><span>${KIND_DATA_SOURCE[n.kind]}</span>`
      tip.style.left = `${ev.clientX + 14}px`
      tip.style.top = `${ev.clientY + 12}px`
      tip.style.opacity = '1'
    }
    const hideTip = () => {
      if (tipRef.current) tipRef.current.style.opacity = '0'
    }

    const onDown = (ev: PointerEvent) => {
      const [x, y] = pos(ev)
      dragging = pick(x, y)
      moved = 0
      if (dragging) canvas.setPointerCapture(ev.pointerId)
    }
    const onMove = (ev: PointerEvent) => {
      const [x, y] = pos(ev)
      if (dragging) {
        dragging.x = x
        dragging.y = y
        dragging.vx = 0
        dragging.vy = 0
        moved += 1
        showTip(dragging, ev)
        return
      }
      const hover = pick(x, y)
      focusRef.current.hover = hover
      canvas.style.cursor = hover ? 'pointer' : 'default'
      if (hover) showTip(hover, ev)
      else if (!focusRef.current.pinned) hideTip()
    }
    const onUp = () => {
      if (dragging && moved < 4) {
        // 클릭 = 강조 고정/해제 — 발표 중 특정 노드를 가리켜 두기 위한 장치.
        focusRef.current.pinned =
          focusRef.current.pinned === dragging ? null : dragging
        setSelectedKind(null)
      } else if (!dragging) {
        focusRef.current.pinned = null
      }
      if (!focusRef.current.pinned && !focusRef.current.hover) hideTip()
      dragging = null
    }
    const onLeave = () => {
      focusRef.current.hover = null
      if (!focusRef.current.pinned) hideTip()
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', resize)
    }
  }, [nodes, directEdges, contextEdges, compact])

  // 종류 필터를 켜면 노드 고정 강조는 해제한다(두 강조가 겹치면 무엇이 켜졌는지 안 보인다).
  useEffect(() => {
    if (selectedKind) focusRef.current.pinned = null
  }, [selectedKind])

  const selectedKindNodes = selectedKind
    ? nodes.filter((node) => node.kind === selectedKind)
    : []
  const selectedKindNodeIds = new Set(selectedKindNodes.map((node) => node.id))
  const selectedKindEdges = selectedKind
    ? ontology.edges.filter(
        (edge) =>
          selectedKindNodeIds.has(edge.source) ||
          selectedKindNodeIds.has(edge.target),
      )
    : []

  return (
    <section
      data-ontology-compact={compact || undefined}
      className={cn(
        card,
        'flex flex-col',
        compact ? 'gap-2 p-4' : 'gap-3',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-fg text-[15px] font-bold">온톨로지 역량 맵</span>
        <span
          className={cn(
            'text-fg-subtle shrink-0',
            compact ? 'text-[9px]' : 'text-[11px]',
          )}
        >
          {nodes.length}노드 · 직접 {directEdges.length}
          {showContext && <> · 문맥 {contextEdges.length}</>}
          {!compact && ' · 노드를 끌어 배치 변경'}
        </span>
      </div>

      {ontology.status === 'NOT_READY' ? (
        <p
          className={cn(
            'text-fg-muted flex items-center justify-center text-[12px]',
            compact ? 'h-[220px]' : 'h-[360px]',
          )}
        >
          확정 평가나 완료 프로젝트 근거가 없어 역량 관계는 산출 전입니다.
        </p>
      ) : (
        <div
          ref={boxRef}
          className="border-divider overflow-hidden rounded-xl border"
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="온톨로지 역량 맵 — 노드는 역량 요소, 실선은 직접 근거, 점선은 동일 프로젝트 문맥"
            data-node-count={nodes.length}
            data-direct-count={directEdges.length}
            data-context-count={contextEdges.length}
            data-context-visible={showContext}
            className="block w-full touch-none"
          />
        </div>
      )}

      <div
        className={cn('flex flex-wrap items-center', compact ? 'gap-1' : 'gap-2')}
        aria-label="온톨로지 노드 종류별 산출 근거"
      >
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={selectedKind === kind}
            onClick={() =>
              setSelectedKind((current) => (current === kind ? null : kind))
            }
            className={cn(
              'focus-visible:ring-brand flex items-center rounded-md border outline-none focus-visible:ring-2',
              compact
                ? 'gap-1 px-1.5 py-1 text-[9px]'
                : 'gap-1.5 px-2.5 py-1.5 text-[11px]',
              selectedKind === kind
                ? 'border-brand bg-brand/10 text-brand font-bold'
                : 'border-divider text-fg-muted hover:text-fg',
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{
                backgroundColor: `var(${KIND_COLOR_VAR[kind][0]}, ${KIND_COLOR_VAR[kind][1]})`,
              }}
            />
            {KIND_LABEL[kind]}
          </button>
        ))}
        <span
          className={cn(
            'text-fg-muted flex items-center gap-1.5',
            compact ? 'text-[9px]' : 'text-[11px]',
          )}
        >
          <span className="border-border w-4 border-t" />
          직접 근거
        </span>
        <span
          className={cn(
            'text-fg-muted flex items-center gap-1.5',
            compact ? 'text-[9px]' : 'text-[11px]',
          )}
        >
          <span className="border-border w-4 border-t border-dashed" />
          동일 프로젝트 문맥
        </span>
        <label
          className={cn(
            'text-fg-muted ml-auto flex cursor-pointer items-center gap-1.5',
            compact ? 'text-[9px]' : 'text-[11px]',
          )}
        >
          <input
            type="checkbox"
            checked={showContext}
            onChange={(event) => setShowContext(event.target.checked)}
            className="accent-brand"
          />
          문맥 관계 표시
        </label>
      </div>

      {selectedKind && (
        <section
          data-ontology-kind-detail={selectedKind}
          className="border-brand/20 bg-brand/5 grid gap-2 rounded-xl border p-4 sm:grid-cols-2"
        >
          <div className="min-w-0">
            <b className="text-brand text-[10px]">1. 사용 데이터</b>
            <p className="text-fg-muted mt-1 text-[11px] leading-5 [overflow-wrap:anywhere]">
              {KIND_DATA_SOURCE[selectedKind]}
            </p>
          </div>
          <div className="min-w-0">
            <b className="text-brand text-[10px]">2. 판단 근거</b>
            <p className="text-fg-muted mt-1 text-[11px] leading-5 [overflow-wrap:anywhere]">
              {selectedKindNodes
                .flatMap((node) => node.evidence)
                .slice(0, 3)
                .join(' · ') || '연결 가능한 근거 없음'}
            </p>
          </div>
          <div className="min-w-0">
            <b className="text-brand text-[10px]">3. 계산 흐름</b>
            <p className="text-fg-muted mt-1 text-[11px] leading-5">
              원천 중복 제거 → 같은 과목·프로젝트·기술·방법론·도메인 관계를 묶음
              → 근거가 확인된 노드와 관계만 표시
            </p>
          </div>
          <div className="min-w-0">
            <b className="text-brand text-[10px]">4. 결과</b>
            <p className="text-fg-muted mt-1 text-[11px] leading-5">
              {KIND_LABEL[selectedKind]} {selectedKindNodes.length}개 · 연결{' '}
              {selectedKindEdges.length}개 · 생략{' '}
              {ontology.omittedCounts[selectedKind] ?? 0}개
            </p>
          </div>
        </section>
      )}

      {/* 노드 툴팁 — 이름 · 종류 · 근거 수 · 데이터 출처 */}
      <div
        ref={tipRef}
        aria-hidden="true"
        className="bg-fg pointer-events-none fixed z-10 max-w-[250px] rounded-lg px-3 py-2 text-[11px] leading-[1.55] text-white opacity-0 transition-opacity duration-100 [&_span]:text-[#aeb8c4] [&_b]:text-[12px]"
      />
    </section>
  )
}
