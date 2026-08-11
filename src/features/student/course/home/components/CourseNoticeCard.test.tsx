import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { CourseNotice } from '../../types'
import { CourseNoticeCard } from './CourseNoticeCard'

const notices: CourseNotice[] = [
  {
    id: 'n-1',
    tone: 'urgent',
    tagLabel: '고정',
    title: '[출결] 8월 출결 인정 기준',
    timeAgo: '22시간 전',
  },
  {
    id: 'n-2',
    tone: 'normal',
    tagLabel: '강사',
    title: '[안내] 멘토링 프로그램 신청',
    timeAgo: '1일 전',
  },
]

describe('CourseNoticeCard', () => {
  it('행은 공지 상세로, 전체 보기는 공지 탭으로 간다', () => {
    render(
      <MemoryRouter>
        <CourseNoticeCard notices={notices} />
      </MemoryRouter>,
    )

    // 홈 위젯은 최근 5건 요약이라, 눌렀을 때 갈 곳이 없으면 막다른 카드가 된다.
    expect(
      screen.getByRole('link', { name: /\[출결\] 8월 출결 인정 기준/ }),
    ).toHaveAttribute('href', '/student/course/notices/n-1')
    expect(
      screen.getByRole('link', { name: /\[안내\] 멘토링 프로그램 신청/ }),
    ).toHaveAttribute('href', '/student/course/notices/n-2')
    expect(screen.getByRole('link', { name: /전체 보기/ })).toHaveAttribute(
      'href',
      '/student/course/notices',
    )
  })
})
