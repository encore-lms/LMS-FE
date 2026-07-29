import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import AccountsPage from './AccountsPage'
import HrdApiKeyPage from './HrdApiKeyPage'
import CourseConfigPage from './CourseConfigPage'
import CourseAddPage from './CourseAddPage'
import {
  useOpsAccounts,
  useCreateOpsAccount,
  useUpdateOpsAccountStatus,
  useUpdateOperatorCohorts,
  useResetAccountPassword,
  useHrdKeyList,
  useHrdKeySummary,
  useHrdKeyHistory,
  useCreateHrdKey,
  useUpdateHrdKey,
  useDeleteHrdKey,
  useTestHrdKey,
  useCourseList,
  useCourseConfig,
  useUpdateCohortSettings,
  useCohortMaterials,
  useCreateCohortMaterial,
  useDeleteCohortMaterial,
  useHrdCourseSearch,
  useRegisterCourse,
  useDeleteCourseRegistration,
} from '../api/settings'
import type {
  OpsAccountsData,
  HrdKeyListData,
  HrdKeyHistoryData,
  HrdKeySummary,
  CourseListItem,
  CourseConfigDetail,
  HrdCourseSearchData,
} from '@/shared/types'

vi.mock('../api/settings')

const accounts: OpsAccountsData = {
  summary: {
    managers: 8,
    managersActive: 8,
    managersInactive: 0,
    instructors: 27,
    instructorNoScope: 2,
    mentors: 42,
    mentorNoTeam: 3,
    inactive: 5,
    inactiveRevoked30d: 2,
    total: 77,
  },
  items: [
    {
      id: 'ops-1',
      name: '이정훈',
      email: 'lee@playdata.io',
      role: 'MANAGER',
      scope: '전체 운영 · 모든 과정·기수',
      status: 'active',
      lastLoginAt: '오늘 09:18',
      isSelf: true,
    },
    {
      id: 'ops-4',
      name: '박강사',
      email: 'instructor.park@playdata.io',
      role: 'INSTRUCTOR',
      scope: '담당 범위 없음',
      scopeWarning: '강사는 최소 1개 이상 권장',
      status: 'active',
      lastLoginAt: '05-22 14:31',
      isSelf: false,
    },
  ],
}

const hrdList: HrdKeyListData = {
  items: [
    {
      id: 'key-1',
      name: 'HRD 운영키 2026',
      maskedKey: '****9K2A',
      description: '운영 출결 조회용',
      active: true,
      createdBy: 'user-1',
      updatedBy: 'user-1',
      createdAt: '2026-05-01T10:00:00Z',
      updatedAt: '2026-05-01T10:00:00Z',
    },
    {
      id: 'key-2',
      name: '구 키 2025',
      maskedKey: '****OLDX',
      description: null,
      active: false,
      createdBy: 'user-1',
      updatedBy: 'user-1',
      createdAt: '2025-12-01T09:00:00Z',
      updatedAt: '2025-12-01T09:00:00Z',
    },
  ],
  page: 0,
  size: 6,
  totalElements: 2,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
  sort: 'latest',
}

const hrdSummary: HrdKeySummary = {
  activeKeys: 1,
  lastTest: {
    ok: true,
    latencyMs: 220,
    at: '2026-05-20T10:22:00Z',
    error: null,
  },
  expiring: 0,
  recentFail: 0,
}

const hrdHistory: HrdKeyHistoryData = {
  items: [
    {
      id: 'hist-1',
      at: '2026-05-20T10:22:00Z',
      action: 'test',
      actor: '이정훈',
      ok: true,
      responseMs: 220,
      targetKeyMasked: '****9K2A',
    },
    {
      id: 'hist-2',
      at: '2026-05-12T14:21:00Z',
      action: 'create',
      actor: '김매니저',
      ok: true,
      responseMs: null,
      targetKeyMasked: '****77QA',
    },
  ],
  page: 0,
  size: 8,
  totalElements: 2,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
}

const courses: CourseListItem[] = [
  {
    courseId: 'course-sk',
    title: 'SK네트웍스 Family AI 캠프',
    cohortCount: 2,
    status: 'operating',
    startDate: '2026-06-16',
    endDate: '2027-01-29',
  },
  {
    courseId: 'course-fe',
    title: '프론트엔드 실무 과정',
    cohortCount: 1,
    status: 'ended',
    startDate: '2025-01-10',
    endDate: '2025-06-30',
  },
]

