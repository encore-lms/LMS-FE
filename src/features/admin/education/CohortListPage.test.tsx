import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CohortListPage from './CohortListPage'
import { useCourseList } from '../api/settings'
import { useAllCourseCohorts, type AdminCohortRow } from './cohortRows'

vi.mock('../api/settings')
vi.mock('./cohortRows')

// 담당 과정/기수 목록 — 기수를 골라 허브로 들어가고, 설정은 여기서 바로 진입한다.

function row(over: Partial<AdminCohortRow> = {}): AdminCohortRow {
  return {
    cohortId: 'c-32',
    courseId: 'course-sk',
    courseTitle: 'SK네트웍스 Family AI 캠프',
    cohortNo: '32',
    cohortLabel: '32기',
    startDate: '2026-04-28',
    endDate: '2026-10-26',
    hrdTrprId: 'AIG2026-0001',
    status: 'ongoing',
    dDayLabel: 'D-88',
    ...over,
  }
}

/** KPI 카드 힌트에도 같은 과정명이 나와, 검증은 표 안으로 범위를 좁힌다. */
function table() {
  return within(screen.getByRole('table'))
}

function renderList(rows: AdminCohortRow[] = [row()]) {
  vi.mocked(useCourseList).mockReturnValue({
    data: [{ courseId: 'course-sk', title: 'SK네트웍스 Family AI 캠프' }],
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCourseList>)
  vi.mocked(useAllCourseCohorts).mockReturnValue({
    rows,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  })
  return render(
    <MemoryRouter initialEntries={['/admin/education']}>
      <Routes>
        <Route path="/admin/education" element={<CohortListPage />} />
        <Route path="/admin/education/:cohortId" element={<div>허브</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CohortListPage (담당 과정/기수)', () => {
  it('진행 중 기수를 표로 보여준다', () => {
    renderList()
    expect(
      table().getByText('SK네트웍스 Family AI 캠프 32기'),
    ).toBeInTheDocument()
    expect(table().getByText('D-88')).toBeInTheDocument()
  })

  it('행을 누르면 그 기수 허브로 들어간다', async () => {
    const user = userEvent.setup()
    renderList()
    await user.click(table().getByText('SK네트웍스 Family AI 캠프 32기'))
    expect(await screen.findByText('허브')).toBeInTheDocument()
  })

  // 설정을 허브 탭에 두면 기수를 고른 뒤 한 번 더 찾아야 한다 — 목록에서 바로 간다.
  it('설정 버튼은 행 클릭을 가로채고 설정 탭으로 보낸다', async () => {
    const user = userEvent.setup()
    renderList()
    await user.click(screen.getByRole('button', { name: '설정' }))
    expect(await screen.findByText('허브')).toBeInTheDocument()
  })

  it('상태 탭은 해당 상태만 남긴다', async () => {
    const user = userEvent.setup()
    renderList([
      row(),
      row({ cohortId: 'c-30', cohortLabel: '30기', status: 'ended' }),
    ])
    expect(table().getByText(/32기/)).toBeInTheDocument()
    expect(table().queryByText(/30기/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /종료 \(1\)/ }))
    expect(await table().findByText(/30기/)).toBeInTheDocument()
  })

  it('검색어로 걸러낸다', async () => {
    const user = userEvent.setup()
    renderList([
      row(),
      row({ cohortId: 'c-31', cohortLabel: '31기', courseTitle: '데이터 분석' }),
    ])
    await user.type(screen.getByLabelText(/검색/), '데이터')
    expect(await table().findByText(/데이터 분석 31기/)).toBeInTheDocument()
    expect(table().queryByText(/Family AI 캠프 32기/)).not.toBeInTheDocument()
  })
})
