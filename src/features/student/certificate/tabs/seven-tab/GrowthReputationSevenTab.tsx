import type { CertificateSevenTabs } from '../../analysis'
import { EmptyPanel, SevenTabShell, sevenTabCard } from './SevenTabPrimitives'

const scoreLabels = [
  ['기술 기여', 'scoreTech'],
  ['책임감', 'scoreResponsibility'],
  ['소통', 'scoreCommunication'],
  ['문제해결', 'scoreProblemSolving'],
  ['팀워크', 'scoreTeamwork'],
] as const

export function GrowthReputationSevenTab({
  tab,
}: {
  tab: CertificateSevenTabs['growthReputation']
}) {
  const reputations = tab.payload.mentorReputations ?? []
  const axes = tab.payload.projectPeerAxes ?? []

  return (
    <SevenTabShell
      no={5}
      title="평가·추천"
      sub="프로젝트 동료 축과 멘토 평가·추천을 공개 설정 범위 안에서 보여줍니다."
      tab={tab}
    >
      <section className={`${sevenTabCard} flex flex-col gap-4`}>
        <h3 className="text-fg text-[15px] font-bold">프로젝트 동료 평가</h3>
        {axes.length === 0 ? (
          <p className="text-fg-subtle text-[12px]">
            집계된 동료 평가가 없습니다.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {axes.map((axis) => (
              <div key={axis.key} className="bg-surface-muted rounded-xl p-4">
                <span className="text-fg-muted text-[11px]">{axis.key}</span>
                <p className="text-brand mt-1 text-[22px] font-bold">
                  {axis.score.toFixed(1)}
                  <span className="text-[11px]"> / 5</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {reputations.length === 0 ? (
        <EmptyPanel>공개 가능한 멘토 평가·추천이 없습니다.</EmptyPanel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {reputations.map((item, index) => (
            <article
              key={`${item.teamId}-${index}`}
              className={`${sevenTabCard} flex flex-col gap-4`}
            >
              <header className="flex items-center justify-between">
                <h3 className="text-fg text-[14px] font-bold">
                  멘토 평가 {index + 1}
                </h3>
                <span className="text-fg-subtle text-[10px]">
                  팀 {item.teamId}
                </span>
              </header>
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {scoreLabels.map(([label, key]) => (
                  <div
                    key={key}
                    className="bg-surface-muted rounded-lg p-2.5 text-center"
                  >
                    <dt className="text-fg-subtle text-[9px]">{label}</dt>
                    <dd className="text-fg m-0 mt-1 text-[15px] font-bold">
                      {item[key] ?? '-'}
                    </dd>
                  </div>
                ))}
              </dl>
              {item.recommendationSummary && (
                <div className="border-divider border-t pt-4">
                  <span className="text-brand text-[10px] font-bold">
                    추천 요약
                  </span>
                  <p className="text-fg-muted mt-1 text-[12px] leading-5">
                    {item.recommendationSummary}
                  </p>
                </div>
              )}
              {item.comment && (
                <blockquote className="bg-brand/5 text-fg-muted rounded-xl p-4 text-[12px] leading-5">
                  “{item.comment}”
                </blockquote>
              )}
            </article>
          ))}
        </div>
      )}
    </SevenTabShell>
  )
}
