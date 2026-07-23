import type {
  AiProfileConfidence,
  OntologyEdge,
  OntologyEdgeType,
  OntologyKind,
  OntologyNode,
} from '../ai'

export interface OntologyDisplayEdge {
  id: string
  source: string
  target: string
  relation: 'direct' | 'context'
  strength: number
  type?: OntologyEdgeType
  projectIds: string[]
}

export interface OntologyDisplayGraph {
  nodes: OntologyNode[]
  directEdges: OntologyDisplayEdge[]
  contextEdges: OntologyDisplayEdge[]
}

const MERGEABLE_KINDS = new Set<OntologyKind>([
  'subject',
  'skill',
  'method',
  'domain',
])
const CONTEXT_KINDS = new Set<OntologyKind>(['skill', 'method', 'domain'])
const CONTEXT_KIND_ORDER: Partial<Record<OntologyKind, number>> = {
  domain: 0,
  skill: 1,
  method: 2,
}
const CONFIDENCE_RANK: Record<AiProfileConfidence, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
}
const LABEL_ALIASES: Record<string, { key: string; label: string }> = {
  js: { key: 'javascript', label: 'JavaScript' },
  javascript: { key: 'javascript', label: 'JavaScript' },
  postgres: { key: 'postgresql', label: 'PostgreSQL' },
  postgresql: { key: 'postgresql', label: 'PostgreSQL' },
  spring: { key: 'spring', label: 'Spring' },
  springframework: { key: 'spring', label: 'Spring' },
}

function compactLabel(label: string) {
  return label
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s._/-]+/g, '')
}

function normalizedLabel(node: OntologyNode) {
  const compact = compactLabel(node.label)
  const alias = LABEL_ALIASES[compact]
  return {
    key: `${node.kind}:${alias?.key ?? compact}`,
    label: alias?.label ?? node.label.trim(),
  }
}

function unique(values: string[]) {
  return [...new Set(values)]
}

function mergeNodes(nodes: OntologyNode[]) {
  const merged: OntologyNode[] = []
  const indexByKey = new Map<string, number>()
  const canonicalIdBySourceId = new Map<string, string>()

  for (const node of nodes) {
    const normalized = normalizedLabel(node)
    const mergeKey = MERGEABLE_KINDS.has(node.kind)
      ? normalized.key
      : `${node.kind}:${node.id}`
    const existingIndex = indexByKey.get(mergeKey)

    if (existingIndex === undefined) {
      indexByKey.set(mergeKey, merged.length)
      canonicalIdBySourceId.set(node.id, node.id)
      merged.push({ ...node, label: normalized.label })
      continue
    }

    const existing = merged[existingIndex]
    canonicalIdBySourceId.set(node.id, existing.id)
    const evidence = unique([...existing.evidence, ...node.evidence])
    merged[existingIndex] = {
      ...existing,
      label: normalized.label,
      weight: Math.max(existing.weight, node.weight),
      evidence,
      evidenceCount: evidence.length,
      confidence:
        CONFIDENCE_RANK[node.confidence] > CONFIDENCE_RANK[existing.confidence]
          ? node.confidence
          : existing.confidence,
    }
  }

  return { merged, canonicalIdBySourceId }
}

function normalizeDirectEdges(
  edges: OntologyEdge[],
  canonicalIdBySourceId: Map<string, string>,
  validNodeIds: Set<string>,
) {
  const directByKey = new Map<string, OntologyDisplayEdge>()

  for (const edge of edges) {
    const source = canonicalIdBySourceId.get(edge.source) ?? edge.source
    const target = canonicalIdBySourceId.get(edge.target) ?? edge.target
    if (
      source === target ||
      !validNodeIds.has(source) ||
      !validNodeIds.has(target)
    )
      continue

    const key = `${source}:${target}:${edge.type}`
    const existing = directByKey.get(key)
    directByKey.set(key, {
      id: `direct:${key}`,
      source,
      target,
      relation: 'direct',
      strength: Math.max(existing?.strength ?? 0, edge.strength),
      type: edge.type,
      projectIds: [],
    })
  }

  return [...directByKey.values()]
}

function buildContextEdges(
  nodes: OntologyNode[],
  directEdges: OntologyDisplayEdge[],
) {
  const kindById = new Map(nodes.map((node) => [node.id, node.kind]))
  const projectIds = nodes
    .filter((node) => node.kind === 'project')
    .map((node) => node.id)
  const directPairs = new Set(
    directEdges.map((edge) => [edge.source, edge.target].sort().join(':')),
  )
  const contextByPair = new Map<
    string,
    OntologyDisplayEdge & { strengths: number[] }
  >()

  for (const projectId of projectIds) {
    const neighbors = directEdges.flatMap((edge) => {
      if (edge.source === projectId) {
        return [{ id: edge.target, strength: edge.strength }]
      }
      if (edge.target === projectId) {
        return [{ id: edge.source, strength: edge.strength }]
      }
      return []
    })
    const contextNodes = neighbors.filter(({ id }) =>
      CONTEXT_KINDS.has(kindById.get(id)!),
    )

    for (let left = 0; left < contextNodes.length; left += 1) {
      for (let right = left + 1; right < contextNodes.length; right += 1) {
        const a = contextNodes[left]
        const b = contextNodes[right]
        if (kindById.get(a.id) === kindById.get(b.id)) continue
        const pair = [a.id, b.id].sort().join(':')
        if (directPairs.has(pair)) continue
        const [source, target] =
          CONTEXT_KIND_ORDER[kindById.get(a.id)!]! <
          CONTEXT_KIND_ORDER[kindById.get(b.id)!]!
            ? [a.id, b.id]
            : [b.id, a.id]
        const existing = contextByPair.get(pair)
        const strength = (a.strength + b.strength) / 2

        contextByPair.set(pair, {
          id: `context:${pair}`,
          source,
          target,
          relation: 'context',
          strength: existing?.strength ?? strength,
          projectIds: unique([...(existing?.projectIds ?? []), projectId]),
          strengths: [...(existing?.strengths ?? []), strength],
        })
      }
    }
  }

  return [...contextByPair.values()].map(({ strengths, ...edge }) => ({
    ...edge,
    strength:
      strengths.reduce((sum, value) => sum + value, 0) / strengths.length,
  }))
}

/**
 * 원본 계약은 바꾸지 않고 표시 단계에서 안전한 별칭·중복만 합친다.
 * 프로젝트에 함께 연결된 도메인·기술·방법론은 직접 근거가 아닌
 * 동일 프로젝트 문맥 관계로 별도 생성한다.
 */
export function buildOntologyDisplayGraph(
  nodes: OntologyNode[],
  edges: OntologyEdge[],
): OntologyDisplayGraph {
  const { merged, canonicalIdBySourceId } = mergeNodes(nodes)
  const directEdges = normalizeDirectEdges(
    edges,
    canonicalIdBySourceId,
    new Set(merged.map((node) => node.id)),
  )

  return {
    nodes: merged,
    directEdges,
    contextEdges: buildContextEdges(merged, directEdges),
  }
}
