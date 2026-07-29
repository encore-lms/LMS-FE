import type { OntologyKind, OntologyNode } from '../ai'
import type { OntologyDisplayEdge } from './ontologyGraph'

export interface OntologyLayoutPoint {
  x: number
  y: number
}

const CENTER = { x: 110, y: 55 }
const SUBJECT_RADIUS = { x: 30, y: 18 }
const PROJECT_RADIUS = { x: 58, y: 32 }
const EVIDENCE_RADIUS = { x: 96, y: 48 }
const START_ANGLE = -Math.PI / 2
const FULL_CIRCLE = Math.PI * 2

function normalizeAngle(angle: number) {
  return ((angle % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE
}

function pointOnEllipse(
  angle: number,
  radius: typeof SUBJECT_RADIUS,
): OntologyLayoutPoint {
  return {
    x: CENTER.x + Math.cos(angle) * radius.x,
    y: CENTER.y + Math.sin(angle) * radius.y,
  }
}

function evenlySpacedAngles(nodes: OntologyNode[]) {
  return new Map(
    nodes.map((node, index) => [
      node.id,
      START_ANGLE + (FULL_CIRCLE * index) / Math.max(nodes.length, 1),
    ]),
  )
}

function circularMean(angles: number[]) {
  if (angles.length === 0) return null
  const vector = angles.reduce(
    (sum, angle) => ({
      x: sum.x + Math.cos(angle),
      y: sum.y + Math.sin(angle),
    }),
    { x: 0, y: 0 },
  )
  return Math.atan2(vector.y, vector.x)
}

function relatedAngle(
  node: OntologyNode,
  edges: OntologyDisplayEdge[],
  previousAngles: Map<string, number>,
) {
  const related = edges.flatMap((edge) => {
    if (edge.source === node.id && previousAngles.has(edge.target)) {
      return [previousAngles.get(edge.target)!]
    }
    if (edge.target === node.id && previousAngles.has(edge.source)) {
      return [previousAngles.get(edge.source)!]
    }
    return []
  })
  return circularMean(related)
}

/**
 * 앞 단계 관계 방향을 유지하면서 현재 고리 전체에 고르게 분산한다.
 * 같은 과목에 프로젝트가 여러 개거나 여러 프로젝트가 한 기술을 공유해도
 * 좌표가 겹치지 않고, 관련 노드의 시계 방향 순서는 유지된다.
 */
function spreadRelatedAngles(
  nodes: OntologyNode[],
  edges: OntologyDisplayEdge[],
  previousAngles: Map<string, number>,
) {
  if (nodes.length === 0) return new Map<string, number>()
  const targets = nodes
    .map((node, fallbackIndex) => ({
      node,
      target: normalizeAngle(
        relatedAngle(node, edges, previousAngles) ??
          START_ANGLE + (FULL_CIRCLE * fallbackIndex) / nodes.length,
      ),
    }))
    .sort(
      (a, b) =>
        a.target - b.target ||
        a.node.kind.localeCompare(b.node.kind) ||
        a.node.label.localeCompare(b.node.label, 'ko') ||
        a.node.id.localeCompare(b.node.id),
    )

  let largestGapIndex = 0
  let largestGap = -1
  for (let index = 0; index < targets.length; index += 1) {
    const current = targets[index].target
    const next =
      index === targets.length - 1
        ? targets[0].target + FULL_CIRCLE
        : targets[index + 1].target
    if (next - current > largestGap) {
      largestGap = next - current
      largestGapIndex = index
    }
  }

  const ordered = [
    ...targets.slice(largestGapIndex + 1),
    ...targets.slice(0, largestGapIndex + 1),
  ]
  const step = FULL_CIRCLE / ordered.length
  const rotation =
    ordered.reduce((sum, item, index) => {
      let target = item.target
      while (index > 0 && target < ordered[0].target) target += FULL_CIRCLE
      return sum + target - index * step
    }, 0) / ordered.length

  return new Map(
    ordered.map(({ node }, index) => [node.id, rotation + index * step]),
  )
}

/**
 * 본인을 중앙에 두고 학습 흐름을 세 개의 관계 고리로 펼친다.
 * 본인 → 과목 → 프로젝트 → 도메인·기술·방법론 순서이며, 바깥 노드는
 * 연결 프로젝트 방향을 따라 배치되어 공유 관계도 자연스럽게 모인다.
 */
export function normalizeOntologyLayout(
  nodes: OntologyNode[],
  edges: OntologyDisplayEdge[],
): Record<string, OntologyLayoutPoint> {
  const byKind = (kind: OntologyKind) =>
    nodes.filter((node) => node.kind === kind)
  const subjects = byKind('subject')
  const projects = byKind('project')
  const evidenceNodes = nodes.filter((node) =>
    ['domain', 'skill', 'method'].includes(node.kind),
  )
  const subjectAngles = evenlySpacedAngles(subjects)
  const projectAngles = spreadRelatedAngles(
    subjects.length ? projects : [],
    edges,
    subjectAngles,
  )
  const fallbackProjectAngles =
    projectAngles.size > 0 ? projectAngles : evenlySpacedAngles(projects)
  const evidenceAngles = spreadRelatedAngles(
    evidenceNodes,
    edges,
    fallbackProjectAngles,
  )

  return {
    ...Object.fromEntries(byKind('self').map((node) => [node.id, CENTER])),
    ...Object.fromEntries(
      subjects.map((node) => [
        node.id,
        pointOnEllipse(subjectAngles.get(node.id)!, SUBJECT_RADIUS),
      ]),
    ),
    ...Object.fromEntries(
      projects.map((node) => [
        node.id,
        pointOnEllipse(fallbackProjectAngles.get(node.id)!, PROJECT_RADIUS),
      ]),
    ),
    ...Object.fromEntries(
      evidenceNodes.map((node) => [
        node.id,
        pointOnEllipse(evidenceAngles.get(node.id)!, EVIDENCE_RADIUS),
      ]),
    ),
  }
}
