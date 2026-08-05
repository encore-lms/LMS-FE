// 워크스페이스 mock(p3) — 포트폴리오 REST API(진행 중 개인 프로젝트).
import type { WorkspaceData } from '../types'
import { mockWorkspace } from './workspace-p1'

// 포트폴리오 REST API(p3) — 진행 중 개인 프로젝트. 팀원이 없어 상호평가는 해당 없음.
export const mockWorkspaceP3: WorkspaceData = {
  ...mockWorkspace,
  id: 'p3',
  status: 'draft',
  title: '포트폴리오 REST API',
  meta: '개인 프로젝트 · 1명 · 2026-05-02 ~ 진행 중 · PM 예칼',
  banner: undefined,
  stats: [
    {
      label: '전체 진행률',
      value: '60',
      unit: '%',
      sub: '18 / 30 작업 완료',
      tone: 'brand',
    },
    {
      label: '내 작업',
      value: '5',
      unit: '건',
      sub: '진행 2 · 대기 3',
      tone: 'info',
    },
    {
      label: '열린 이슈',
      value: '2',
      unit: '건',
      sub: 'P1 1 · P2 1',
      tone: 'warning',
    },
    {
      label: '인증까지',
      value: '작성 중',
      unit: '',
      sub: '진행률 60%',
      tone: 'accent',
    },
  ],
  myTasks: [
    {
      id: 'task-mock-1',
      title: 'JWT 인증 필터 작성',
      assignee: '나',
      due: 'D-2',
      tags: [
        { label: '백엔드', tone: 'info' },
        { label: '보통', tone: 'warning' },
      ],
    },
    {
      title: 'Refresh Token rotation 구현',
      assignee: '나',
      due: 'D-3',
      tags: [
        { label: '보안', tone: 'danger' },
        { label: '보통', tone: 'warning' },
      ],
    },
    {
      title: '엔티티 연관관계 리팩터링',
      assignee: '나',
      due: 'D-5',
      tags: [
        { label: '설계', tone: 'accent' },
        { label: '보통', tone: 'warning' },
      ],
    },
  ],
  activities: [
    {
      who: '예칼',
      action: 'JWT 인증 모듈 초안을 커밋했습니다',
      when: '1시간 전',
    },
    { who: '예칼', action: 'ERD 3NF 정규화를 정리했습니다', when: '어제' },
    {
      who: '예칼',
      action: 'GitHub Actions CI 파이프라인을 추가했습니다',
      when: '2일 전',
    },
  ],
  columns: [
    {
      key: 'todo',
      label: '할 일',
      tasks: [
        {
          title: 'Swagger 문서화',
          assignee: '예칼',
          due: 'D-6',
          tags: [
            { label: '문서', tone: 'accent' },
            { label: '보통', tone: 'warning' },
          ],
        },
        {
          title: '통합 테스트 추가',
          assignee: '예칼',
          due: 'D-7',
          tags: [
            { label: '테스트', tone: 'accent' },
            { label: '보통', tone: 'warning' },
          ],
        },
      ],
    },
    {
      key: 'doing',
      label: '진행 중',
      tasks: [
        {
          title: 'JWT 인증 필터 작성',
          assignee: '예칼',
          due: 'D-2',
          tags: [
            { label: '백엔드', tone: 'info' },
            { label: '보통', tone: 'warning' },
          ],
        },
        {
          title: '상품 검색 인덱스 튜닝',
          assignee: '예칼',
          due: 'D-4',
          tags: [
            { label: '성능', tone: 'warning' },
            { label: '보통', tone: 'warning' },
          ],
        },
      ],
    },
    {
      key: 'review',
      label: '검토 대기',
      tasks: [
        {
          title: 'ERD 정규화 검토',
          assignee: '예칼',
          due: 'D-1',
          tags: [
            { label: '설계', tone: 'accent' },
            { label: '보통', tone: 'warning' },
          ],
        },
      ],
    },
  ],
  meetings: [
    {
      title: '멘토 코드 리뷰 세션',
      meta: '2026-05-20 · 참석 2명',
      summary: '인증 흐름 피드백 4건',
      status: { label: '완료', tone: 'success' },
    },
    {
      title: '아키텍처 점검',
      meta: '2026-05-12 · 참석 2명',
      summary: '레이어 분리 방향 확정',
      status: { label: '완료', tone: 'success' },
    },
  ],
  docs: [
    {
      title: 'ERD 설계 문서',
      meta: 'Wiki · 1일 전',
      status: { label: '진행', tone: 'warning' },
      category: '설계 문서',
    },
    {
      title: 'API 명세 (Swagger)',
      meta: 'Wiki · 작성 중',
      status: { label: '초안', tone: 'info' },
      category: 'API 명세',
    },
    {
      title: 'README 정리',
      meta: 'Markdown · 3일 전',
      status: { label: '완료', tone: 'success' },
      category: '위키',
    },
  ],
  issues: [
    {
      title: '게시글 목록 N+1 쿼리 발생',
      meta: '성능 · 담당 예칼',
      priority: { label: 'P1', tone: 'warning' },
      status: { label: '진행', tone: 'accent' },
    },
    {
      title: 'Refresh Token 재사용 탐지 누락',
      meta: '보안 · 담당 예칼',
      priority: { label: 'P2', tone: 'info' },
      status: { label: '열림', tone: 'info' },
    },
  ],
  members: [
    {
      memberId: 'pm-8',
      name: '예칼',
      role: '백엔드 (개인)',
      kind: 'PM',
      avatarTone: 'accent',
    },
  ],
  metrics: [
    {
      label: 'API 응답 시간(P95)',
      before: '210ms',
      after: '95ms',
      delta: '-55%',
      good: true,
    },
    {
      label: '테스트 커버리지',
      before: '0%',
      after: '64%',
      delta: '+64%p',
      good: true,
    },
    {
      label: '게시글 조회 쿼리 수',
      before: '21',
      after: '3',
      delta: '-86%',
      good: true,
    },
  ],
  stack: [
    'Spring Boot',
    'JPA',
    'PostgreSQL',
    'Spring Security',
    'JWT',
    'Docker',
    'GitHub Actions',
  ],
  peerDue: '해당 없음',
  peerMyStatus: { label: '개인 프로젝트 · 상호평가 없음', tone: 'info' },
  peerTeamStatus: { label: '팀원 없음', tone: 'info' },
  // 작성 중인 개인 프로젝트 — 상호평가가 열릴 수 없는 조합이다(완료 후 매니저·강사가 켠다).
  peerEvalEnabled: false,
  peerTargets: [],
  isOwner: true,
  certChecklist: [
    {
      label: '프로젝트 기본 정보 입력',
      status: { label: '완료', tone: 'success' },
    },
    {
      label: '팀원 및 기여도 확인',
      status: { label: '완료', tone: 'success' },
    },
    {
      label: '성과 지표 3개 이상 등록',
      status: { label: '진행', tone: 'warning' },
    },
    {
      label: '산출물 공개 범위 확인',
      status: { label: '필요', tone: 'danger' },
    },
    { label: '트러블슈팅 연결', status: { label: '완료', tone: 'success' } },
    {
      label: '상호평가 제출 완료',
      status: { label: '해당 없음', tone: 'success' },
    },
  ],
  certStatus: { label: '검토 전', tone: 'info' },
  certInfo: undefined,
  certRecentChange: {
    label: '변경 제안 없음',
    status: { label: '없음', tone: 'info' },
    date: '아직 제출된 변경 제안이 없습니다',
  },
}
