import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareMaterialModal } from './ShareMaterialModal'

// 자료 공유는 실제 File 을 실어 보내야 한다 — 예전엔 이름·크기만 보내
// 서버에 바이트가 저장되지 않았고, 목록의 다운로드가 404로 끝났다.
function renderModal(onShared = vi.fn()) {
  render(<ShareMaterialModal open onClose={vi.fn()} onShared={onShared} />)
  return onShared
}

describe('ShareMaterialModal', () => {
  it('처음 열면 파일 목록이 비어 있다', () => {
    renderModal()
    // 예전엔 mock 파일이 하나 박혀 있어 올리지도 않은 자료가 공유됐다.
    expect(screen.queryByText('jpa-n-plus-one-note.pdf')).toBeNull()
  })

  it('선택한 파일을 실제 File 객체로 넘긴다', async () => {
    const user = userEvent.setup()
    const onShared = renderModal()
    const file = new File(['hello'], 'note.pdf', { type: 'application/pdf' })

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(input, file)
    await user.click(screen.getByRole('button', { name: /공유하기/ }))

    expect(onShared).toHaveBeenCalledTimes(1)
    const payload = onShared.mock.calls[0][0]
    expect(payload.file).toBeInstanceOf(File)
    expect(payload.file.name).toBe('note.pdf')
    expect(payload.title).toBe('note.pdf')
  })

  it('파일 없이 공유하면 아무 것도 넘기지 않는다', async () => {
    const user = userEvent.setup()
    const onShared = renderModal()
    await user.click(screen.getByRole('button', { name: /공유하기/ }))
    expect(onShared).not.toHaveBeenCalled()
  })
})
