import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/components/ui/Toast'
import { SettingsPane } from './SettingsPane'
import { useCourseDetail } from './api'
import {
  useCourseConfig,
  useHrdKeyList,
  useUpdateCohortSettings,
} from '../api/settings'
import type { CourseDetail } from './types'

vi.mock('./api')
vi.mock('../api/settings')
vi.mock('./CurriculumModal', () => ({
  CurriculumModal: ({ open }: { open: boolean }) =>
    open ? <div>커리큘럼 모달</div> : null,
}))

// 과정 설정 탭 — 과정 정보 + 기능 설정(마일리지·PLAY·커리큘럼).

const mutateAsync = vi.fn().mockResolvedValue({})

const detail: CourseDetail = {
  title: 'SK네트웍스 Family AI 캠프 32기',
  trainingType: 'K-디지털트레이닝',
  ncsName: '인공지능모델링',
  institution: '플레이데이터평생교육원',
  address: '서울특별시 서초구 효령로 335',
  supportAmount: '17,424,000원',
  manager: '권현주 (02-754-7302)',
  trainingDays: '120',
  trainingHours: '960',
  trainingStart: '2026.04.28',
  trainingEnd: '2026.10.26',
}

/** 활성 HRD 키 2개 — 기수가 그중 하나를 고를 수 있다. */
const HRD_KEYS = [
  { id: 'key-a', name: '플레이데이터 본원', maskedKey: 'abcd****1234', active: true },
  { id: 'key-b', name: '서초 캠퍼스', maskedKey: 'efgh****5678', active: true },
]

function renderPane(
  over: Partial<CourseDetail> = {},
  cohortOver: Record<string, unknown> = {},
) {
  vi.mocked(useCourseDetail).mockReturnValue({
    data: { ...detail, ...over },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCourseDetail>)
  vi.mocked(useCourseConfig).mockReturnValue({
    data: {
      cohorts: [
        {
          id: 'cohort-32',
          cohortNo: '32',
          mileageEnabled: true,
          playEnabled: false,
          ...cohortOver,
        },
      ],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCourseConfig>)
  vi.mocked(useHrdKeyList).mockReturnValue({
    data: { items: HRD_KEYS, total: HRD_KEYS.length },
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useHrdKeyList>)
  vi.mocked(useUpdateCohortSettings).mockReturnValue({
    mutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateCohortSettings>)
  return render(
    <ToastProvider>
      <SettingsPane courseId="course-sk" cohortId="cohort-32" />
    </ToastProvider>,
  )
}

describe('SettingsPane (과정 설정)', () => {
  // 훈련기간이 '~ (총 120일 / 960시간)' 처럼 날짜 없이 물결표만 나오던 것을 고쳤다.
  it('훈련기간에 시작·종료일과 총 일수를 함께 보여준다', () => {
    renderPane()
    expect(
      screen.getByText('2026.04.28 ~ 2026.10.26 (총 120일 / 960시간)'),
    ).toBeInTheDocument()
  })

  it('날짜가 없으면 총 일수만 보여준다', () => {
    renderPane({ trainingStart: '', trainingEnd: '' })
    expect(screen.getByText('총 120일 / 960시간')).toBeInTheDocument()
  })

  it('저장된 값 그대로 스위치와 활성 라벨을 그린다', () => {
    renderPane()
    expect(screen.getByRole('switch', { name: '마일리지 사용' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('switch', { name: 'PLAY 사용' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByText('활성화')).toBeInTheDocument()
    expect(screen.getByText('비활성')).toBeInTheDocument()
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
      // 키를 고르지 않았으면 지정 해제로 보낸다 — 활성 최신 키를 쓴다는 뜻.
      hrdKeyId: null,
    })
  })

  it('커리큘럼 설정은 모달을 연다', async () => {
    const user = userEvent.setup()
    renderPane()
    await user.click(screen.getByRole('button', { name: /커리큘럼 설정/ }))
    expect(screen.getByText('커리큘럼 모달')).toBeInTheDocument()
  })

  // HRD 호출이 '활성 키 중 최신'을 암묵적으로 고르던 것을 기수마다 정할 수 있게 했다(2026-08-05).
  it('기수가 쓸 HRD 키를 고르면 저장에 함께 실린다', async () => {
    const user = userEvent.setup()
    renderPane()

    await user.click(screen.getByLabelText('HRD API Key'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: /서초 캠퍼스/,
      }),
    )
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ hrdKeyId: 'key-b' }),
      ),
    )
  })

  // 고르지 않으면 종전대로 활성 최신 키를 쓴다.
  it('기본값으로 되돌리면 지정을 비워 보낸다', async () => {
    const user = userEvent.setup()
    renderPane({}, { hrdKeyId: 'key-a' })

    await user.click(screen.getByLabelText('HRD API Key'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: /활성 키 중 최신/,
      }),
    )
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ hrdKeyId: null }),
      ),
    )
  })
})
