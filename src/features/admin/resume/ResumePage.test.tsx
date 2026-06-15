import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ResumePage from './ResumePage'

// 이력서 관리 — 상위 탭(이력서 현황/피드백 관리) + 상태 필터. 데이터는 ./mocks 상수(직접 사용, api 훅 없음).

function renderPage() {
  return render(
    <MemoryRouter>
      <ResumePage />
    </MemoryRouter>,
  )
}

describe('ResumePage (이력서 관리)', () => {
  it('이력서 현황 탭 — KPI와 로스터를 렌더한다', () => {
    renderPage()
    expect(screen.getByText('전체 수강생')).toBeInTheDocument()
    expect(screen.getByText('23명')).toBeInTheDocument()
    expect(screen.getByText('김재홍')).toBeInTheDocument()
  })

  it('피드백 관리 탭 — 전환 시 피드백 목록을 렌더한다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '피드백 관리' }))
    expect(screen.getByText('전체 피드백')).toBeInTheDocument()
    // 피드백 카테고리(자기소개서)는 피드백 뷰에서만 노출
    expect(screen.getByText('자기소개서')).toBeInTheDocument()
  })

  it('상태 필터 — 미작성만 보면 작성 중 수강생이 사라진다', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '미작성' }))
    expect(screen.getByText('김은진')).toBeInTheDocument()
    expect(screen.queryByText('김재홍')).toBeNull()
  })
})
