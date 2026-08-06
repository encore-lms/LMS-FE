import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Ontology } from '../ai'
import { ANALYSIS_STUBS } from '../ai/stubs/analysis'
import { OntologyMap } from './OntologyMap'
import { buildOntologyDisplayGraph } from './ontologyGraph'
import { normalizeOntologyLayout } from './ontologyLayout'

const ontology = ANALYSIS_STUBS['stu-001'].ontology

describe('OntologyMap', () => {
  it('과목에서 해당 프로젝트로 이어지고 프로젝트 경험은 문맥 관계로도 연결한다', () => {
    const displayGraph = buildOntologyDisplayGraph(
      ontology.nodes,
      ontology.edges,
    )
    const subject = ontology.nodes.find((node) => node.kind === 'subject')!
    const project = ontology.nodes.find((node) => node.kind === 'project')!

    expect(displayGraph.directEdges).toHaveLength(ontology.edges.length)
    expect(displayGraph.contextEdges).toHaveLength(5)
    expect(
      displayGraph.contextEdges.every((edge) => edge.projectIds.length > 0),
    ).toBe(true)
    expect(
      displayGraph.directEdges.some(
        (edge) =>
          edge.type === 'FOLLOWED_BY' &&
          edge.source === subject.id &&
          edge.target === project.id,
      ),
    ).toBe(true)
  })

  it('안전한 기술 별칭과 중복 엣지는 하나의 표시 노드·관계로 합친다', () => {
    const project = ontology.nodes.find((node) => node.kind === 'project')!
    const skill = ontology.nodes.find((node) => node.kind === 'skill')!
    const usedEdge = ontology.edges.find((edge) => edge.type === 'USED')!
    const displayGraph = buildOntologyDisplayGraph(
      [
        ...ontology.nodes,
        { ...skill, id: 'skill-js', label: 'JS' },
        { ...skill, id: 'skill-javascript', label: 'JavaScript' },
      ],
      [
        ...ontology.edges,
        { ...usedEdge, source: project.id, target: 'skill-js' },
        { ...usedEdge, source: project.id, target: 'skill-javascript' },
      ],
    )

    const javascriptNodes = displayGraph.nodes.filter(
      (node) => node.label === 'JavaScript',
    )
    expect(javascriptNodes).toHaveLength(1)
    expect(
      displayGraph.directEdges.filter(
        (edge) => edge.target === javascriptNodes[0].id,
      ),
    ).toHaveLength(1)
  })

  it('본인 중앙에서 과목·프로젝트·경험 근거를 세 개의 관계 고리로 배치한다', () => {
    const displayGraph = buildOntologyDisplayGraph(
      ontology.nodes,
      ontology.edges,
    )
    const layout = normalizeOntologyLayout(
      displayGraph.nodes,
      displayGraph.directEdges,
    )
    const self = displayGraph.nodes.find((node) => node.kind === 'self')!
    const onEllipse = (nodeId: string, radius: { x: number; y: number }) => {
      const point = layout[nodeId]
      return Math.sqrt(
        ((point.x - 110) / radius.x) ** 2 + ((point.y - 55) / radius.y) ** 2,
      )
    }
    const subjects = displayGraph.nodes.filter(
      (node) => node.kind === 'subject',
    )
    const projects = displayGraph.nodes.filter(
      (node) => node.kind === 'project',
    )
    const evidenceNodes = displayGraph.nodes.filter((node) =>
      ['skill', 'method', 'domain'].includes(node.kind),
    )

    expect(layout[self.id]).toEqual({ x: 110, y: 55 })
    expect(
      subjects.every(
        (node) => Math.abs(onEllipse(node.id, { x: 30, y: 18 }) - 1) < 0.000001,
      ),
    ).toBe(true)
    expect(
      projects.every(
        (node) => Math.abs(onEllipse(node.id, { x: 58, y: 32 }) - 1) < 0.000001,
      ),
    ).toBe(true)
    expect(
      evidenceNodes.every(
        (node) => Math.abs(onEllipse(node.id, { x: 96, y: 48 }) - 1) < 0.000001,
      ),
    ).toBe(true)
    expect(
      new Set(
        evidenceNodes.map(
          (node) =>
            `${layout[node.id].x.toFixed(6)}:${layout[node.id].y.toFixed(6)}`,
        ),
      ),
    ).toHaveLength(evidenceNodes.length)
    expect(
      normalizeOntologyLayout(displayGraph.nodes, displayGraph.directEdges),
    ).toEqual(layout)
  })

  it('가로 공간을 넓게 쓰는 드래그형 포스 그래프와 여섯 범주를 유지한다', () => {
    const { container } = render(<OntologyMap ontology={ontology} />)

    expect(screen.getByText(/직접 7 · 문맥 5/)).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: `${ontology.nodes.length}개 노드와 12개 관계로 구성된 온톨로지 역량 맵`,
      }),
    ).toBeInTheDocument()
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    expect(container.querySelectorAll('svg circle')).toHaveLength(
      ontology.nodes.length,
    )
    expect(container.querySelectorAll('svg line')).toHaveLength(12)
    expect(
      container.querySelectorAll('[data-edge-relation="direct"]'),
    ).toHaveLength(7)
    expect(
      container.querySelectorAll('[data-edge-relation="context"]'),
    ).toHaveLength(5)
    expect(
      [...container.querySelectorAll('[data-edge-relation]')].every(
        (edge) => !edge.hasAttribute('marker-end'),
      ),
    ).toBe(true)
    const graph = screen.getByRole('img')
    expect(graph).toHaveAttribute('viewBox', '-27.5 -13.75 275 137.5')
    expect(graph).toHaveAttribute('data-zoom', '0.8')
    expect(graph).toHaveClass('min-w-[960px]')
    expect(graph.parentElement).toHaveClass('overflow-x-auto')
    for (const label of [
      '본인',
      '과목',
      '기술',
      '방법론',
      '프로젝트',
      '도메인',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByText('직접 근거')).toBeInTheDocument()
    expect(screen.getByText('동일 프로젝트 문맥')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '기술' }))
    const detail = container.querySelector(
      '[data-ontology-kind-detail="skill"]',
    )
    expect(detail).toHaveTextContent('1. 사용 데이터')
    expect(detail).toHaveTextContent('개인 활용기술')
    expect(detail).toHaveTextContent('인증 트러블슈팅 기술 태그')
    expect(detail).toHaveTextContent('2. 판단 근거')
    expect(detail).toHaveTextContent('3. 계산 흐름')
    expect(detail).toHaveTextContent('4. 결과')
  })

  it('노드 호버 중에만 해당 노드의 관계에 방향 화살표를 표시한다', () => {
    const { container } = render(<OntologyMap ontology={ontology} />)
    const self = ontology.nodes.find((node) => node.kind === 'self')!
    const selfNode = container.querySelector(
      `[data-ontology-node="${self.id}"]`,
    )!

    fireEvent.pointerEnter(selfNode)

    const relatedDirectEdges = [
      ...container.querySelectorAll(
        `[data-edge-relation="direct"][data-edge-source="${self.id}"], [data-edge-relation="direct"][data-edge-target="${self.id}"]`,
      ),
    ]
    const unrelatedDirectEdges = [
      ...container.querySelectorAll('[data-edge-relation="direct"]'),
    ].filter((edge) => !relatedDirectEdges.includes(edge))

    expect(relatedDirectEdges.length).toBeGreaterThan(0)
    expect(
      relatedDirectEdges.every((edge) => edge.hasAttribute('marker-end')),
    ).toBe(true)
    expect(
      unrelatedDirectEdges.every((edge) => !edge.hasAttribute('marker-end')),
    ).toBe(true)
    expect(
      [...container.querySelectorAll('[data-edge-relation="context"]')].every(
        (edge) => !edge.hasAttribute('marker-end'),
      ),
    ).toBe(true)

    fireEvent.pointerLeave(selfNode)
    expect(
      [...container.querySelectorAll('[data-edge-relation]')].every(
        (edge) => !edge.hasAttribute('marker-end'),
      ),
    ).toBe(true)
  })

  it('도메인·기술·방법론 문맥 관계도 의미 순서의 화살표로 표시한다', () => {
    const { container } = render(<OntologyMap ontology={ontology} />)
    const domain = ontology.nodes.find((node) => node.kind === 'domain')!
    const domainNode = container.querySelector(
      `[data-ontology-node="${domain.id}"]`,
    )!

    fireEvent.pointerEnter(domainNode)

    const relatedContextEdges = [
      ...container.querySelectorAll(
        `[data-edge-relation="context"][data-edge-source="${domain.id}"], [data-edge-relation="context"][data-edge-target="${domain.id}"]`,
      ),
    ]
    expect(relatedContextEdges.length).toBeGreaterThan(0)
    expect(
      relatedContextEdges.every((edge) => edge.hasAttribute('marker-end')),
    ).toBe(true)
    expect(
      relatedContextEdges.every(
        (edge) => edge.getAttribute('data-edge-source') === domain.id,
      ),
    ).toBe(true)
  })

  it('본인·과목·프로젝트 순으로 작아지고 경험 근거 세 범주는 같은 크기다', () => {
    const { container } = render(<OntologyMap ontology={ontology} />)
    const radiusOf = (kind: string) => {
      const node = ontology.nodes.find((candidate) => candidate.kind === kind)!
      return Number(
        container
          .querySelector(`[data-ontology-node="${node.id}"] circle`)
          ?.getAttribute('r'),
      )
    }

    expect(radiusOf('self')).toBe(6)
    expect(radiusOf('subject')).toBe(4.5)
    expect(radiusOf('project')).toBe(3.3)
    expect(radiusOf('domain')).toBe(2.2)
    expect(radiusOf('skill')).toBe(2.2)
    expect(radiusOf('method')).toBe(2.2)
  })

  it('휠 입력으로 맵을 확대하고 축소한다', () => {
    render(<OntologyMap ontology={ontology} />)
    const graph = screen.getByRole('img')

    fireEvent.wheel(graph, { deltaY: -100 })
    expect(graph).toHaveAttribute('data-zoom', '0.9')
    expect(graph).toHaveAttribute('viewBox', '-12.222 -6.111 244.444 122.222')

    fireEvent.wheel(graph, { deltaY: 100 })
    expect(graph).toHaveAttribute('data-zoom', '0.8')
    expect(graph).toHaveAttribute('viewBox', '-27.5 -13.75 275 137.5')
  })

  it('마우스 포인터가 가리킨 지점을 기준으로 확대한다', () => {
    render(<OntologyMap ontology={ontology} />)
    const graph = screen.getByRole('img')

    Object.defineProperty(graph, 'getScreenCTM', {
      configurable: true,
      value: () => ({
        inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
      }),
    })

    fireEvent.wheel(graph, { deltaY: -100, clientX: 180, clientY: 70 })

    expect(graph).toHaveAttribute('data-zoom', '0.9')
    expect(graph).toHaveAttribute('viewBox', '-4.444 -4.444 244.444 122.222')
  })

  it('마우스 왼쪽 버튼으로 옮긴 노드는 놓으면 정규화 위치로 돌아간다', async () => {
    const { container } = render(<OntologyMap ontology={ontology} />)
    const graph = screen.getByRole('img')
    const nodeId = ontology.nodes[0].id
    const node = container.querySelector(`[data-ontology-node="${nodeId}"]`)

    Object.defineProperty(graph, 'getScreenCTM', {
      configurable: true,
      value: () => ({
        inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
      }),
    })

    expect(node).not.toBeNull()
    fireEvent(
      node as Element,
      new MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 100,
        clientY: 42,
      }),
    )
    fireEvent(
      graph,
      new MouseEvent('pointermove', {
        bubbles: true,
        clientX: 120,
        clientY: 60,
      }),
    )
    fireEvent(graph, new MouseEvent('pointerup', { bubbles: true }))

    await waitFor(() => {
      expect(Number(node?.getAttribute('data-node-x'))).toBeLessThan(120)
    })
  })

  it('마우스 왼쪽 버튼으로 빈 공간을 끌면 전체 맵을 상하좌우로 이동한다', () => {
    render(<OntologyMap ontology={ontology} />)
    const graph = screen.getByRole('img')

    Object.defineProperty(graph, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        width: 1000,
        height: 400,
        top: 0,
        right: 1000,
        bottom: 400,
        left: 0,
        x: 0,
        y: 0,
        toJSON: () => undefined,
      }),
    })

    fireEvent(
      graph,
      new MouseEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 100,
        clientY: 50,
      }),
    )
    fireEvent(
      graph,
      new MouseEvent('pointermove', {
        bubbles: true,
        clientX: 140,
        clientY: 70,
      }),
    )
    fireEvent(graph, new MouseEvent('pointerup', { bubbles: true }))

    expect(graph).toHaveAttribute('viewBox', '-38.5 -20.625 275 137.5')
    expect(graph).toHaveClass('cursor-grab')
  })

  it('관계 근거가 없으면 맵을 산출 전으로 표시한다', () => {
    const notReady: Ontology = {
      ...ontology,
      status: 'NOT_READY',
      summary: '산출 전',
      counts: {
        self: 1,
        subject: 0,
        skill: 0,
        method: 0,
        project: 0,
        domain: 0,
      },
      nodes: ontology.nodes.filter((node) => node.kind === 'self'),
      edges: [],
    }
    render(<OntologyMap ontology={notReady} />)

    expect(screen.getByText(/역량 관계는 산출 전/)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
