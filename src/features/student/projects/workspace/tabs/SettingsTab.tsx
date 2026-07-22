import type { WorkspaceData } from '../../types'
import { TeamTab } from './TeamTab'
import { ProjectInfoSection } from './settings/ProjectInfoSection'
import { GithubSection } from './settings/GithubSection'

/**
 * 프로젝트 설정 탭.
 * · 프로젝트 정보: 이름·기간(PM 전용), 기술 카테고리(팀원 누구나). 인증 완료면 잠금.
 * · GitHub 연결(작업 2): 팀 공통 Org·분석 브랜치 + 개인 증명서 공개.
 */
export function SettingsTab({ d }: { d: WorkspaceData }) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <ProjectInfoSection d={d} />

      {/* ── 팀 관리 (탭에서 이관) — '팀원 관리' 헤더가 섹션 헤더 역할 ── */}
      <div className="pt-2">
        <TeamTab d={d} />
      </div>

      <GithubSection projectId={d.id} />
    </div>
  )
}
