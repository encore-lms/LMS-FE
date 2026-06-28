// [임시] 디자인 캡처 전용 mock — BE 실연동 화면(설정/계정·HRD Key·교육과정·학생관리)을
// dev에서 렌더하기 위한 합성 데이터. handlers.ts의 import.meta.glob이 자동 수집한다.
// ⚠️ 캡처 작업 후 이 디렉토리(_capture)는 삭제한다. 운영/실 코드와 무관.
import { http, HttpResponse } from 'msw'

const ok = (data: unknown) => HttpResponse.json({ data })

export const handlers = [
  // ── 설정 / 계정 관리 (/auth/accounts) ──
  http.get('/api/auth/accounts', () =>
    ok({
      content: [
        {
          userId: 'u-1',
          email: 'kim.manager@playdata.io',
          name: '김매니저',
          primaryRole: 'MANAGER',
          status: 'ACTIVE',
          lastLoginAt: '2026-05-27T09:18:00Z',
          cohortIds: [],
        },
        {
          userId: 'u-2',
          email: 'lee.jihoon@playdata.io',
          name: '이지훈',
          primaryRole: 'INSTRUCTOR',
          status: 'ACTIVE',
          lastLoginAt: '2026-05-26T14:02:00Z',
          cohortIds: ['c1', 'c2'],
        },
        {
          userId: 'u-3',
          email: 'choi.hyowon@playdata.io',
          name: '최효원',
          primaryRole: 'MENTOR',
          status: 'ACTIVE',
          lastLoginAt: '2026-05-25T11:30:00Z',
          cohortIds: ['c1'],
        },
        {
          userId: 'u-4',
          email: 'park.manager@playdata.io',
          name: '박매니저',
          primaryRole: 'MANAGER',
          status: 'ACTIVE',
          lastLoginAt: '2026-05-27T08:40:00Z',
          cohortIds: [],
        },
        {
          userId: 'u-5',
          email: 'old.instructor@playdata.io',
          name: '김비활성',
          primaryRole: 'INSTRUCTOR',
          status: 'INACTIVE',
          lastLoginAt: null,
          cohortIds: [],
        },
      ],
      totalElements: 5,
    }),
  ),

  // ── 설정 / HRD API Key (/admin/hrd-keys) — 구체 경로 먼저 ──
  http.get('/api/admin/hrd-keys/summary', () =>
    ok({
      activeKeys: 1,
      lastTest: {
        ok: true,
        latencyMs: 320,
        at: '2026-05-15T10:20:00Z',
        error: null,
      },
      expiring: 0,
      recentFail: 0,
    }),
  ),
  http.get('/api/admin/hrd-keys/history', () =>
    ok({
      items: [
        {
          id: 'h-1',
          at: '2026-05-26T14:21:00Z',
          action: 'update',
          actor: '김매니저',
          ok: true,
          responseMs: null,
          targetKeyMasked: '****3456',
        },
        {
          id: 'h-2',
          at: '2026-05-23T17:02:00Z',
          action: 'test',
          actor: '시스템',
          ok: false,
          responseMs: 5200,
          targetKeyMasked: '****3456',
        },
        {
          id: 'h-3',
          at: '2026-05-19T09:10:00Z',
          action: 'delete',
          actor: '김매니저',
          ok: true,
          responseMs: null,
          targetKeyMasked: '****1234',
        },
      ],
      page: 0,
      size: 20,
      totalElements: 3,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    }),
  ),
  http.get('/api/admin/hrd-keys', () =>
    ok({
      items: [
        {
          id: 'k-1',
          name: 'prod-key-2026Q2',
          maskedKey: '****3456',
          description: '운영 메인 키',
          active: true,
          createdBy: 'u-1',
          updatedBy: 'u-1',
          createdAt: '2026-05-12T09:00:00Z',
          updatedAt: '2026-05-12T09:00:00Z',
        },
        {
          id: 'k-2',
          name: 'backup-key-2025',
          maskedKey: '****7890',
          description: '백업 키',
          active: false,
          createdBy: 'u-1',
          updatedBy: 'u-1',
          createdAt: '2026-03-01T09:00:00Z',
          updatedAt: '2026-04-01T09:00:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalElements: 2,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
      sort: 'createdAt,desc',
    }),
  ),

  // ── 교육 과정 (/admin/courses) — 구체 경로 먼저 ──
  http.get('/api/admin/courses/hrd-search', () =>
    ok({
      summary: { total: 0, registrable: 0, registered: 0, ended: 0 },
      results: [],
      page: 0,
      pageSize: 20,
      totalPages: 0,
    }),
  ),
  http.get('/api/admin/courses/:courseId/cohorts/:cohortId/materials', () =>
    ok([
      {
        id: 'm-1',
        title: '오리엔테이션 안내서',
        materialType: 'document',
        url: 'https://example.com/orientation.pdf',
        createdAt: '2026-03-02T09:00:00Z',
      },
      {
        id: 'm-2',
        title: 'AI 캠프 커리큘럼 링크',
        materialType: 'link',
        url: 'https://example.com/curriculum',
        createdAt: '2026-03-05T10:00:00Z',
      },
    ]),
  ),
  http.get('/api/admin/courses/:courseId', () =>
    ok({
      courseId: 'co-1',
      title: 'SK네트웍스 Family AI 캠프',
      status: 'operating',
      startDate: '2026-03-02',
      endDate: '2026-08-29',
      cohorts: [
        {
          id: 'ch-1',
          cohortNo: '22',
          hrdTrprId: 'AIG2026-0001',
          startDate: '2026-03-02',
          endDate: '2026-08-29',
          status: 'operating',
          mileageEnabled: true,
          playEnabled: true,
        },
        {
          id: 'ch-2',
          cohortNo: '21',
          hrdTrprId: 'AIG2025-0009',
          startDate: '2025-09-01',
          endDate: '2026-02-28',
          status: 'ended',
          mileageEnabled: true,
          playEnabled: false,
        },
      ],
    }),
  ),
  http.get('/api/admin/courses', () =>
    ok([
      {
        courseId: 'co-1',
        title: 'SK네트웍스 Family AI 캠프',
        cohortCount: 3,
        status: 'operating',
        startDate: '2026-03-02',
        endDate: '2026-08-29',
      },
      {
        courseId: 'co-2',
        title: '데이터 분석 부트캠프',
        cohortCount: 5,
        status: 'operating',
        startDate: '2026-01-05',
        endDate: '2026-07-30',
      },
      {
        courseId: 'co-3',
        title: '데이터 엔지니어링 3기',
        cohortCount: 1,
        status: 'ended',
        startDate: '2025-09-01',
        endDate: '2026-02-28',
      },
    ]),
  ),

  // ── 학생 관리 / 계정 탭 (/users/students) ──
  http.get('/api/users/students', () =>
    ok({
      content: [
        {
          userId: 's-1',
          studentUuid: '2024-AIB3-0027',
          name: '김민준',
          birth: '2000-03-12',
          status: 'ACTIVE',
          lastLoginAt: '2026-05-27T09:18:00Z',
          createdAt: '2026-03-02T09:00:00Z',
        },
        {
          userId: 's-2',
          studentUuid: '2024-AIB3-0028',
          name: '이서연',
          birth: '1999-07-22',
          status: 'ACTIVE',
          lastLoginAt: '2026-05-26T18:40:00Z',
          createdAt: '2026-03-02T09:00:00Z',
        },
        {
          userId: 's-3',
          studentUuid: '2024-AIB3-0029',
          name: '박지훈',
          birth: '2001-01-05',
          status: 'BLOCKED',
          lastLoginAt: null,
          createdAt: '2026-03-02T09:00:00Z',
        },
        {
          userId: 's-4',
          studentUuid: '2024-AIB3-0030',
          name: '최유진',
          birth: '2000-11-30',
          status: 'INACTIVE',
          lastLoginAt: '2026-04-10T11:00:00Z',
          createdAt: '2026-03-02T09:00:00Z',
        },
      ],
      totalElements: 4,
    }),
  ),
]
