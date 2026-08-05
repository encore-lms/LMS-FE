import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import StudentHistoryPage from './StudentHistoryPage'
import { useStudentMileageHistory } from './api'
import type { StudentMileageHistory } from './types'

vi.mock('./api')

// 수강생 마일리지 이력 — 원장 '상세'에서 한 사람의 지급·차감 흐름을 본다.

const history: StudentMileageHistory = {
  studentUserId: 'u-1',
  studentName: '이장우',
  cohortLabel: 'AI 캠프 30기',
  balance: '7,000M',
  totalEarned: '10,000M',
  totalSpent: '3,000M',
  summary: {
    granted: '+10,000M',
    grantedHint: '누적 지급',
    deducted: '-3,000M',
    deductedHint: '누적 차감',
    net: '7,000M',
    netHint: '순 발행',
    count: 2,
    countHint: '전체 거래',
  },
  rows: [
    {
      id: 'tx-2',
      date: '08-05 11:08',
      studentName: '이장우',
      reason: '문화상품권 구매',
      amount: '-3,000M',
      amountSign: 'minus',
      txType: 'deduct',
      balance: '7,000M',
      handler: '시스템',
      handlerNote: '구매 요청 → 차감',
      pending: true,
    },
    {
      id: 'tx-1',
      date: '08-01 09:00',
      studentName: '이장우',
      reason: '이벤트 지급',
      amount: '+10,000M',
      amountSign: 'plus',
      txType: 'grant',
      balance: '10,000M',
      handler: '박매니저',
      handlerNote: '직접 지급',
    },
  ],
}

function renderPage(over: Partial<StudentMileageHistory> = {}) {
  vi.mocked(useStudentMileageHistory).mockReturnValue({
    data: { ...history, ...over },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useStudentMileageHistory>)
  return render(
    <MemoryRouter initialEntries={['/admin/mileage/history/students/u-1']}>
      <Routes>
        <Route
          path="/admin/mileage/history/students/:studentUserId"
          element={<StudentHistoryPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StudentHistoryPage (수강생 마일리지 이력)', () => {
  it('수강생 정보·누적 KPI·거래 행을 렌더한다', () => {
    renderPage()
    expect(screen.getByText('이장우')).toBeInTheDocument()
    expect(screen.getByText('AI 캠프 30기')).toBeInTheDocument()
    expect(screen.getByText('누적 지급')).toBeInTheDocument()
    expect(screen.getByText('3,000M')).toBeInTheDocument()
    expect(screen.getByText('이벤트 지급')).toBeInTheDocument()
    expect(screen.getByText('총 2건')).toBeInTheDocument()
  })

  // 요청 즉시 차감이라 승인 전에도 원장에 남는다 — 확정 차감과 구분해야 한다(2026-08-05 QA).
  it('승인 전 구매는 승인 검토로 표시한다', () => {
    renderPage()
    expect(screen.getByText('승인 검토')).toBeInTheDocument()
    expect(screen.getByText('지급')).toBeInTheDocument()
  })

  it('거래가 없으면 빈 안내를 보여준다', () => {
    renderPage({ rows: [] })
    expect(screen.getByText('아직 거래가 없어요')).toBeInTheDocument()
  })
})
