import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MentoringTabs } from './MentoringTabs'

// 멘토링 서브탭 — 배정·일지·일지 템플릿·통계 진입 링크 + 현재 경로 active.

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MentoringTabs />
    </MemoryRouter>,
  )
}

const active = (name: string) =>
  screen.getByRole('link', { name }).getAttribute('aria-current') === 'page'

describe('MentoringTabs', () => {
  it('배정·일지·일지 템플릿·통계 4개 진입 링크를 렌더한다', () => {
    renderAt('/admin/mentoring/logs')
    expect(screen.getByRole('link', { name: '배정' })).toHaveAttribute(
      'href',
      '/admin/mentors/assignments',
    )
    expect(screen.getByRole('link', { name: '일지' })).toHaveAttribute(
      'href',
      '/admin/mentoring/logs',
    )
    expect(screen.getByRole('link', { name: '일지 템플릿' })).toHaveAttribute(
      'href',
      '/admin/mentoring/log-templates',
    )
    expect(screen.getByRole('link', { name: '통계' })).toHaveAttribute(
      'href',
      '/admin/mentoring/statistics',
    )
  })

  it('일지 경로에서 일지 탭만 활성', () => {
    renderAt('/admin/mentoring/logs')
    expect(active('일지')).toBe(true)
    expect(active('배정')).toBe(false)
  })

  it('통계 경로에서 통계 탭 활성', () => {
    renderAt('/admin/mentoring/statistics')
    expect(active('통계')).toBe(true)
  })
})