const courseConfig: CourseConfigDetail = {
  courseId: 'course-sk',
  title: 'SK네트웍스 Family AI 캠프',
  status: 'operating',
  startDate: '2026-06-16',
  endDate: '2027-01-29',
  cohorts: [
    {
      id: 'cohort-36',
      cohortNo: '36',
      hrdTrprId: 'AIG20240000459068',
      startDate: '2026-08-06',
      endDate: '2027-01-29',
      status: 'operating',
      mileageEnabled: true,
      playEnabled: true,
    },
    {
      id: 'cohort-35',
      cohortNo: '35',
      hrdTrprId: 'AIG20240000459068',
      startDate: '2026-06-16',
      endDate: '2026-12-08',
      status: 'operating',
      mileageEnabled: true,
      playEnabled: true,
    },
  ],
}

const hrdSearch: HrdCourseSearchData = {
  summary: { total: 128, registrable: 94, registered: 18, ended: 16 },
  page: 1,
  pageSize: 12,
  totalPages: 11,
  results: [
    {
      trprId: 'AIG2026-0001',
      status: 'unregistered',
      title: 'SK네트웍스 Family AI 캠프',
      grade: '22기',
      period: '2026-03-02 ~ 2026-08-29',
      startDate: '2026-03-02',
      endDate: '2026-08-29',
      capacity: 240,
      applied: 238,
      hrdUrl: 'https://www.hrd.go.kr/',
    },
    {
      trprId: 'AIG2025-0008',
      status: 'ended',
      title: '프론트엔드 실무 과정',
      grade: '4기',
      period: '2025-01-10 ~ 2025-06-30',
      startDate: '2025-01-10',
      endDate: '2025-06-30',
      capacity: 180,
      applied: 176,
      hrdUrl: 'https://www.hrd.go.kr/',
    },
  ],
}

function ok(data: unknown) {
  return { data, isPending: false, isError: false }
}

// 등록 mutation 호출 검증용 스파이(서버 상태 기반이라 stub은 토글하지 않음).
const registerMutate = vi.fn()
// 과정 설정 저장 mutation 호출 검증용 스파이.
const updateSettingsMutate = vi.fn()

function mockAll() {
  vi.mocked(useOpsAccounts).mockReturnValue(
    ok(accounts) as unknown as ReturnType<typeof useOpsAccounts>,
  )
  vi.mocked(useCreateOpsAccount).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateOpsAccount>)
  vi.mocked(useUpdateOpsAccountStatus).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateOpsAccountStatus>)
  vi.mocked(useUpdateOperatorCohorts).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateOperatorCohorts>)
  vi.mocked(useResetAccountPassword).mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi
      .fn()
      .mockResolvedValue({ temporaryPassword: 'Temp1234!abc' }),
    isPending: false,
  } as unknown as ReturnType<typeof useResetAccountPassword>)
  vi.mocked(useHrdKeyList).mockReturnValue(
    ok(hrdList) as unknown as ReturnType<typeof useHrdKeyList>,
  )
  vi.mocked(useHrdKeySummary).mockReturnValue(
    ok(hrdSummary) as unknown as ReturnType<typeof useHrdKeySummary>,
  )
  vi.mocked(useHrdKeyHistory).mockReturnValue(
    ok(hrdHistory) as unknown as ReturnType<typeof useHrdKeyHistory>,
  )
  const mutationStub = { mutate: vi.fn(), isPending: false }
  vi.mocked(useCreateHrdKey).mockReturnValue(
    mutationStub as unknown as ReturnType<typeof useCreateHrdKey>,
  )
  vi.mocked(useUpdateHrdKey).mockReturnValue(
    mutationStub as unknown as ReturnType<typeof useUpdateHrdKey>,
  )
  vi.mocked(useDeleteHrdKey).mockReturnValue(
    mutationStub as unknown as ReturnType<typeof useDeleteHrdKey>,
  )
  vi.mocked(useTestHrdKey).mockReturnValue(
    mutationStub as unknown as ReturnType<typeof useTestHrdKey>,
  )
  vi.mocked(useCourseList).mockReturnValue(
    ok(courses) as unknown as ReturnType<typeof useCourseList>,
  )
  vi.mocked(useCourseConfig).mockReturnValue(
    ok(courseConfig) as unknown as ReturnType<typeof useCourseConfig>,
  )
  vi.mocked(useHrdCourseSearch).mockReturnValue(
    ok(hrdSearch) as unknown as ReturnType<typeof useHrdCourseSearch>,
  )
  registerMutate.mockClear()
  vi.mocked(useRegisterCourse).mockReturnValue({
    mutate: registerMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useRegisterCourse>)
  vi.mocked(useDeleteCourseRegistration).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteCourseRegistration>)
  updateSettingsMutate.mockClear()
  vi.mocked(useUpdateCohortSettings).mockReturnValue({
    mutate: updateSettingsMutate,
    mutateAsync: updateSettingsMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateCohortSettings>)
  vi.mocked(useCohortMaterials).mockReturnValue(
    ok([]) as unknown as ReturnType<typeof useCohortMaterials>,
  )
  const materialMutationStub = { mutate: vi.fn(), isPending: false }
  vi.mocked(useCreateCohortMaterial).mockReturnValue(
    materialMutationStub as unknown as ReturnType<
      typeof useCreateCohortMaterial
    >,
  )
  vi.mocked(useDeleteCohortMaterial).mockReturnValue(
    materialMutationStub as unknown as ReturnType<
      typeof useDeleteCohortMaterial
    >,
  )
}

