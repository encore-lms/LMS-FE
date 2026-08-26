import type { CertificateSevenTabs } from '../../analysis'
import {
  EmptyPanel,
  SevenTabShell,
  sevenTabCard,
  Tags,
} from './SevenTabPrimitives'

export function TechSevenTab({ tab }: { tab: CertificateSevenTabs['tech'] }) {
  const assessments = tab.payload.assessments ?? []
  const certifications = tab.payload.certifications ?? []
  const skillTags = tab.payload.skillTags ?? []
  const projectTechStacks = tab.payload.projectTechStacks ?? []

  return (
    <SevenTabShell
      no={2}
      title="기술·검증"
      sub="평가·자격증·프로젝트 기술 스택을 검증된 원천에서 모았습니다."
      tab={tab}
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className={`${sevenTabCard} flex flex-col gap-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-fg text-[15px] font-bold">평가 결과</h3>
            <span className="text-fg-subtle text-[11px]">
              {assessments.length}건
            </span>
          </div>
          {assessments.length === 0 ? (
            <EmptyPanel>반영된 평가가 없습니다.</EmptyPanel>
          ) : (
            <div className="space-y-3">
              {assessments.map((assessment, index) => (
                <article
                  key={
                    assessment.assessmentId ?? `${assessment.category}-${index}`
                  }
                  className="bg-surface-muted rounded-xl p-4"
                >
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="text-brand text-[10px] font-bold">
                        {assessment.assessmentType === 'CS'
                          ? 'CS 평가'
                          : '성취도 평가'}
                      </span>
                      <h4 className="text-fg mt-1 text-[13px] font-bold">
                        {assessment.category}
                      </h4>
                    </div>
                    <strong className="text-brand text-[20px]">
                      {assessment.score.toFixed(1)}점
                    </strong>
                  </div>
                  <div className="bg-divider mt-3 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{ width: `${assessment.score}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <section className={`${sevenTabCard} flex flex-col gap-3`}>
            <h3 className="text-fg text-[15px] font-bold">기술 태그</h3>
            <Tags values={skillTags} />
          </section>
          <section className={`${sevenTabCard} flex flex-col gap-3`}>
            <h3 className="text-fg text-[15px] font-bold">승인 자격증</h3>
            <Tags values={certifications} />
          </section>
          <section className={`${sevenTabCard} flex flex-col gap-3`}>
            <h3 className="text-fg text-[15px] font-bold">
              프로젝트 기술 스택
            </h3>
            {projectTechStacks.length === 0 ? (
              <p className="text-fg-subtle text-[12px]">
                기록된 기술 스택이 없습니다.
              </p>
            ) : (
              projectTechStacks.map((project) => (
                <div
                  key={project.projectId}
                  className="border-divider border-t pt-3 first:border-0 first:pt-0"
                >
                  <span className="text-fg-subtle text-[10px]">
                    프로젝트 {project.projectId}
                  </span>
                  <div className="mt-2">
                    <Tags values={project.values} />
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </SevenTabShell>
  )
}
