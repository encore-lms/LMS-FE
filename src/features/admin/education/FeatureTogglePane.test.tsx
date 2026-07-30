import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/Toast'
import { FeatureTogglePane } from './FeatureTogglePane'
import { useCourseConfig, useUpdateCohortSettings } from '../api/settings'

vi.mock('../api/settings')

// 기수 기능 사용 여부 — 운영 설정의 '교육 과정 설정' 토글을 기수 허브로 옮겨 온 것.
// 끄는 순간 수강생 메뉴에서 항목이 사라지므로 [저장]까지 기다린다.

const mutateAsync = vi.fn().mockResolvedValue({})

function renderPane(over: { mileageEnabled?: boolean; playEnabled?: boolean } = {}) {
  vi.mocked(useCourseConfig).mockReturnValue({
    data: {
      title: 'SK네트웍스 Family AI 캠프',
      cohorts: [
        {
          id: 'cohort-32',
          cohortNo: '32',
          mileageEnabled: over.mileageEnabled ?? true,
          playEnabled: over.playEnabled ?? false,
        },
      ],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCourseConfig>)
  vi.mocked(useUpdateCohortSettings).mockReturnValue({
    mutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateCohortSettings>)
  return render(
    <ToastProvider>
      <FeatureTogglePane courseId="course-sk" cohortId="cohort-32" />
    </ToastProvider>,
  )
}

describe('FeatureTogglePane (기능 사용 여부)', () => {
  it('저장된 값 그대로 스위치를 그린다', () => {
    renderPane()
    expect(screen.getByRole('switch', { name: '마일리지 사용' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('switch', { name: 'PLAY 사용' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  // 토글 즉시 저장하면 잘못 누른 것을 되돌릴 틈이 없다.
  it('토글만으로는 저장하지 않고 저장 버튼이 나타난다', async () => {
    const user = userEvent.setup()
    renderPane()
    expect(screen.queryByRole('button', { name: '저장' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: 'PLAY 사용' }))
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.getByText('변경됨')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('저장은 바뀐 값과 그대로인 값을 함께 보낸다', async () => {
    const user = userEvent.setup()
    renderPane()
    await user.click(screen.getByRole('switch', { name: 'PLAY 사용' }))
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(mutateAsync).toHaveBeenCalledWith({
      courseId: 'course-sk',
      cohortId: 'cohort-32',
      mileageEnabled: true,
      playEnabled: true,
    })
  })

  it('되돌리기는 저장된 값으로 복귀한다', async () => {
    const user = userEvent.setup()
    renderPane()
    await user.click(screen.getByRole('switch', { name: '마일리지 사용' }))
    await user.click(screen.getByRole('button', { name: '되돌리기' }))
    expect(screen.getByRole('switch', { name: '마일리지 사용' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.queryByRole('button', { name: '저장' })).not.toBeInTheDocument()
  })
})
