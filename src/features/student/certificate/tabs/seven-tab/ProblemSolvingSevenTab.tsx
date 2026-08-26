import type { CertificateSevenTabs } from '../../analysis'
import {
  EmptyPanel,
  SevenTabShell,
  sevenTabCard,
  Tags,
} from './SevenTabPrimitives'

export function ProblemSolvingSevenTab({
  tab,
}: {
  tab: CertificateSevenTabs['problemSolving']
}) {
  const cases = tab.payload.cases ?? []
  const aggregate = tab.payload.aggregate

  return (
    <SevenTabShell
      no={4}
      title="문제해결"
      sub="완료된 트러블슈팅 기록을 상황·해결·결과 순서로 정리합니다."
      tab={tab}
    >
      {aggregate && (
        <section className={`${sevenTabCard} grid gap-3 sm:grid-cols-4`}>
          {[
            ['전체 사례', aggregate.cases.length],
            ['독립 해결', aggregate.independentCaseCount],
            ['지원 활용', aggregate.supportedCaseCount],
            [
              '평균 소요일',
              aggregate.averageDays === null
                ? '-'
                : `${aggregate.averageDays.toFixed(1)}일`,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="bg-surface-muted rounded-xl p-4 text-center"
            >
              <span className="text-fg-subtle text-[10px]">{label}</span>
              <p className="text-fg mt-1 text-[18px] font-bold">{value}</p>
            </div>
          ))}
        </section>
      )}

      {cases.length === 0 ? (
        <EmptyPanel>완료된 문제해결 기록이 없습니다.</EmptyPanel>
      ) : (
        <div className="space-y-4">
          {cases.map((item, index) => (
            <article
              key={item.id}
              className={`${sevenTabCard} flex flex-col gap-5`}
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-brand text-[10px] font-bold">
                    사례 {String(index + 1).padStart(2, '0')} · {item.category}
                  </span>
                  <h3 className="text-fg mt-1 text-[16px] font-bold">
                    {item.title}
                  </h3>
                </div>
                <div className="flex gap-2 text-[10px] font-bold">
                  <span className="bg-brand/10 text-brand rounded-full px-2.5 py-1">
                    {item.independent ? '독립 해결' : '지원 활용'}
                  </span>
                  <span className="bg-surface-muted text-fg-muted rounded-full px-2.5 py-1">
                    {item.days === null ? '소요일 미집계' : `${item.days}일`}
                  </span>
                </div>
              </header>

              <div className="grid gap-3 lg:grid-cols-3">
                {[
                  ['상황', item.situation],
                  ['해결', item.resolution],
                  ['결과', item.result],
                ].map(([label, value], flowIndex) => (
                  <section
                    key={label}
                    className="bg-surface-muted rounded-xl p-4"
                  >
                    <span className="text-brand text-[10px] font-bold">
                      {flowIndex + 1}. {label}
                    </span>
                    <p className="text-fg-muted mt-2 text-[12px] leading-5">
                      {value}
                    </p>
                  </section>
                ))}
              </div>
              <Tags values={item.technologies} />
            </article>
          ))}
        </div>
      )}
    </SevenTabShell>
  )
}
