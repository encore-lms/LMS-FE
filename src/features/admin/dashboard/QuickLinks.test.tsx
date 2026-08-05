import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QuickLinks } from './QuickLinks'

// 운영 대시보드 바로가기 — 기수 허브 탭으로 옮긴 화면은 목적지가 아니다.

const STORAGE_KEY = 'admin-quick-links'

function renderLinks() {
  return render(
    <MemoryRouter>
      <QuickLinks />
    </MemoryRouter>,
  )
}

describe('QuickLinks', () => {
  beforeEach(() => localStorage.clear())

  // 기수를 고른 뒤에 하는 일이라, 기수 없는 단독 화면으로 보내면 들어가서 또 골라야 한다.
  it('허브 탭으로 옮긴 화면은 기본 바로가기에 없다', () => {
    renderLinks()
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
    expect(hrefs).not.toContain('/admin/students')
    expect(hrefs).not.toContain('/admin/mentors/assignments')
    expect(hrefs).toContain('/admin/education')
  })

  // 이미 저장해 둔 매니저의 바로가기가 통째로 사라지면 안 된다 — 허브 목록으로 데려간다.
  it('저장된 낡은 경로는 과정 목록으로 치환한다', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(['/admin/mentors/assignments', '/admin/mileage']),
    )
    renderLinks()
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/admin/education')
    expect(hrefs).toContain('/admin/mileage')
    expect(hrefs).not.toContain('/admin/mentors/assignments')
  })

  // 옮긴 경로만 남아 있던 설정도 빈 화면이 되면 안 된다.
  it('치환 결과가 중복이면 하나만 남긴다', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(['/admin/students', '/admin/quizzes', '/admin/education']),
    )
    renderLinks()
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .filter((h) => h === '/admin/education')
    expect(hrefs).toHaveLength(1)
  })
})
