import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CohortListPage from './CohortListPage'
import { useAdminCohorts, type AdminCohortRow } from './cohortRows'

vi.mock('./cohortRows')

// 담당 과정/기수 목록 — 기수를 골라 허브로 들어가고, 설정은 여기서 바로 진입한다.
// 표는 강사 목록과 같은 컬럼을 쓰고, 세 번째 칸만 담당 강사로 다르다.

function row(over: Partial<AdminCohortRow> = {}): AdminCohortRow {
  return {
    id: 'c-32',
    courseId: 'course-sk',
    name: 'SK네트웍스 Family AI 캠프 32기',
    subtitle: 'SK네트웍스 Family AI 캠프 · 32회차',
    period: '2026.04.28 ~ 2026.10.26',
    dday: 'D-88',
    instructors: ['김강사'],
    hrdTrprId: 'AIG2026-0001',
    students: 22,
    evalSummary: '미응시 3 · 제출 18',
    evalPending: '채점 대기 2',
    reviewSummary: '기록 4 · 프로젝트 1 · 트러블 0',
    reviewPending: '대기 5건',
    status: 'operating',
    ...over,
  }
}

/** KPI 카드 힌트에도 같은 문구가 나와, 검증은 표 안으로 범위를 좁힌다. */
function table() {
  return within(screen.getByRole('table'))
}

function renderList(rows: AdminCohortRow[] = [row()]) {
  vi.mocked(useAdminCohorts).mockReturnValue({
    data: {
      total: rows.length,
      operating: rows.filter((r) => r.status === 'operating').length,
      upcoming: rows.filter((r) => r.status === 'upcoming').length,
      ended: rows.filter((r) => r.status === 'ended').length,
      summary: {
        operatingCourses: { value: 1, hint: '등록 과정 1개' },
        students: { value: 22, hint: '전체 기수 합계' },
        gradingPending: { value: 2, hint: '수동 채점 2건' },
        reviewPending: { value: 5, hint: '검토 대기 5건' },
      },
      rows,
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAdminCohorts>)
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
  it('진행 중 기수를 강사와 같은 컬럼으로 보여준다', () => {
    renderList()
    expect(
      table().getByText('SK네트웍스 Family AI 캠프 32기'),
    ).toBeInTheDocument()
    expect(table().getByText('D-88')).toBeInTheDocument()
    expect(table().getByText('22명')).toBeInTheDocument()
    expect(table().getByText('미응시 3 · 제출 18')).toBeInTheDocument()
    expect(table().getByText('대기 5건')).toBeInTheDocument()
  })

  // 매니저는 자기 역할이 아니라 누가 맡은 기수인지를 봐야 한다.
  it('강사 화면의 역할 배지 자리에 담당 강사 이름이 온다', () => {
    renderList([row({ instructors: ['김강사', '이멘토'] })])
    expect(
      screen.getByRole('columnheader', { name: '담당 강사' }),
    ).toBeInTheDocument()
    expect(table().getByText('김강사, 이멘토')).toBeInTheDocument()
  })

  it('배정된 강사가 없으면 - 로 둔다', () => {
    renderList([row({ instructors: [] })])
    expect(table().getByText('-')).toBeInTheDocument()
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
      row({
        id: 'c-30',
        name: 'SK네트웍스 Family AI 캠프 30기',
        status: 'ended',
      }),
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
      row({
        id: 'c-31',
        name: '데이터 분석 31기',
        subtitle: '데이터 분석 · 31회차',
      }),
    ])
    await user.type(screen.getByLabelText(/검색/), '데이터')
    expect(await table().findByText(/데이터 분석 31기/)).toBeInTheDocument()
    expect(table().queryByText(/Family AI 캠프 32기/)).not.toBeInTheDocument()
  })
})