function renderWith(ui: React.ReactElement) {
  mockAll()
  return render(
    <ToastProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ToastProvider>,
  )
}

describe('AccountsPage (설정 탭 랜딩 · 계정 관리)', () => {
  it('KPI·계정 테이블을 렌더한다', () => {
    renderWith(<AccountsPage />)
    expect(screen.getAllByText('MANAGER').length).toBeGreaterThan(0)
    expect(screen.getByText('이정훈')).toBeInTheDocument()
    // 본인 계정은 상태 변경 불가
    expect(screen.getByText('상태 변경 불가')).toBeInTheDocument()
  })

  it('수정 기능 제거 — 수정 버튼이 없고 비번 초기화·비활성화만 제공한다', () => {
    renderWith(<AccountsPage />)
    expect(
      screen.queryByRole('button', { name: '수정' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: '비번 초기화' }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', { name: '비활성화' }).length,
    ).toBeGreaterThan(0)
  })

  it('비번 초기화는 모달에서 확인 → 발급 2단계로 임시 비밀번호를 표시한다', async () => {
    const user = userEvent.setup()
    renderWith(<AccountsPage />)
    await user.click(screen.getAllByRole('button', { name: '비번 초기화' })[0])
    expect(
      screen.getByRole('heading', { name: '비밀번호 초기화' }),
    ).toBeInTheDocument()
    // 확인 단계 — 모달 오픈만으로는 발급되지 않는다
    expect(screen.queryByText('Temp1234!abc')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '초기화하고 발급' }))
    expect(await screen.findByText('Temp1234!abc')).toBeInTheDocument()
    // 복사 토스트(부모 리렌더)가 떠도 발급 화면·비밀번호가 유지된다
    await user.click(screen.getByRole('button', { name: '임시 비밀번호 복사' }))
    expect(
      await screen.findByText('임시 비밀번호를 복사했어요'),
    ).toBeInTheDocument()
    expect(screen.getByText('Temp1234!abc')).toBeInTheDocument()
  })

  it('행 클릭은 사용자 정보 상세 모달을 연다', async () => {
    const user = userEvent.setup()
    renderWith(<AccountsPage />)
    await user.click(screen.getByText('instructor.park@playdata.io'))
    expect(screen.getByText('사용자 정보')).toBeInTheDocument()
  })

  it('역할 필터는 해당 역할만 남긴다', async () => {
    const user = userEvent.setup()
    renderWith(<AccountsPage />)
    await user.click(screen.getByLabelText('역할 필터'))
    await user.click(
      within(screen.getByRole('listbox')).getByRole('button', {
        name: '강사',
      }),
    )
    expect(screen.queryByText('이정훈')).not.toBeInTheDocument()
    expect(screen.getByText('박강사')).toBeInTheDocument()
  })
})

