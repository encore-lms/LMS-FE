import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CaseStarSection } from './CaseStarSection'

// 상황·해결·결과는 마크다운으로 쓴다. 예전에는 폼이 'Markdown 지원'이라고 안내만 하고
// 평문 textarea 를 뒀고, 상세도 원문을 그대로 찍어 문법이 글자로 보였다.

function renderSection(star: Record<string, string> = {}) {
  const setStar = vi.fn()
  render(
    <CaseStarSection
      star={{ situation: '', resolution: '', result: '', ...star }}
      setStar={setStar}
    />,
  )
  return { setStar }
}

describe('CaseStarSection (상황·해결·결과)', () => {
  it('세 항목 모두 작성·미리보기를 갖춘 편집기로 받는다', () => {
    renderSection()
    expect(screen.getAllByRole('button', { name: '작성' })).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: '미리보기' })).toHaveLength(3)
  })

  it('미리보기는 마크다운을 렌더한다', async () => {
    const user = userEvent.setup()
    renderSection({ situation: '## 장애 상황\n\n`timeout` 이 났다' })
    await user.click(screen.getAllByRole('button', { name: '미리보기' })[0])
    expect(
      screen.getByRole('heading', { name: '장애 상황' }),
    ).toBeInTheDocument()
    // 인라인 코드가 백틱째로 보이면 안 된다.
    expect(screen.getByText('timeout').tagName).toBe('CODE')
  })

  it('작성한 값은 그대로 올라간다', async () => {
    const user = userEvent.setup()
    const { setStar } = renderSection()
    await user.type(screen.getAllByRole('textbox')[0], '요약')
    expect(setStar).toHaveBeenCalled()
  })
})
