import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('값 변경은 URL에 반영되고, 기본값이면 파라미터를 제거한다', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/x']}>
        <Probe />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'reviewing' }))
    expect(screen.getByTestId('tab')).toHaveTextContent('reviewing')
    expect(screen.getByTestId('search')).toHaveTextContent('?tab=reviewing')

    await user.click(screen.getByRole('button', { name: 'all' }))
    expect(screen.getByTestId('tab')).toHaveTextContent('all')
    expect(screen.getByTestId('search')).toHaveTextContent('')
  })
})

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
