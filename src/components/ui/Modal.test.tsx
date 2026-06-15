import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

// 공통 Modal — 포털 렌더, title/children/footer, 닫기 버튼·ESC·열림 토글.

describe('Modal', () => {
  it('open=true면 title·children·footer를 dialog로 렌더한다', () => {
    render(
      <Modal
        open
        onClose={() => {}}
        title="제목"
        footer={<button>확인</button>}
      >
        <p>본문 내용</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('제목')).toBeInTheDocument()
    expect(screen.getByText('본문 내용')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
  })

  it('open=false면 아무것도 렌더하지 않는다', () => {
    render(
      <Modal open={false} onClose={() => {}} title="제목">
        <p>본문 내용</p>
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText('본문 내용')).toBeNull()
  })

  it('닫기 버튼 클릭 시 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="제목">
        <p>본문</p>
      </Modal>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ESC 키로 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="제목">
        <p>본문</p>
      </Modal>,
    )
    const user = userEvent.setup()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