describe('HrdApiKeyPage', () => {
  it('키 테이블과 활성/비활성 상태·삭제 버튼을 렌더한다', () => {
    renderWith(<HrdApiKeyPage />)
    expect(screen.getByText('HRD 운영키 2026')).toBeInTheDocument()
    expect(screen.getAllByText('****9K2A').length).toBeGreaterThan(0)
    // active 토글 모델 — 활성/비활성 상태 배지
    expect(screen.getByText('활성')).toBeInTheDocument()
    expect(screen.getByText('비활성')).toBeInTheDocument()
    // 행별 토글: 활성 키 → '비활성화', 비활성 키 → '활성화' (이력 필터와 라벨이 겹치지 않음)
    expect(screen.getByRole('button', { name: '비활성화' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '활성화' })).toBeInTheDocument()
    // 삭제 버튼은 키 행 2개 + 이력 필터 1개
    expect(
      screen.getAllByRole('button', { name: '삭제' }).length,
    ).toBeGreaterThanOrEqual(2)
  })

  it('빈 폼 등록 제출은 검증 에러를 보여준다', async () => {
    const user = userEvent.setup()
    renderWith(<HrdApiKeyPage />)
    // 이력 필터에도 '등록' 버튼이 있어 폼 내부(submit)만 특정한다.
    const submit = screen
      .getAllByRole('button', { name: '등록' })
      .find((b) => b.getAttribute('type') === 'submit')
    expect(submit).toBeDefined()
    await user.click(submit!)
    expect(
      await screen.findByText('API 이름을 입력해주세요'),
    ).toBeInTheDocument()
    expect(screen.getByText('API Key를 입력해주세요')).toBeInTheDocument()
  })

  it('이력 상세는 모달로 확인한다', async () => {
    const user = userEvent.setup()
    renderWith(<HrdApiKeyPage />)
    await user.click(screen.getAllByRole('button', { name: /상세/ })[0])
    expect(screen.getByText('API Key 이력 상세')).toBeInTheDocument()
    // '보안 정책' 행 제거됨 → 모달 본문의 '작업/결과' 행으로 모달 렌더 확인
    expect(screen.getByText('작업/결과')).toBeInTheDocument()
  })
})

describe('CourseConfigPage', () => {
  it('과정 목록과 기수별 기능 토글을 렌더한다', () => {
    renderWith(<CourseConfigPage />)
    expect(screen.getByText('과정 목록')).toBeInTheDocument()
    expect(screen.getByText(/기수별 기능 토글 · 2개 기수/)).toBeInTheDocument()
    // 기수별로 마일리지 토글이 노출된다(36기·35기).
    expect(
      screen.getByRole('switch', { name: '36기 마일리지' }),
    ).toBeInTheDocument()
    expect(screen.getByText('변경 사항 없음')).toBeInTheDocument()
  })

  it('기수 토글 변경 후 정책 저장은 확인 모달을 거쳐 저장 API를 호출한다', async () => {
    const user = userEvent.setup()
    renderWith(<CourseConfigPage />)
    // 36기 PLAY(true→false) 변경.
    await user.click(screen.getByRole('switch', { name: '36기 PLAY' }))
    expect(screen.getByText(/변경 사항 미저장 — 1건/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /정책 저장/ }))
    expect(screen.getByText('교육 과정 설정 저장 확인')).toBeInTheDocument()
    // 저장 확인 → 변경된 기수(36기)만 mileage 유지·play OFF로 전송.
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(updateSettingsMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 'course-sk',
        cohortId: 'cohort-36',
        mileageEnabled: true,
        playEnabled: false,
      }),
    )
  })

  it('취소는 버리기 확인 모달을 연다', async () => {
    const user = userEvent.setup()
    renderWith(<CourseConfigPage />)
    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.getByText('교육 과정 설정 취소 확인')).toBeInTheDocument()
    expect(screen.getByText('버린 변경은 복구되지 않음')).toBeInTheDocument()
  })
})

describe('CourseAddPage', () => {
  it('검색 폼은 항상 보이고, 조회 후 결과 카드가 렌더된다', async () => {
    const user = userEvent.setup()
    renderWith(<CourseAddPage />)
    // 폼은 조회 전에도 보인다.
    expect(screen.getByText('HRD-Net 과정 검색')).toBeInTheDocument()
    // 조회 전에는 결과 카드가 없다.
    expect(
      screen.queryByText('SK네트웍스 Family AI 캠프'),
    ).not.toBeInTheDocument()
    // 조회 후 결과 카드 + 종료 과정 표시.
    await user.click(screen.getByRole('button', { name: '조회' }))
    expect(
      await screen.findByText('SK네트웍스 Family AI 캠프'),
    ).toBeInTheDocument()
    expect(screen.getByText('종료된 과정')).toBeInTheDocument()
  })

  it('시스템 등록은 확인 모달을 거쳐 등록 API를 호출한다', async () => {
    const user = userEvent.setup()
    renderWith(<CourseAddPage />)
    await user.click(screen.getByRole('button', { name: '조회' }))
    await screen.findByText('SK네트웍스 Family AI 캠프')
    await user.click(screen.getByRole('button', { name: /시스템 등록/ }))
    expect(screen.getByText('HRD 과정 등록 확인')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '등록' }))
    // 서버 상태 기반 — 확인 시 등록 mutation 호출 + 모달 닫힘.
    expect(registerMutate).toHaveBeenCalledWith(
      expect.objectContaining({ trprId: 'AIG2026-0001', grade: '22기' }),
      expect.anything(),
    )
    expect(screen.queryByText('HRD 과정 등록 확인')).not.toBeInTheDocument()
  })
})
