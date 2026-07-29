import type { WorkspaceData } from './types'
import { buildDraftWorkspace } from './mocks/builders'
import { mockList } from './mocks/list'
import { mockWorkspace } from './mocks/workspace-p1'
import { mockWorkspaceP2 } from './mocks/workspace-p2'
import { mockWorkspaceP3 } from './mocks/workspace-p3'

// 프로젝트 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// Figma 프로젝트 목록(337:930)·생성 마법사(340:981 외) 시안 재현.
// 픽스처 본문은 mocks/ 하위 파일로 분할 — 이 파일은 workspaces 조립과 재수출만 담당.

export { mockWorkspace, mockWorkspaceP2, mockWorkspaceP3 }

// projectId → 워크스페이스. 미등록 id(신규 생성 draft 등)는 p1을 기본값으로 응답.
const workspaces: Record<string, WorkspaceData> = {
  p1: mockWorkspace,
  p2: mockWorkspaceP2,
  p3: mockWorkspaceP3,
}

// 보충 프로젝트(pf*)도 카드를 열면 제목·상태가 맞는 작성 중 워크스페이스가 뜨도록 등록.
for (const p of mockList.projects) {
  if (!p.id.startsWith('pf')) continue
  workspaces[p.id] = buildDraftWorkspace({
    id: p.id,
    title: p.title,
    meta:
      p.kind === 'team'
        ? '팀 프로젝트 · 3명 · 2026-05-01 ~ 진행 중 · PM 김수강'
        : '개인 프로젝트 · 1명 · 2026-05-01 ~ 진행 중 · PM 김수강',
    stack: p.tags,
    kind: p.kind,
  })
}

// 생성/목록/삭제는 실 BE(/student/projects, learning-service)로 전환 — MSW 미처리 → proxy bypass.
// 워크스페이스 상세(/:projectId)·생성 마법사 카탈로그(/wizard)만 mock 유지(정본 §44~52 후속).
