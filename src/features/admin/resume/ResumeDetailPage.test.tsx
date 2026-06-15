import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ResumeDetailPage from './ResumeDetailPage'

// 이력서 상세·검토 — RESUME_DETAIL(단일 샘플) 기반. 목록으로 복귀 내비게이션 포함.

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/admin/resume/우석현']}>
      <Routes>
        <Route path="/admin/resume/:resumeId" element={<ResumeDetailPage />} />
        <Route path="/admin/resume" element={<div>이력서 목록 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResumeDetailPage (이력서 상세·검토)', () => {
  it('이력서 본문·완성도·피드백 이력을 렌더한다', () => {
    renderDetail()
    expect(screen.getByText('완성도 73%')).toBeInTheDocument()
    // 경력 항목·이메일은 본문에 1회만 — 섹션 제목(경력사항 등)은 우측 현황과 중복이라 회피
    expect(screen.getByText('밸류링크유')).toBeInTheDocument()
    expect(screen.getByText('hyun97secret@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('피드백 이력 (2건)')).toBeInTheDocument()
  })

  it('목록으로 — 이력서 관리 목록으로 이동한다', async () => {
    renderDetail()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '목록으로' }))
    expect(screen.getByText('이력서 목록 화면')).toBeInTheDocument()
  })
})
