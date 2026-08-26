import type { CertificateSevenTabs } from '../../analysis'
import {
  EmptyPanel,
  SevenTabShell,
  sevenTabCard,
  StringList,
  Tags,
} from './SevenTabPrimitives'

export function ProjectsSevenTab({
  tab,
}: {
  tab: CertificateSevenTabs['projects']
}) {
  const projects = tab.payload.projects ?? []

  return (
    <SevenTabShell
      no={3}
      title="프로젝트"
      sub="인증된 프로젝트의 역할·과업·성과·동료 근거를 보여줍니다."
      tab={tab}
    >
      {projects.length === 0 ? (
        <EmptyPanel>인증 결과에 포함된 프로젝트가 없습니다.</EmptyPanel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.projectId}
              className={`${sevenTabCard} flex min-w-0 flex-col gap-5`}
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-brand/10 text-brand rounded-full px-2 py-1 text-[10px] font-bold">
                      {project.membershipRole === 'OWNER'
                        ? '프로젝트 리더'
                        : '팀원'}
                    </span>
                    {project.domain && (
                      <span className="text-fg-subtle text-[11px]">
                        {project.domain}
                      </span>
                    )}
                  </div>
                  <h3 className="text-fg mt-2 text-[17px] font-bold">
                    {project.name}
                  </h3>
                  <p className="text-fg-muted mt-1 text-[11px]">
                    {project.period.startedAt} ~ {project.period.endedAt}
                  </p>
                </div>
                <span className="text-fg-subtle text-[11px]">
                  할당 {project.boardAssignedTaskCount} · 완료{' '}
                  {project.boardCompletedAssignedTaskCount}
                </span>
              </header>

              <div>
                <h4 className="text-fg mb-2 text-[12px] font-bold">
                  프로젝트 범위
                </h4>
                <p className="text-fg-muted text-[12px] leading-5">
                  {project.scope}
                </p>
              </div>

              <div>
                <h4 className="text-fg mb-2 text-[12px] font-bold">
                  기술 스택
                </h4>
                <Tags values={project.teamTechStacks} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-fg mb-2 text-[12px] font-bold">
                    팀 성과
                  </h4>
                  <StringList values={project.teamOutcomes} />
                </div>
                <div>
                  <h4 className="text-fg mb-2 text-[12px] font-bold">
                    개인 회고
                  </h4>
                  <StringList values={project.selfReviewStatements} />
                </div>
              </div>

              {project.limitations.length > 0 && (
                <div className="border-warning/20 bg-warning-bg/40 rounded-xl border p-3">
                  <h4 className="text-warning mb-1 text-[11px] font-bold">
                    해석 제한
                  </h4>
                  <StringList values={project.limitations} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </SevenTabShell>
  )
}
