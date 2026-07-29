import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectLinkModal } from './ProjectLinkModal'
import type { TsLinkableProject } from '../types'

// 예전에는 하드코딩된 상수 3건을 보여줬다 — 남의 프로젝트가 뜨고 연결도 저장되지 않았다.
// 이제 수강생 본인 프로젝트를 부모가 넘긴다.
const projects: TsLinkableProject[] = [
  { id: 'pr-1', title: '학습 기록 분석 파이프라인', kindLabel: '팀', desc: '팀 5명' },
  { id: 'pr-2', title: '출결 자동화', kindLabel: '개인', desc: '개인 프로젝트' },
]

describe('ProjectLinkModal', () => {
  it('넘겨받은 프로젝트만 후보로 보여준다', () => {
    render(
      <ProjectLinkModal
        open
        current={null}
        projects={projects}
        onClose={vi.fn()}
        onLink={vi.fn()}
      />,
    )

    expect(screen.getByText('학습 기록 분석 파이프라인')).toBeInTheDocument()
    expect(screen.getByText('출결 자동화')).toBeInTheDocument()
    // 폐기된 하드코딩 목록이 남아 있지 않아야 한다.
    expect(screen.queryByText('주문 관리 MSA 백엔드')).not.toBeInTheDocument()
  })

  it('선택한 프로젝트를 id·제목과 함께 올린다', async () => {
    const user = userEvent.setup()
    const onLink = vi.fn()
    render(
      <ProjectLinkModal
        open
        current={null}
        projects={projects}
        onClose={vi.fn()}
        onLink={onLink}
      />,
    )

    // 선택 전에는 연결할 수 없다.
    expect(screen.getByRole('button', { name: '연결' })).toBeDisabled()

    await user.click(screen.getByText('출결 자동화'))
    await user.click(screen.getByRole('button', { name: '연결' }))

    expect(onLink).toHaveBeenCalledWith({
      projectId: 'pr-2',
      projectTitle: '출결 자동화',
    })
  })

  it('프로젝트가 없으면 안내를 보여준다', () => {
    render(
      <ProjectLinkModal
        open
        current={null}
        projects={[]}
        onClose={vi.fn()}
        onLink={vi.fn()}
      />,
    )

    expect(screen.getByText('연결할 프로젝트가 없어요')).toBeInTheDocument()
  })

  it('연결 중에는 중복 제출을 막는다', () => {
    render(
      <ProjectLinkModal
        open
        current={{ projectId: 'pr-1', projectTitle: '학습 기록 분석 파이프라인' }}
        projects={projects}
        pending
        onClose={vi.fn()}
        onLink={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: '연결 중…' })).toBeDisabled()
  })
})
