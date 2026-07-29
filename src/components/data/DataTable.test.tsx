import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable, type Column } from './DataTable'

interface Row {
  id: string
  name: string
}

const cols: Column<Row>[] = [
  { key: 'name', header: '이름', cell: (r) => <span>{r.name}</span> },
]

describe('DataTable', () => {
  it('헤더와 행을 렌더한다', () => {
    render(
      <DataTable
        columns={cols}
        rows={[{ id: '1', name: '김민준' }]}
        rowKey={(r) => r.id}
      />,
    )
    expect(screen.getByText('이름')).toBeInTheDocument()
    expect(screen.getByText('김민준')).toBeInTheDocument()
  })

  it('빈 행이면 empty를 렌더한다', () => {
    render(
      <DataTable columns={cols} rows={[]} rowKey={(r) => r.id} empty="없음" />,
    )
    expect(screen.getByText('없음')).toBeInTheDocument()
  })

  it('행 클릭 시 onRowClick을 호출한다', async () => {
    const onRowClick = vi.fn()
    const user = userEvent.setup()
    render(
      <DataTable
        columns={cols}
        rows={[{ id: '1', name: '김민준' }]}
        rowKey={(r) => r.id}
        onRowClick={onRowClick}
      />,
    )
    await user.click(screen.getByText('김민준'))
    expect(onRowClick).toHaveBeenCalledWith({ id: '1', name: '김민준' })
  })
})
