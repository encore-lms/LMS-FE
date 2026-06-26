import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import AccountsPage from './AccountsPage'
import HrdApiKeyPage from './HrdApiKeyPage'
import CourseConfigPage from './CourseConfigPage'
import CourseAddPage from './CourseAddPage'
import {
  useSettingsHub,
  useOpsAccounts,
  useHrdKeyList,
  useHrdKeySummary,
  useHrdKeyHistory,
  useCreateHrdKey,
  useUpdateHrdKey,
  useDeleteHrdKey,
  useTestHrdKey,
  useCourseList,
  useCourseConfig,
  useHrdCourseSearch,
  useRegisterCourse,
  useDeleteCourseRegistration,
} from '../api/settings'
import type {
  SettingsHubData,
  OpsAccountsData,
  HrdKeyListData,
  HrdKeyHistoryData,
  HrdKeySummary,
  CourseListItem,
  CourseConfigDetail,
  HrdCourseSearchData,
} from '@/shared/types'

vi.mock('../api/settings')

const hub: SettingsHubData = {
  lastChange: { at: '09:05', by: '김매니저' },
  accounts: {
    rows: [
      { label: '매니저', value: '8명' },
      { label: '강사', value: '27명' },
    ],
  },
  hrdKey: { rows: [{ label: '등록된 Key', value: '2개' }] },
  courseConfig: { rows: [{ label: '진행 중 과정', value: '12개' }] },
  courseAdd: { rows: [{ label: '검색 소스', value: 'HRD-Net' }] },
  auditLogs: [
    {
      id: 'log-1',
      at: '05-27 09:05',
      actor: '김매니저',
      origin: '계정 관리',
      action: '강사 권한 부여',
      detail: '이지훈 강사',
    },
  ],
}

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
    id: 'course-ai22',
    name: 'AI 캠프 22기',
    code: 'AI22',
    campus: '강남캠퍼스',
    status: 'operating',
  },
  {
    id: 'course-ai20',
    name: 'AI 캠프 20기',
    code: 'AI20',
    campus: '강남캠퍼스',
    status: 'ended',
  },
]

const courseConfig: CourseConfigDetail = {
  courseId: 'course-ai22',
  name: 'AI 캠프 22기',
  campus: '강남캠퍼스',
  status: 'operating',
  description: 'AI/ML 풀스택 기반 22주 과정',
  featureToggles: [
    {
      key: 'mileage',
      label: '마일리지',
      description: '수강생 마일리지 적립·사용 메뉴 노출',
      enabled: true,
    },
    {
      key: 'play',
      label: 'PLAY',
      description: 'PLAY 게임(타자 등) 노출 — 마일리지와 연동',
      enabled: true,
    },
  ],
  learningPolicies: [
    {
      key: 'attendance',
      label: '출결 기준',
      description: 'HRD-Net 입실/퇴실 기준 · 폼 승인 정책 연동',
    },
  ],
  publicToggles: [
    {
      key: 'studentMenu',
      label: '수강생 메뉴 노출',
      description: '수강생 사이드바에 본 과정 메뉴 노출',
      enabled: true,
    },
  ],
  impacts: ['PLAY 토글 OFF → 수강생 사이드바의 PLAY 메뉴 즉시 숨김'],
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

function mockAll() {
  vi.mocked(useSettingsHub).mockReturnValue(
    ok(hub) as unknown as ReturnType<typeof useSettingsHub>,
  )
  vi.mocked(useOpsAccounts).mockReturnValue(
    ok(accounts) as unknown as ReturnType<typeof useOpsAccounts>,
  )
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
  it('KPI·계정 테이블·담당 범위 경고를 렌더한다', () => {
    renderWith(<AccountsPage />)
    expect(screen.getAllByText('MANAGER').length).toBeGreaterThan(0)
    expect(screen.getByText('이정훈')).toBeInTheDocument()
    expect(screen.getByText('강사는 최소 1개 이상 권장')).toBeInTheDocument()
    // 본인 계정은 비활성화 불가
    expect(screen.getByText('비활성화 불가')).toBeInTheDocument()
  })

  it('수정 액션은 운영 계정 수정 모달(역할·상태 편집)을 연다', async () => {
    const user = userEvent.setup()
    renderWith(<AccountsPage />)
    await user.click(screen.getAllByRole('button', { name: '수정' })[0])
    expect(screen.getByText('운영 계정 수정')).toBeInTheDocument()
    // 새 편집 모달 — 저장 버튼 + 감사 로그 안내(모달 고유)
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
    expect(
      screen.getByText(/변경 내역이 감사 로그에 기록됩니다/),
    ).toBeInTheDocument()
  })

  it('행 클릭은 사용자 정보 상세 모달을 연다', async () => {
    const user = userEvent.setup()
    renderWith(<AccountsPage />)
    await user.click(screen.getByText('instructor.park@playdata.io'))
    expect(screen.getByText('사용자 정보')).toBeInTheDocument()
  })

  it('본인 계정은 수정 불가 — 권한 회수 방지(다른 운영 계정은 수정 가능)', () => {
    renderWith(<AccountsPage />)
    // 이정훈(본인)은 수정 불가, 박강사(타 계정)는 수정 버튼
    expect(screen.getAllByText('수정 불가').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: '수정' })).toHaveLength(1)
  })

  it('역할 필터는 해당 역할만 남긴다', async () => {
    const user = userEvent.setup()
    renderWith(<AccountsPage />)
    await user.selectOptions(screen.getByLabelText('역할 필터'), 'INSTRUCTOR')
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
  it('과정 목록과 기능 토글을 렌더한다', () => {
    renderWith(<CourseConfigPage />)
    expect(screen.getByText('과정 목록')).toBeInTheDocument()
    expect(screen.getByText('마일리지')).toBeInTheDocument()
    expect(screen.getByText('변경 사항 없음')).toBeInTheDocument()
  })

  it('토글 변경 후 정책 저장은 저장 확인 모달을 연다', async () => {
    const user = userEvent.setup()
    renderWith(<CourseConfigPage />)
    await user.click(screen.getByRole('switch', { name: 'PLAY' }))
    expect(screen.getByText(/변경 사항 미저장 — 1건/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /정책 저장/ }))
    expect(screen.getByText('교육 과정 설정 저장 확인')).toBeInTheDocument()
    expect(screen.getByText('정책 변경 이력 기록')).toBeInTheDocument()
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
