import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { CertOntology, OntologyKind } from '../types'

// 증명서 v2 — 온톨로지 역량 맵.
// 라이브러리 없이 force-directed 시뮬(반발 + 스프링 + 중심 인력 + 미세 드리프트)을
// requestAnimationFrame으로 구동. 노드 드래그·호버 강조 인터랙션 포함.
const KIND: Record<OntologyKind, { color: string; label: string }> = {
  self: { color: 'text-brand', label: '본인' },
  subject: { color: 'text-info', label: '과목' },
  skill: { color: 'text-success', label: '기술' },
  method: { color: 'text-accent-strong', label: '방법론' },
  project: { color: 'text-warning', label: '프로젝트' },
  domain: { color: 'text-danger', label: '도메인' },
}
const KINDS: OntologyKind[] = [
  'self',
  'subject',
  'skill',
  'method',
  'project',
  'domain',
]
const card =
  'border-border bg-surface rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

// 물리 파라미터 (0~100 좌표계 · ~17노드 기준 튜닝)
type Pt = { x: number; y: number; vx: number; vy: number }
const REPULSION = 12
const SPRING_LEN = 13
const SPRING_K = 0.015
const CENTER_K = 0.004
const DAMP = 0.88
const DRIFT = 0.006
const VMAX = 2
const PAD = 6

export function OntologyMap({
  ontology,
  className,
}: {
  ontology: CertOntology
  className?: string
}) {
  const { nodes, edges } = ontology
  const svgRef = useRef<SVGSVGElement>(null)
  const posRef = useRef<Record<string, Pt>>(
    Object.fromEntries(
      nodes.map((n) => [n.id, { x: n.x, y: n.y, vx: 0, vy: 0 }]),
    ),
  )
  const dragId = useRef<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [, render] = useState(0)

  // 호버 강조용 인접 목록
  const neighbors = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const [a, b] of edges) {
      if (!m.has(a)) m.set(a, new Set())
      if (!m.has(b)) m.set(b, new Set())
      m.get(a)!.add(b)
      m.get(b)!.add(a)
    }
    return m
  }, [edges])

  // 화면 좌표 → SVG 사용자 좌표 (viewBox 변환 역행렬)
  const toSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!ctm) return null
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }, [])

  // 시뮬레이션 루프
  useEffect(() => {
    // 노드 구성이 바뀌면 기존 위치 유지 + 신규만 초기화
    posRef.current = Object.fromEntries(
      nodes.map((n) => [
        n.id,
        posRef.current[n.id] ?? { x: n.x, y: n.y, vx: 0, vy: 0 },
      ]),
    )
    const ids = nodes.map((n) => n.id)
    const selfIds = new Set(
      nodes.filter((n) => n.kind === 'self').map((n) => n.id),
    )
    let raf = 0
    let t = 0
    const tick = () => {
      const P = posRef.current
      // 반발력 (모든 노드 쌍)
      for (let i = 0; i < ids.length; i++) {
        const a = P[ids[i]]
        for (let j = i + 1; j < ids.length; j++) {
          const b = P[ids[j]]
          let dx = a.x - b.x
          let dy = a.y - b.y
          let d2 = dx * dx + dy * dy
          if (d2 < 0.01) {
            dx = 0.1
            dy = 0.1
            d2 = 0.02
          }
          const d = Math.sqrt(d2)
          const f = REPULSION / d2
          a.vx += (dx / d) * f
          a.vy += (dy / d) * f
          b.vx -= (dx / d) * f
          b.vy -= (dy / d) * f
        }
      }
      // 스프링 (엣지)
      for (const [s, e] of edges) {
        const a = P[s]
        const b = P[e]
        if (!a || !b) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01
        const f = (d - SPRING_LEN) * SPRING_K
        a.vx += (dx / d) * f
        a.vy += (dy / d) * f
        b.vx -= (dx / d) * f
        b.vy -= (dy / d) * f
      }
      // 중심 인력 + 미세 드리프트 + 감쇠 + 적분
      t += 1
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i]
        const p = P[id]
        const ck = selfIds.has(id) ? CENTER_K * 6 : CENTER_K
        p.vx += (50 - p.x) * ck
        p.vy += (50 - p.y) * ck
        p.vx += Math.sin(t * 0.03 + i * 1.7) * DRIFT
        p.vy += Math.cos(t * 0.025 + i * 2.3) * DRIFT
        p.vx = Math.max(-VMAX, Math.min(VMAX, p.vx * DAMP))
        p.vy = Math.max(-VMAX, Math.min(VMAX, p.vy * DAMP))
        if (dragId.current === id) continue // 드래그 중 노드는 포인터가 위치 제어
        p.x = Math.max(PAD, Math.min(100 - PAD, p.x + p.vx))
        p.y = Math.max(PAD, Math.min(100 - PAD, p.y + p.vy))
      }
      render((v) => (v + 1) & 0xffff)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [nodes, edges])

  const startDrag = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    dragId.current = id
    svgRef.current?.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!dragId.current) return
    const p = toSvg(e.clientX, e.clientY)
    const node = p && posRef.current[dragId.current]
    if (p && node) {
      node.x = Math.max(PAD, Math.min(100 - PAD, p.x))
      node.y = Math.max(PAD, Math.min(100 - PAD, p.y))
      node.vx = 0
      node.vy = 0
    }
  }
  const endDrag = () => {
    dragId.current = null
  }

  const P = posRef.current
  const focus = hover ? neighbors.get(hover) : null

  return (
    <section className={cn(card, 'flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-fg text-[15px] font-bold">온톨로지 역량 맵</span>
        <span className="text-fg-subtle text-[11px]">
          {nodes.length}노드 · {edges.length}엣지 · 노드를 끌어보세요
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="h-[400px] w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {edges.map(([a, b], i) => {
          const na = P[a]
          const nb = P[b]
          if (!na || !nb) return null
          const on = hover === a || hover === b
          return (
            <line
              key={i}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              className={on ? 'text-brand' : 'text-border'}
              stroke="currentColor"
              strokeWidth={on ? 0.7 : 0.35}
              strokeOpacity={hover && !on ? 0.2 : 1}
            />
          )
        })}
        {nodes.map((n) => {
          const p = P[n.id]
          if (!p) return null
          const isSelf = n.kind === 'self'
          const r = isSelf ? 3.4 : 2.2
          const dim = !!hover && hover !== n.id && !focus?.has(n.id)
          return (
            <g
              key={n.id}
              className={cn(KIND[n.kind].color, 'cursor-grab')}
              style={{ opacity: dim ? 0.28 : 1, transition: 'opacity 120ms' }}
              onPointerDown={startDrag(n.id)}
              onPointerEnter={() => setHover(n.id)}
              onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hover === n.id ? r + 0.8 : r}
                fill="currentColor"
              />
              <text
                x={p.x}
                y={p.y - r - 1.2}
                textAnchor="middle"
                fontSize={isSelf ? 3 : 2.4}
                fontWeight={isSelf ? 700 : 500}
                className="text-fg-muted pointer-events-none"
                fill="currentColor"
              >
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {KINDS.map((k) => (
          <span
            key={k}
            className="text-fg-muted flex items-center gap-1.5 text-[11px]"
          >
            <span
              className={cn('size-2 rounded-full', KIND[k].color)}
              style={{ backgroundColor: 'currentColor' }}
            />
            {KIND[k].label}
          </span>
        ))}
      </div>
    </section>
  )
}
