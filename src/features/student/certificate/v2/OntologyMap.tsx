import { cn } from '@/shared/lib/cn'
import type { CertOntology, OntologyKind } from '../types'

// 증명서 v2 — 온톨로지 역량 맵(본인·과목·기술·방법론·프로젝트·도메인 노드 관계).
// 좌표는 mock 프리셋(0~100) → 라이브러리 없이 정적 SVG. 노드 색은 토큰 text-* + currentColor.
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

export function OntologyMap({
  ontology,
  className,
}: {
  ontology: CertOntology
  className?: string
}) {
  const { nodes, edges } = ontology
  const byId = new Map(nodes.map((n) => [n.id, n]))
  return (
    <section className={cn(card, 'flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-fg text-[15px] font-bold">온톨로지 역량 맵</span>
        <span className="text-fg-subtle text-[11px]">
          {nodes.length}노드 · {edges.length}엣지
        </span>
      </div>

      <svg viewBox="0 0 100 100" className="h-[360px] w-full">
        {edges.map(([a, b], i) => {
          const na = byId.get(a)
          const nb = byId.get(b)
          if (!na || !nb) return null
          return (
            <line
              key={i}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              className="text-border"
              stroke="currentColor"
              strokeWidth={0.35}
            />
          )
        })}
        {nodes.map((n) => {
          const r = n.kind === 'self' ? 3.4 : 2.2
          return (
            <g key={n.id} className={KIND[n.kind].color}>
              <circle cx={n.x} cy={n.y} r={r} fill="currentColor" />
              <text
                x={n.x}
                y={n.y - r - 1.2}
                textAnchor="middle"
                fontSize={n.kind === 'self' ? 3 : 2.4}
                fontWeight={n.kind === 'self' ? 700 : 500}
                className="text-fg-muted"
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
