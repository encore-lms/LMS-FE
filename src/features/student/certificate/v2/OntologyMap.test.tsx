import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ANALYSIS_STUBS } from '../ai/stubs/analysis'
import { OntologyMap } from './OntologyMap'
import { buildOntologyDisplayGraph } from './ontologyGraph'

const ontology = ANALYSIS_STUBS['stu-001'].ontology
const displayGraph = buildOntologyDisplayGraph(ontology.nodes, ontology.edges)

// 그리기는 캔버스 내부(jsdom 미지원)라, 여기서는 데이터 계약과 화면 컨트롤을 고정한다.
// 표시 그래프 계산 자체는 ontologyGraph.test 가 담당한다.
describe('OntologyMap', () => {
  it('과목에서 해당 프로젝트로 이어지고 프로젝트 경험은 문맥 관계로도 연결한다', () => {
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
    const merged = buildOntologyDisplayGraph(
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

    const javascriptNodes = merged.nodes.filter(
      (node) => node.label === 'JavaScript',
    )
    expect(javascriptNodes).toHaveLength(1)
    expect(
      merged.directEdges.filter(
        (edge) => edge.target === javascriptNodes[0].id,
      ),
    ).toHaveLength(1)
  })

  it('헤더 집계와 캔버스 데이터 속성이 표시 그래프와 일치한다', () => {
    render(<OntologyMap ontology={ontology} />)

    expect(
      screen.getByText(
        new RegExp(
          `직접 ${displayGraph.directEdges.length} · 문맥 ${displayGraph.contextEdges.length}`,
        ),
      ),
    ).toBeInTheDocument()

    const canvas = screen.getByRole('img', {
      name: /온톨로지 역량 맵/,
    })
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas).toHaveAttribute(
      'data-node-count',
      String(displayGraph.nodes.length),
    )
    expect(canvas).toHaveAttribute(
      'data-direct-count',
      String(displayGraph.directEdges.length),
    )
    expect(canvas).toHaveAttribute(
      'data-context-count',
      String(displayGraph.contextEdges.length),
    )
  })

  it('종류 버튼을 누르면 산출 근거 상세가 열리고 다시 누르면 닫힌다', () => {
    const { container } = render(<OntologyMap ontology={ontology} />)

    for (const label of [
      '본인',
      '과목',
      '프로젝트',
      '도메인',
      '기술',
      '방법론',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }

    fireEvent.click(screen.getByRole('button', { name: '기술' }))
    const detail = container.querySelector(
      '[data-ontology-kind-detail="skill"]',
    )
    expect(detail).not.toBeNull()
    expect(detail).toHaveTextContent('개인 활용기술')

    fireEvent.click(screen.getByRole('button', { name: '기술' }))
    expect(
      container.querySelector('[data-ontology-kind-detail]'),
    ).toBeNull()
  })

  it('문맥 관계 토글을 끄면 헤더 집계와 캔버스 속성에서 문맥이 빠진다', () => {
    render(<OntologyMap ontology={ontology} />)

    fireEvent.click(screen.getByRole('checkbox', { name: '문맥 관계 표시' }))

    expect(screen.queryByText(/문맥 \d/)).toBeNull()
    expect(screen.getByRole('img', { name: /온톨로지 역량 맵/ })).toHaveAttribute(
      'data-context-visible',
      'false',
    )
  })

  it('산출 전 상태에서는 캔버스 대신 안내 문구를 보여준다', () => {
    render(
      <OntologyMap ontology={{ ...ontology, status: 'NOT_READY' }} />,
    )

    expect(
      screen.getByText(
        '확정 평가나 완료 프로젝트 근거가 없어 역량 관계는 산출 전입니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })
})
