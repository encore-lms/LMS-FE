// 트러블슈팅 상세 — 목록 사례(TsCase)에서 상세(TsCaseDetail)를 파생.
// mock 핸들러와 새 사례 작성(상세 캐시 시드)에서 공유한다. msw 비의존이라 앱 번들에
// 안전하게 포함된다. 어떤 사례를 열어도 제목·상태·내용이 목록과 일치한다.
import type {
  TsCase,
  TsCaseDetail,
  TsProjectLink,
  TsStatus,
  TsTimeline,
} from './types'

// 일부 사례를 프로젝트에 연결된 상태로 시드(데모) — ts2는 미연결로 두어 '프로젝트 연결' 흐름을 보여준다.
// BE 연동 시 서버 연결값으로 대체. 연결 단위는 프로젝트(이슈 단위 연결은 제외).
export const PROJECT_LINK_BY_ID: Record<string, TsProjectLink> = {
  ts1: { projectId: 'p1', projectTitle: '주문 관리 MSA 백엔드' },
  ts6: { projectId: 'p1', projectTitle: '주문 관리 MSA 백엔드' },
  ts9: { projectId: 'p2', projectTitle: '실시간 채팅 서버' },
}

const TIMELINE_STATE: Record<TsStatus, Record<string, TsTimeline['state']>> = {
  draft: { draft: 'current', submitted: 'todo', certified: 'todo' },
  reviewing: { draft: 'done', submitted: 'current', certified: 'todo' },
  certified: { draft: 'done', submitted: 'done', certified: 'current' },
}

export function buildTimeline(status: TsStatus): TsTimeline[] {
  const s = TIMELINE_STATE[status]
  return [
    {
      key: 'draft',
      label: '작성 중 (draft)',
      sub: s.draft === 'current' ? '현재 상태' : '작성 완료',
      state: s.draft,
    },
    {
      key: 'submitted',
      label: '검토 중 (submitted)',
      sub:
        s.submitted === 'current'
          ? '현재 상태 · 강사 검토 대기'
          : s.submitted === 'done'
            ? '강사 검토 완료'
            : '인증 요청 후 전환',
      state: s.submitted,
    },
    {
      key: 'certified',
      label: '인증 완료 (certified)',
      sub:
        s.certified === 'current'
          ? '현재 상태 · 변경 제안으로만 수정'
          : '강사 승인 후 잠금',
      state: s.certified,
    },
  ]
}

export function buildCaseDetail(c: TsCase): TsCaseDetail {
  const projectLink = PROJECT_LINK_BY_ID[c.id] ?? null
  const linked = !!projectLink
  const tagWord = (c.tags[0] ?? '#evidence').replace(/^#/, '')
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    categoryTone: c.categoryTone,
    status: c.status,
    statusLabel: c.statusLabel,
    completed: c.completed ?? false,
    independent: c.independent,
    days: c.days,
    situation: c.situation,
    resolution: c.resolution,
    result: c.result,
    attachments: [
      { label: `${tagWord}-evidence.log`, kind: 'file' },
      { label: 'fix-pr 링크', kind: 'link' },
    ],
    checklist: [
      {
        label: '상황/해결/결과 입력 완료',
        status: { label: '완료', tone: 'success' },
      },
      {
        label: '첨부 근거 2개 등록',
        status: { label: '완료', tone: 'success' },
      },
      linked
        ? {
            label: '프로젝트 연결됨',
            status: { label: '완료', tone: 'success' },
          }
        : {
            label: '프로젝트 연결 필요',
            status: { label: '필요', tone: 'warning' },
          },
      c.status === 'certified'
        ? {
            label: '인증 완료(잠금)',
            status: { label: '완료', tone: 'success' },
          }
        : {
            label: '중복 인증 요청 없음',
            status: { label: '완료', tone: 'success' },
          },
    ],
    timeline: buildTimeline(c.status),
    certProject: projectLink
      ? projectLink.projectTitle
      : '연결된 프로젝트 없음',
    certReviewer: `${c.category} · 강사 검토`,
    certChecklist: [
      '상황/해결/결과 3개 항목이 모두 작성됨',
      '관련 프로젝트가 연결되어 있음',
      '첨부 근거와 소요 일수가 확인됨',
      '동일 사례로 진행 중인 요청이 없음',
    ],
    projectLink,
  }
}

// 서버 목록에 없는 id(클라이언트에서 새로 만든 사례)용 폴백 — 작성 중 빈 상세.
export function buildFallbackDetail(id: string): TsCaseDetail {
  return buildCaseDetail({
    id,
    category: '기타',
    categoryKey: 'etc',
    categoryTone: 'success',
    status: 'draft',
    statusLabel: '작성 중',
    independent: false,
    days: '진행 중',
    accentTone: 'accent',
    title: '작성 중 사례',
    createdAt: '작성 방금',
    updatedAt: '최근 수정 방금',
    situation: '작성 중인 사례입니다. 상황을 입력하세요.',
    resolution: '해결 과정을 입력하세요.',
    result: '결과와 학습 내용을 입력하세요.',
    tags: [],
    actionLabel: '이어 작성',
  })
}
