// 워크스페이스 mock 빌더 — 신규 생성(작성 중) 워크스페이스 헬퍼.
import type { ProjectKind, WorkspaceData } from '../types'

// 생성 입력 → 목록 카드. 신규는 항상 '작성 중' 상태로 시작.
export function buildDraftWorkspace(opts: {
  id: string
  title?: string
  meta?: string
  stack?: string[]
  kind?: ProjectKind
}): WorkspaceData {
  const kind = opts.kind ?? 'team'
  return {
    id: opts.id,
    title: opts.title ?? '새 프로젝트',
    meta:
      opts.meta ??
      (kind === 'team' ? '팀 프로젝트 · 작성 중' : '개인 프로젝트 · 작성 중'),
    status: 'draft',
    banner: undefined,
    stats: [
      {
        label: '작업 진행률',
        value: '0',
        unit: '%',
        sub: '0 / 0 작업 완료',
        tone: 'brand',
      },
      {
        label: '회의록',
        value: '0',
        unit: '건',
        sub: '아직 없음',
        tone: 'accent',
      },
      {
        label: '산출물',
        value: '0',
        unit: '건',
        sub: '아직 없음',
        tone: 'info',
      },
      {
        label: '열린 이슈',
        value: '0',
        unit: '건',
        sub: '아직 없음',
        tone: 'warning',
      },
    ],
    myTasks: [],
    activities: [],
    columns: [
      { key: 'todo', label: '할 일', tasks: [] },
      { key: 'doing', label: '진행 중', tasks: [] },
      { key: 'review', label: '검토 대기', tasks: [] },
    ],
    calMonth: '2026년 6월',
    calEvents: [],
    upcoming: [],
    meetings: [],
    docCategories: [
      '전체',
      'API 명세',
      '설계 문서',
      '발표 자료',
      '첨부 파일',
      '위키',
    ],
    docs: [],
    issues: [],
    members: [
      {
        memberId: 'pm-9',
        name: '김수강',
        role: kind === 'team' ? '백엔드 · PM' : '백엔드 (개인)',
        kind: 'PM',
        avatarTone: 'accent',
      },
    ],
    rolePolicy: [
      'PM은 인증 요청과 팀원 초대를 관리합니다',
      '팀원은 본인 작업과 산출물을 등록합니다',
      '기여도 합계는 100% 이내로 유지합니다',
      '인증 후 변경은 변경 제안으로 제출합니다',
    ],
    metrics: [],
    stack: opts.stack ?? [],
    peerDue: '완료 확정 후 안내',
    peerMyStatus: { label: '완료 확정 전', tone: 'info' },
    peerTeamStatus: { label: '완료 확정 전', tone: 'info' },
    peerEvalEnabled: true,
    peerTargets: [],
    certChecklist: [
      {
        label: '프로젝트 기본 정보 입력',
        status: { label: '완료', tone: 'success' },
      },
      {
        label: '팀원 및 기여도 확인',
        status: { label: '필요', tone: 'danger' },
      },
      {
        label: '성과 지표 3개 이상 등록',
        status: { label: '필요', tone: 'danger' },
      },
      {
        label: '산출물 공개 범위 확인',
        status: { label: '필요', tone: 'danger' },
      },
      { label: '트러블슈팅 연결', status: { label: '필요', tone: 'danger' } },
      {
        label: '상호평가 제출 완료',
        status: { label: '완료 확정 전', tone: 'info' },
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
}
