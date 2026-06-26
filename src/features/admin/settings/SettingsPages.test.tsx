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
  useHrdKeys,
  useCourseList,
  useCourseConfig,
  useHrdCourseSearch,
} from '../api/settings'
import type {
  SettingsHubData,
  OpsAccountsData,
  HrdKeyData,
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

const hrdKeys: HrdKeyData = {
  summary: {
    activeKeys: 1,
    activeKeysHint: '기본 + 보조 1개',
    lastTest: { ok: true, at: '05-20 10:22', latency: '220ms' },
    expiring: 1,
    expiringHint: 'D-14 알림 대상',
    recentFail: 0,
  },
  keys: [
    {
      id: 'key-1',
      name: 'HRD 운영키 2026',
      isPrimary: true,
      maskedKey: 'APIPO****9K2A',
      createdAt: '2026-05-01',
      lastUsedAt: '오늘 10:22',
      status: 'active',
    },
    {
      id: 'key-3',
      name: '구 키 2025',
      isPrimary: false,
      maskedKey: 'APIPO****OLD',
      createdAt: '2025-12-01',
      lastUsedAt: '04-01 14:20',
      status: 'revoked',
    },
  ],
  history: [
    {
      id: 'hist-1',
      at: '05-20 10:22',
      action: 'test',
      actor: '이정훈',
      ok: true,
      response: '220ms',
      targetKey: 'APIPO****9K2A',
    },
    {
      id: 'hist-3',
      at: '05-12 14:21',
      action: 'rotate',
      actor: '김매니저',
      ok: true,
      response: null,
      targetKey: 'APIPO****9K2A ← OLD',
    },
  ],
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
      capacity: 180,
      applied: 176,
      hrdUrl: 'https://www.hrd.go.kr/',
    },
  ],
}

function ok(data: unknown) {
  return { data, isPending: false, isError: false }
}

function mockAll() {
  vi.mocked(useSettingsHub).mockReturnValue(
    ok(hub) as unknown as ReturnType<typeof useSettingsHub>,
  )
  vi.mocked(useOpsAccounts).mockReturnValue(
    ok(accounts) as unknown as ReturnType<typeof useOpsAccounts>,
  )
  vi.mocked(useHrdKeys).mockReturnValue(
    ok(hrdKeys) as unknown as ReturnType<typeof useHrdKeys>,
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
  it('키 테이블과 폐기 키의 작업 불가 상태를 렌더한다', () => {
    renderWith(<HrdApiKeyPage />)
    expect(screen.getByText('HRD 운영키 2026')).toBeInTheDocument()
    expect(screen.getAllByText('APIPO****9K2A').length).toBeGreaterThan(0)
    expect(screen.getByText('폐기됨 — 작업 불가')).toBeInTheDocument()
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
    expect(
      screen.getByText('키 값은 저장 후 재표시하지 않음'),
    ).toBeInTheDocument()
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
  it('HRD 검색 폼·KPI·결과 카드를 렌더한다', () => {
    renderWith(<CourseAddPage />)
    expect(screen.getByText('HRD-Net 과정 검색')).toBeInTheDocument()
    expect(screen.getByText('SK네트웍스 Family AI 캠프')).toBeInTheDocument()
    // 종료 과정은 등록 불가
    expect(screen.getByText('종료된 과정')).toBeInTheDocument()
  })

  it('시스템 등록은 확인 모달을 거쳐 등록됨으로 토글된다', async () => {
    const user = userEvent.setup()
    renderWith(<CourseAddPage />)
    await user.click(screen.getByRole('button', { name: /시스템 등록/ }))
    expect(screen.getByText('HRD 과정 등록 확인')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '등록' }))
    expect(
      screen.getByRole('button', { name: '시스템 등록 제거' }),
    ).toBeInTheDocument()
  })
})
