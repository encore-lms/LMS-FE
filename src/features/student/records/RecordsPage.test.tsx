import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import RecordsPage from './RecordsPage'
import { useDeleteRecord, useRecordsOverview } from '../api/records'
import type { BlogRecord, RecordsOverview } from './types'

// 교육과정 허브 탭바(2026-08-05) — 페이지 본문 테스트에 집중하도록 껍데기만 둔다.
vi.mock('../course/CourseTabs', () => ({ CourseTabs: () => null }))

vi.mock('../api/records')

const blogRecord: BlogRecord = {
  id: 'blog-1',
  category: 'blog',
  weekLabel: '10주차',
  dateRange: '5/6 ~ 5/12',
  status: 'approved',
  statusLabel: '승인',
  title: '회고 블로그',
  url: 'https://blog.example.com/student/retrospective',
  instructor: '강사 이정훈',
  submittedAt: '2026.05.10 제출',
  statusAt: '2026.05.12 승인',
  canEdit: false,
  canDelete: false,
}

const overview: RecordsOverview = {
  tabs: [
    { key: 'all', label: '전체', count: 3 },
    { key: 'blog', label: '블로그', count: 1 },
    { key: 'study', label: '스터디', count: 1 },
    { key: 'cert', label: '자격증', count: 1 },
  ],
  stats: [
    {
      key: 'total',
      label: '전체 기록',
      value: '3',
      unit: '건',
      sub: '블로그 1 · 스터디 1 · 자격증 1',
      dotTone: 'brand',
    },
  ],
  banner: {
    title: '10주차 블로그 제출',
    sub: '제출 후 승인 전까지 변경 불가',
    actionLabel: '블로그 제출',
  },
  listTitle: '블로그 기록',
  listCount: 1,
  records: [
    blogRecord,
    {
      ...blogRecord,
      id: 'study-1',
      category: 'study',
      title: '알고리즘 스터디',
      url: '',
    },
    {
      ...blogRecord,
      id: 'cert-1',
      category: 'cert',
      title: 'SQLD 자격증',
      url: '',
    },
  ],
  shownLabel: '3건 중 1건 표시',
}

function renderPage(data: RecordsOverview = overview) {
  vi.mocked(useRecordsOverview).mockReturnValue({
    data,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useRecordsOverview>)
  vi.mocked(useDeleteRecord).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteRecord>)

  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/student/records']}>
        <Routes>
          <Route path="/student/records" element={<RecordsPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('RecordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('카테고리 탭에서 전체 탭을 노출하지 않는다', () => {
    sessionStorage.setItem('lms:records-tab', 'all')

    renderPage()

    expect(
      screen.queryByRole('tab', { name: /전체\s*3/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /블로그\s*1/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /스터디\s*1/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /자격증\s*1/ })).toBeInTheDocument()
    expect(screen.getByText('블로그 기록')).toBeInTheDocument()
  })

  it('블로그 상세는 모달 대신 우측 iframe 패널로 보여준다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('회고 블로그'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '블로그 상세 닫기' }),
    ).toBeInTheDocument()
    expect(screen.getByTitle('회고 블로그 블로그 미리보기')).toHaveAttribute(
      'src',
      'https://blog.example.com/student/retrospective',
    )
    expect(screen.getByRole('link', { name: /새 탭/ })).toHaveAttribute(
      'href',
      'https://blog.example.com/student/retrospective',
    )
  })

  it('블로그 상세 패널은 ESC로 닫히고 iframe 지연 안내를 보여준다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByText('회고 블로그'))

    expect(
      screen.getByText('블로그 미리보기를 불러오는 중입니다.'),
    ).toBeInTheDocument()

    expect(
      await screen.findByText('미리보기가 제한될 수 있습니다.', undefined, {
        timeout: 3500,
      }),
    ).toBeInTheDocument()

    await user.keyboard('{Escape}')

    // 슬라이드 아웃 애니메이션(300ms) 동안 DOM이 유지되므로 언마운트를 기다린다
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: '블로그 상세 닫기' }),
      ).not.toBeInTheDocument(),
    )
    // 스크롤 잠금 해제는 passive effect cleanup이라 DOM 제거보다 늦게 올 수 있다 — 폴링으로 대기
    await waitFor(() => expect(document.body.style.overflow).toBe(''))
  })
})
