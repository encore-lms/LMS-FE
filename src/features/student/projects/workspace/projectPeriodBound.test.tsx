import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarTab } from './tabs/CalendarTab'
import type { WorkspaceData } from '../types'

// 일정 쓰기 훅은 useQueryClient에 의존한다 — 기간 표시만 보는 테스트라 대체한다.
vi.mock('../../api/projects', () => ({
  useAddSchedule: () => ({ mutate: vi.fn(), isPending: false }),
  useEditSchedule: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteSchedule: () => ({ mutate: vi.fn(), isPending: false }),
  wsWriteError: (_e: unknown, f: string) => f,
}))
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    danger: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    show: vi.fn(),
  }),
}))

const base = {
  id: 'p1',
  title: '프로젝트',
  status: 'draft',
  startDate: '2026-08-10',
  endDate: '2026-08-20',
  calMonth: '2026-08',
  calEvents: [],
  columns: [],
  upcoming: [],
} as unknown as WorkspaceData

/** 달력 칸 — 날짜 숫자를 가진 셀 컨테이너를 찾는다. */
function dayCell(day: string): HTMLElement {
  const label = screen.getAllByText(day).find((el) => el.tagName === 'SPAN')!
  return label.parentElement as HTMLElement
}

describe('캘린더 프로젝트 기간 표시', () => {
  // 기간 밖 날짜에 일정을 넣으면 이 프로젝트의 기록이 아닌 것이 섞인다.
  it('기간 밖 날짜는 흐리게 두고 클릭을 받지 않는다', () => {
    render(<CalendarTab d={base} />)

    const outside = dayCell('5')
    expect(outside.className).toContain('opacity-45')
    expect(outside).not.toHaveAttribute('role', 'button')
  })

  it('기간 안 날짜는 그대로 두고 클릭할 수 있다', () => {
    render(<CalendarTab d={base} />)

    const inside = dayCell('12')
    expect(inside.className).not.toContain('opacity-45')
    expect(inside).toHaveAttribute('role', 'button')
  })

  // 기간이 없는 옛 프로젝트까지 잠그면 일정을 아예 넣을 수 없다.
  it('기간이 없으면 모든 날짜를 연다', () => {
    render(
      <CalendarTab
        d={{ ...base, startDate: null, endDate: null } as WorkspaceData}
      />,
    )

    expect(dayCell('5').className).not.toContain('opacity-45')
  })
})
