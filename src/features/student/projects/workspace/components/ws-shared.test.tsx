import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskCard } from './ws-shared'
import type { WsTask } from '../../types'

// QA: "보드 작업은 수정·삭제 기능도 필요."
// 카드는 드래그로 상태를 옮기는 대상이라, 액션은 눌렀을 때만 동작해야 한다.

const task: WsTask = {
  id: 't1',
  title: 'API 명세 정리',
  assignee: '박수진',
  due: '2026-08-01',
  tags: [],
}

describe('TaskCard 액션', () => {
  it('핸들러를 주지 않으면 액션이 없다', () => {
    render(<TaskCard t={task} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('수정·삭제를 눌러도 카드 클릭으로 번지지 않는다', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const onCardClick = vi.fn()
    render(
      <div onClick={onCardClick}>
        <TaskCard t={task} onEdit={onEdit} onDelete={onDelete} />
      </div>,
    )

    await user.click(screen.getByRole('button', { name: 'API 명세 정리 수정' }))
    expect(onEdit).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'API 명세 정리 삭제' }))
    expect(onDelete).toHaveBeenCalledOnce()
    // 부모(드래그 컨테이너)까지 이벤트가 올라가면 다른 동작이 함께 실행된다.
    expect(onCardClick).not.toHaveBeenCalled()
  })
})
