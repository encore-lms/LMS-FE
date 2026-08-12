import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { RichTextEditor } from './RichTextEditor'

// 표를 넣고 나면 행·열을 더하거나 지울 방법이 없어 지우지도 못하고 남았다.
// 커서가 표 안에 있을 때만 조작 막대를 띄운다.

function Editor() {
  const [v, setV] = useState('')
  return (
    <>
      <RichTextEditor value={v} onChange={setV} ariaLabel="본문" />
      <output data-testid="md">{v}</output>
    </>
  )
}

const md = () => screen.getByTestId('md').textContent ?? ''
const toolbar = () => screen.queryByRole('toolbar', { name: '표 편집' })

async function insertTable(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('textbox', { name: '본문' }))
  await user.keyboard('/')
  await waitFor(() => expect(screen.getByText('표')).toBeInTheDocument())
  await user.click(screen.getByText('표'))
  await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
}

/** 마크다운 표의 몸통 행 수(머리글·구분선 제외). */
const bodyRows = () =>
  md()
    .split('\n')
    .filter((l) => l.startsWith('|') && !l.includes('---')).length - 1

const cols = () => screen.getAllByRole('columnheader').length

describe('표 조작', () => {
  it('표 안에 커서가 있을 때만 막대가 뜬다', async () => {
    const user = userEvent.setup()
    render(<Editor />)

    expect(toolbar()).not.toBeInTheDocument()
    await insertTable(user)

    await waitFor(() => expect(toolbar()).toBeInTheDocument())
  })

  it('열을 더하고 지운다', async () => {
    const user = userEvent.setup()
    render(<Editor />)
    await insertTable(user)
    const before = cols()

    await user.click(screen.getByRole('button', { name: '오른쪽에 열' }))
    await waitFor(() => expect(cols()).toBe(before + 1))

    await user.click(screen.getByRole('button', { name: '열 삭제' }))
    await waitFor(() => expect(cols()).toBe(before))
  })

  it('행을 더한다', async () => {
    const user = userEvent.setup()
    render(<Editor />)
    await insertTable(user)
    const before = bodyRows()

    await user.click(screen.getByRole('button', { name: '아래에 행' }))

    await waitFor(() => expect(bodyRows()).toBe(before + 1))
  })

  // 지우는 대상은 커서가 놓인 행이다 — 본문 칸을 짚고 지운다.
  it('본문 행을 지운다', async () => {
    const user = userEvent.setup()
    render(<Editor />)
    await insertTable(user)
    const before = bodyRows()

    await user.click(screen.getAllByRole('cell')[0])
    await user.click(screen.getByRole('button', { name: '행 삭제' }))

    await waitFor(() => expect(bodyRows()).toBe(before - 1))
  })

  // 지울 수 없어 남던 표.
  it('표를 통째로 지운다', async () => {
    const user = userEvent.setup()
    render(<Editor />)
    await insertTable(user)

    await user.click(screen.getByRole('button', { name: '표 삭제' }))

    await waitFor(() => expect(screen.queryByRole('table')).toBeNull())
    expect(toolbar()).not.toBeInTheDocument()
    expect(md()).not.toContain('|')
  })
})
