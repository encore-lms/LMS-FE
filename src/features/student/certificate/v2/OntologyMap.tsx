import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { Ontology, OntologyEdgeType, OntologyKind } from '../ai'
import { buildOntologyDisplayGraph } from './ontologyGraph'
import {
  normalizeOntologyLayout,
  type OntologyLayoutPoint,
} from './ontologyLayout'

// 기존 force-directed 맵 형식을 유지하고, 노드와 관계만 근거 기반 분석 결과를 사용한다.
const KIND: Record<OntologyKind, { color: string; label: string }> = {
  self: { color: 'text-brand', label: '본인' },
  subject: { color: 'text-info', label: '과목' },
  skill: { color: 'text-success', label: '기술' },
  method: { color: 'text-accent-strong', label: '방법론' },
  project: { color: 'text-warning', label: '프로젝트' },
  domain: { color: 'text-danger', label: '도메인' },
}
const NODE_RADIUS: Record<OntologyKind, number> = {
  self: 6.5,
  subject: 4.8,
  project: 3.8,
  domain: 2.7,
  skill: 2.7,
  method: 2.7,
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

// 원본 계약은 유지하고 직접 근거와 동일 프로젝트 문맥 관계를 구분해 표시한다.
type Pt = { x: number; y: number; vx: number; vy: number }
type Viewport = { zoom: number; x: number; y: number }
type PanState = {
  pointerId: number
  startClientX: number
  startClientY: number
  viewport: Viewport
}
const MAP_WIDTH = 220
const MAP_HEIGHT = 110
const CENTER_X = MAP_WIDTH / 2
const CENTER_Y = MAP_HEIGHT / 2
const REPULSION = 12
const SPRING_K = 0.001
const CONTEXT_SPRING_K = 0.00018
const ANCHOR_K = 0.025
const SELF_ANCHOR_K = 0.08
const RETURN_ANCHOR_K = 0.14
const DAMP = 0.86
const VMAX = 1.2
const PAD_X = 8
const PAD_Y = 8
const DEFAULT_ZOOM = 0.8
const MIN_ZOOM = 0.5
const MAX_ZOOM = 1.8
const ZOOM_STEP = 0.1
const EDGE_LENGTH: Record<OntologyEdgeType, number> = {
  LEARNED: 28,
  FOLLOWED_BY: 34,
  PARTICIPATED: 54,
  USED: 48,
  APPLIED: 48,
  BELONGS_TO: 48,
}

function initialPoint(point: OntologyLayoutPoint): Pt {
  return { ...point, vx: 0, vy: 0 }
}

function centeredViewport(zoom: number): Viewport {
  const width = MAP_WIDTH / zoom
  const height = MAP_HEIGHT / zoom
  return {
    zoom,
    x: CENTER_X - width / 2,
    y: CENTER_Y - height / 2,
  }
}

function clampViewportOrigin(value: number, size: number, total: number) {
  const min = Math.min(0, total - size)
  const max = Math.max(0, total - size)
  return Math.max(min, Math.min(max, value))
}

function arrowEdgeTarget(source: Pt, target: Pt, targetRadius: number) {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const distance = Math.hypot(dx, dy) || 1
  const gap = targetRadius + 1.4

  return {
    x: target.x - (dx / distance) * gap,
    y: target.y - (dy / distance) * gap,
  }
}

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
  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  )
  const arrowMarkerId = `ontology-arrow-${useId().replace(/:/g, '')}`
  const displayEdges = useMemo(
    () => [...contextEdges, ...directEdges],
    [contextEdges, directEdges],
  )
  const layout = useMemo(
    () => normalizeOntologyLayout(nodes, directEdges),
    [nodes, directEdges],
  )
  const svgRef = useRef<SVGSVGElement>(null)
  const posRef = useRef<Record<string, Pt>>(
    Object.fromEntries(
      nodes.map((node) => [
        node.id,
        initialPoint(layout[node.id] ?? { x: CENTER_X, y: CENTER_Y }),
      ]),
    ),
  )
  const dragId = useRef<string | null>(null)
  const dragPointerId = useRef<number | null>(null)
  const dragOrigin = useRef<OntologyLayoutPoint | null>(null)
  const returnTargets = useRef(new Map<string, OntologyLayoutPoint>())
  const panRef = useRef<PanState | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [selectedKind, setSelectedKind] = useState<OntologyKind | null>(null)
  const [viewport, setViewport] = useState(() => centeredViewport(DEFAULT_ZOOM))
  const [, render] = useState(0)

  const viewBox = useMemo(() => {
    const width = MAP_WIDTH / viewport.zoom
    const height = MAP_HEIGHT / viewport.zoom
    const format = (value: number) => Number(value.toFixed(3))

    return `${format(viewport.x)} ${format(viewport.y)} ${format(width)} ${format(height)}`
  }, [viewport])

  // 호버 강조용 인접 목록
  const neighbors = useMemo(() => {
    const result = new Map<string, Set<string>>()
    for (const edge of displayEdges) {
      if (!result.has(edge.source)) result.set(edge.source, new Set())
      if (!result.has(edge.target)) result.set(edge.target, new Set())
      result.get(edge.source)!.add(edge.target)
      result.get(edge.target)!.add(edge.source)
    }
    return result
  }, [displayEdges])

  // 화면 좌표 → SVG 사용자 좌표 (viewBox 변환 역행렬)
  const toSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg || typeof svg.getScreenCTM !== 'function') return null
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const matrix = ctm.inverse()
    return {
      x: matrix.a * clientX + matrix.c * clientY + matrix.e,
      y: matrix.b * clientX + matrix.d * clientY + matrix.f,
    }
  }, [])

  // 시뮬레이션 루프
  useEffect(() => {
    // 분석 대상이나 노드 구성이 바뀌면 같은 규칙으로 다시 정규화한다.
    posRef.current = Object.fromEntries(
      nodes.map((node) => [
        node.id,
        initialPoint(layout[node.id] ?? { x: CENTER_X, y: CENTER_Y }),
      ]),
    )
    const ids = nodes.map((node) => node.id)
    returnTargets.current.clear()
    const selfIds = new Set(
      nodes.filter((node) => node.kind === 'self').map((node) => node.id),
    )
    let raf = 0
    const tick = () => {
      const positions = posRef.current
      // 반발력 (모든 노드 쌍)
      for (let i = 0; i < ids.length; i++) {
        const a = positions[ids[i]]
        for (let j = i + 1; j < ids.length; j++) {
          const b = positions[ids[j]]
          let dx = a.x - b.x
          let dy = a.y - b.y
          let distanceSquared = dx * dx + dy * dy
          if (distanceSquared < 0.01) {
            dx = 0.1
            dy = 0.1
            distanceSquared = 0.02
          }
          const distance = Math.sqrt(distanceSquared)
          const force = REPULSION / distanceSquared
          a.vx += (dx / distance) * force
          a.vy += (dy / distance) * force
          b.vx -= (dx / distance) * force
          b.vy -= (dy / distance) * force
        }
      }
      // 스프링 (엣지)
      for (const edge of displayEdges) {
        const a = positions[edge.source]
        const b = positions[edge.target]
        if (!a || !b) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.01
        const targetLength =
          edge.relation === 'context' ? 34 : EDGE_LENGTH[edge.type!]
        const spring = edge.relation === 'context' ? CONTEXT_SPRING_K : SPRING_K
        const force =
          (distance - targetLength) * spring * (0.7 + edge.strength * 0.3)
        a.vx += (dx / distance) * force
        a.vy += (dy / distance) * force
        b.vx -= (dx / distance) * force
        b.vy -= (dy / distance) * force
      }
      // 정규화 앵커 + 감쇠 + 적분
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i]
        const point = positions[id]
        const returnTarget = returnTargets.current.get(id)
        const anchor = returnTarget ??
          layout[id] ?? { x: CENTER_X, y: CENTER_Y }
        const anchorForce = returnTarget
          ? RETURN_ANCHOR_K
          : selfIds.has(id)
            ? SELF_ANCHOR_K
            : ANCHOR_K
        point.vx += (anchor.x - point.x) * anchorForce
        point.vy += (anchor.y - point.y) * anchorForce
        point.vx = Math.max(-VMAX, Math.min(VMAX, point.vx * DAMP))
        point.vy = Math.max(-VMAX, Math.min(VMAX, point.vy * DAMP))
        if (dragId.current === id) {
          point.vx = 0
          point.vy = 0
          continue
        }
        point.x = Math.max(
          PAD_X,
          Math.min(MAP_WIDTH - PAD_X, point.x + point.vx),
        )
        point.y = Math.max(
          PAD_Y,
          Math.min(MAP_HEIGHT - PAD_Y, point.y + point.vy),
        )
        if (
          returnTarget &&
          Math.hypot(point.x - returnTarget.x, point.y - returnTarget.y) < 0.2
        ) {
          point.x = returnTarget.x
          point.y = returnTarget.y
          point.vx = 0
          point.vy = 0
          returnTargets.current.delete(id)
        }
      }
      render((value) => (value + 1) & 0xffff)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [nodes, displayEdges, layout])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const direction = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
      const pointer = toSvg(event.clientX, event.clientY)

      setViewport((current) => {
        const nextZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, Number((current.zoom + direction).toFixed(1))),
        )
        if (nextZoom === current.zoom) return current

        const currentWidth = MAP_WIDTH / current.zoom
        const currentHeight = MAP_HEIGHT / current.zoom
        const anchor = pointer ?? {
          x: current.x + currentWidth / 2,
          y: current.y + currentHeight / 2,
        }
        const ratioX = (anchor.x - current.x) / currentWidth
        const ratioY = (anchor.y - current.y) / currentHeight
        const nextWidth = MAP_WIDTH / nextZoom
        const nextHeight = MAP_HEIGHT / nextZoom

        return {
          zoom: nextZoom,
          x: clampViewportOrigin(
            anchor.x - ratioX * nextWidth,
            nextWidth,
            MAP_WIDTH,
          ),
          y: clampViewportOrigin(
            anchor.y - ratioY * nextHeight,
            nextHeight,
            MAP_HEIGHT,
          ),
        }
      })
    }

    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [ontology.status, toSvg])

  const startDrag =
    (id: string) => (event: React.PointerEvent<SVGGElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      const point = posRef.current[id]
      dragOrigin.current = point ? { x: point.x, y: point.y } : null
      returnTargets.current.delete(id)
      dragId.current = id
      dragPointerId.current = event.pointerId
      setDraggingId(id)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
  const startPan = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    panRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      viewport,
    }
    setIsPanning(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const pan = panRef.current
    if (pan && event.pointerId === pan.pointerId) {
      const bounds = svgRef.current?.getBoundingClientRect()
      if (!bounds?.width || !bounds.height) return
      const width = MAP_WIDTH / pan.viewport.zoom
      const height = MAP_HEIGHT / pan.viewport.zoom
      const dx = ((event.clientX - pan.startClientX) / bounds.width) * width
      const dy = ((event.clientY - pan.startClientY) / bounds.height) * height

      setViewport({
        ...pan.viewport,
        x: clampViewportOrigin(pan.viewport.x - dx, width, MAP_WIDTH),
        y: clampViewportOrigin(pan.viewport.y - dy, height, MAP_HEIGHT),
      })
      return
    }

    if (
      !dragId.current ||
      (dragPointerId.current !== null &&
        event.pointerId !== dragPointerId.current)
    )
      return
    const next = toSvg(event.clientX, event.clientY)
    const node = next && posRef.current[dragId.current]
    if (next && node) {
      node.x = Math.max(PAD_X, Math.min(MAP_WIDTH - PAD_X, next.x))
      node.y = Math.max(PAD_Y, Math.min(MAP_HEIGHT - PAD_Y, next.y))
      node.vx = 0
      node.vy = 0
      render((value) => (value + 1) & 0xffff)
    }
  }
  const endDrag = (event: React.PointerEvent) => {
    if (
      dragPointerId.current !== null &&
      event.pointerId !== dragPointerId.current
    )
      return
    const id = dragId.current
    if (id && dragOrigin.current) {
      returnTargets.current.set(id, dragOrigin.current)
    }
    dragId.current = null
    dragPointerId.current = null
    dragOrigin.current = null
    setDraggingId(null)
  }

  const endPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (panRef.current && panRef.current.pointerId === event.pointerId) {
      panRef.current = null
      setIsPanning(false)
      return
    }
    endDrag(event)
  }

  const positions = posRef.current
  const focus = hover ? neighbors.get(hover) : null
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
          {nodes.length}노드 · 직접 {directEdges.length} · 문맥{' '}
          {contextEdges.length}
          {!compact && ' · 노드는 놓으면 원위치'}
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
        <div className="overflow-x-auto pb-1">
          <svg
            ref={svgRef}
            viewBox={viewBox}
            data-zoom={viewport.zoom.toFixed(1)}
            className={cn(
              'w-full touch-none select-none',
              compact
                ? 'h-[220px] min-w-[520px]'
                : 'h-[360px] min-w-[960px] md:h-[380px]',
              isPanning ? 'cursor-grabbing' : 'cursor-grab',
            )}
            role="img"
            aria-label={`${nodes.length}개 노드와 ${displayEdges.length}개 관계로 구성된 온톨로지 역량 맵`}
            onPointerDown={startPan}
            onPointerMove={onMove}
            onPointerUp={(event) => endPointer(event)}
            onPointerCancel={endPointer}
          >
            <defs>
              {/* 지도 느낌의 옅은 도트 그리드 — 빈 캔버스가 허전하지 않게, 정보는 방해하지 않게. */}
              <pattern
                id={`${arrowMarkerId}-grid`}
                width="12"
                height="12"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="1"
                  cy="1"
                  r="0.45"
                  className="fill-border"
                  opacity="0.55"
                />
              </pattern>
              <marker
                id={arrowMarkerId}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="3"
                markerHeight="3"
                orient="auto-start-reverse"
                markerUnits="userSpaceOnUse"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" />
              </marker>
            </defs>
            <rect
              x="0"
              y="0"
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              fill={`url(#${arrowMarkerId}-grid)`}
              pointerEvents="none"
            />
            {displayEdges.map((edge) => {
              const source = positions[edge.source]
              const target = positions[edge.target]
              if (!source || !target) return null
              const targetNode = nodeById.get(edge.target)
              const lineTarget = targetNode
                ? arrowEdgeTarget(source, target, NODE_RADIUS[targetNode.kind])
                : target
              const on = hover === edge.source || hover === edge.target
              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={lineTarget.x}
                  y2={lineTarget.y}
                  className={on ? 'text-brand' : 'text-fg-subtle'}
                  stroke="currentColor"
                  strokeWidth={
                    on ? 0.7 : edge.relation === 'context' ? 0.3 : 0.45
                  }
                  strokeDasharray={
                    edge.relation === 'context' ? '1.6 1.6' : undefined
                  }
                  strokeOpacity={
                    hover
                      ? on
                        ? 1
                        : 0.08
                      : edge.relation === 'context'
                        ? 0.35
                        : 0.55
                  }
                  data-edge-relation={edge.relation}
                  data-edge-source={edge.source}
                  data-edge-target={edge.target}
                  markerEnd={hover && on ? `url(#${arrowMarkerId})` : undefined}
                  pointerEvents="none"
                />
              )
            })}
            {nodes.map((node) => {
              const point = positions[node.id]
              if (!point) return null
              const isSelf = node.kind === 'self'
              const radius = NODE_RADIUS[node.kind]
              const dim = !!hover && hover !== node.id && !focus?.has(node.id)
              return (
                <g
                  key={node.id}
                  className={cn(
                    KIND[node.kind].color,
                    draggingId === node.id ? 'cursor-grabbing' : 'cursor-grab',
                  )}
                  style={{
                    opacity: dim ? 0.28 : 1,
                    transition: 'opacity 120ms',
                  }}
                  onPointerDown={startDrag(node.id)}
                  data-ontology-node={node.id}
                  data-node-x={point.x.toFixed(2)}
                  data-node-y={point.y.toFixed(2)}
                  onPointerEnter={() => setHover(node.id)}
                  onPointerLeave={() =>
                    setHover((current) =>
                      current === node.id ? null : current,
                    )
                  }
                >
                  {/* 본인 노드 헤일로 — 맵의 시각적 중심을 잡아 준다. */}
                  {isSelf && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={radius + 2.6}
                      fill="currentColor"
                      opacity={0.14}
                      pointerEvents="none"
                    />
                  )}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={hover === node.id ? radius + 0.8 : radius}
                    fill="currentColor"
                    className="stroke-surface"
                    strokeWidth={0.9}
                  />
                  {/* 라벨 헤일로(paintOrder stroke) — 간선·노드 위에서도 읽힌다. */}
                  <text
                    x={point.x}
                    y={point.y - radius - 1.6}
                    textAnchor="middle"
                    fontSize={
                      isSelf ? 3.4 : node.kind === 'subject' ? 2.9 : 2.6
                    }
                    fontWeight={isSelf ? 700 : 600}
                    className={cn(
                      'stroke-surface pointer-events-none',
                      isSelf ? 'fill-fg' : 'fill-fg-muted',
                    )}
                    strokeWidth={0.9}
                    style={{ paintOrder: 'stroke' }}
                  >
                    {node.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}

      <div
        className={cn('flex flex-wrap', compact ? 'gap-1' : 'gap-2')}
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
              className={cn('size-2 rounded-full', KIND[kind].color)}
              style={{ backgroundColor: 'currentColor' }}
            />
            {KIND[kind].label}
          </button>
        ))}
        <span
          className={cn(
            'text-fg-muted flex items-center gap-1.5',
            compact ? 'text-[9px]' : 'text-[11px]',
          )}
        >
          <span className="border-fg-subtle w-4 border-t" />
          직접 근거
        </span>
        <span
          className={cn(
            'text-fg-muted flex items-center gap-1.5',
            compact ? 'text-[9px]' : 'text-[11px]',
          )}
        >
          <span className="border-fg-subtle w-4 border-t border-dashed" />
          동일 프로젝트 문맥
        </span>
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
              {KIND[selectedKind].label} {selectedKindNodes.length}개 · 연결{' '}
              {selectedKindEdges.length}개 · 생략{' '}
              {ontology.omittedCounts[selectedKind] ?? 0}개
            </p>
          </div>
        </section>
      )}
    </section>
  )
}
