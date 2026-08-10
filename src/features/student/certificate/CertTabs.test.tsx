import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CertTabs } from './CertTabs'

/**
 * 탭 폭 규칙 회귀 — 예전엔 `flex-1` 만 있어 좁은 창에서 셀이 글자보다 작아졌고
 * `whitespace-nowrap` 텍스트가 칸을 넘쳐 탭 줄이 어긋나 보였다.
 * jsdom 은 실제 레이아웃을 계산하지 않으므로 폭 대신 규칙(클래스)을 고정한다.
 */
describe('CertTabs', () => {
  it('탭은 균등 분할하되 글자보다 좁아지지 않는다', () => {
    render(<CertTabs active="summary" onChange={() => {}} />)
    const tab = screen.getByRole('button', { name: '종합 요약' })
    expect(tab.className).toContain('flex-1')
    expect(tab.className).toContain('min-w-fit')
    expect(tab.className).toContain('whitespace-nowrap')
  })

  it('다 담지 못할 만큼 좁아지면 탭바가 가로로 스크롤된다', () => {
    render(<CertTabs active="summary" onChange={() => {}} />)
    const bar = screen.getByRole('button', { name: '종합 요약' }).parentElement
    expect(bar?.className).toContain('overflow-x-auto')
  })

  it('only 로 좁히면 지정한 탭만 노출한다', () => {
    render(
      <CertTabs active="summary" onChange={() => {}} only={['summary', 'tech']} />,
    )
    expect(screen.getByRole('button', { name: '종합 요약' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '기술·검증' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이력서' })).toBeNull()
  })

  it('탭을 누르면 해당 키로 onChange 를 부른다', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CertTabs active="summary" onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: '프로젝트' }))
    expect(onChange).toHaveBeenCalledWith('projects')
  })
})
