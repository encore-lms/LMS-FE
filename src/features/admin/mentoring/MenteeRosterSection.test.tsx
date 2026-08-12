import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenteeRosterSection } from './MenteeRosterSection'
import type { AdminMentoringStudentOption } from './types'

const member = (name: string): AdminMentoringStudentOption =>
  ({ userId: `u-${name}`, name }) as AdminMentoringStudentOption

describe('멘티 명단', () => {
  // 추가만 있고 빼는 길이 없어, 잘못 넣은 멘티를 정리하려면 팀을 지워야 했다(2026-08-05 QA).
  it('제외 버튼으로 멘티를 지목한다', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(
      <MenteeRosterSection
        members={[member('이장우'), member('박수진')]}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    )

    await user.click(screen.getByRole('button', { name: '박수진 멘티 제외' }))

    expect(onRemove).toHaveBeenCalledWith(
      expect.objectContaining({ name: '박수진' }),
    )
  })

  // 마지막 1명까지 빼면 팀이 빈 채로 남는다 — 배정 삭제로 정리해야 한다.
  it('마지막 한 명은 제외 버튼이 잠긴다', () => {
    render(
      <MenteeRosterSection
        members={[member('이장우')]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: '이장우 멘티 제외' })).toBeDisabled()
  })

  it('제외 핸들러가 없으면 버튼도 없다', () => {
    render(
      <MenteeRosterSection members={[member('이장우')]} onAdd={vi.fn()} />,
    )

    expect(screen.queryByRole('button', { name: /멘티 제외/ })).toBeNull()
  })
})
