import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import {
  useSearchParamArrayState,
  useSearchParamState,
} from './useSearchParamState'

function Probe() {
  const [tab, setTab] = useSearchParamState('tab', 'all')
  const location = useLocation()
  return (
    <div>
      <span data-testid="tab">{tab}</span>
      <span data-testid="search">{location.search}</span>
      <button onClick={() => setTab('reviewing')}>reviewing</button>
      <button onClick={() => setTab('all')}>all</button>
    </div>
  )
}

describe('useSearchParamState', () => {
  it('기본값은 URL 파라미터 없이 반환된다', () => {
    render(
      <MemoryRouter initialEntries={['/x']}>
        <Probe />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('tab')).toHaveTextContent('all')
    expect(screen.getByTestId('search')).toHaveTextContent('')
  })

  it('초기 URL 파라미터를 읽는다', () => {
    render(
      <MemoryRouter initialEntries={['/x?tab=certified']}>
        <Probe />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('tab')).toHaveTextContent('certified')
  })

  it('값 변경은 화면에 즉시, URL에는 곧이어 반영된다', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/x']}>
        <Probe />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'reviewing' }))
    // 화면 값은 즉시 — URL 왕복을 기다리면 IME 조합이 끊긴다.
    expect(screen.getByTestId('tab')).toHaveTextContent('reviewing')
    await waitFor(() =>
      expect(screen.getByTestId('search')).toHaveTextContent('?tab=reviewing'),
    )

    await user.click(screen.getByRole('button', { name: 'all' }))
    expect(screen.getByTestId('tab')).toHaveTextContent('all')
    await waitFor(() =>
      expect(screen.getByTestId('search')).toHaveTextContent(''),
    )
  })

  // Windows IME 는 조합 중에도 입력 이벤트를 보낸다. URL 을 그대로 value 로 쓰면
  // 매 글자 라우터가 다시 그리며 조합을 끊어 '이장우'가 'ㅇ이잊자장ㅇ우우'로 찍혔다.
  it('연속 입력 중에도 화면 값이 마지막 입력을 그대로 유지한다', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/x']}>
        <SearchProbe />
      </MemoryRouter>,
    )
    const input = screen.getByRole('textbox')
    await user.type(input, '이장우')

    // 입력한 그대로 남아 있어야 한다(중간 URL 값으로 덮이면 글자가 깨진다).
    expect(input).toHaveValue('이장우')
    await waitFor(() =>
      expect(screen.getByTestId('search')).toHaveTextContent('q=%EC%9D%B4%EC%9E%A5%EC%9A%B0'),
    )
  })
})

function SearchProbe() {
  const [q, setQ] = useSearchParamState('q')
  const location = useLocation()
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} />
      <span data-testid="search">{location.search}</span>
    </div>
  )
}

function ArrayProbe() {
  const [cats, setCats] = useSearchParamArrayState('cat')
  const location = useLocation()
  return (
    <div>
      <span data-testid="cats">{cats.join('|')}</span>
      <span data-testid="search">{location.search}</span>
      <button onClick={() => setCats([...cats, 'a'])}>add-a</button>
      <button onClick={() => setCats([...cats, 'b'])}>add-b</button>
      <button onClick={() => setCats([])}>clear</button>
    </div>
  )
}

describe('useSearchParamArrayState', () => {
  it('쉼표 직렬화로 다중 값을 URL에 담고, 빈 배열이면 파라미터를 제거한다', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/x?cat=a,b']}>
        <ArrayProbe />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('cats')).toHaveTextContent('a|b')

    await user.click(screen.getByRole('button', { name: 'clear' }))
    expect(screen.getByTestId('cats')).toHaveTextContent('')
    expect(screen.getByTestId('search')).toHaveTextContent('')

    await user.click(screen.getByRole('button', { name: 'add-a' }))
    expect(screen.getByTestId('search')).toHaveTextContent('?cat=a')
  })
})
