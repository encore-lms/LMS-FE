import { cn } from '@/shared/lib/cn'
import type { CertProjectsTab } from '../types'
import { TabHead } from './TechTab'
import { CERT_V2 } from '../config'
import { ProjectContribution } from '../v2/ProjectContribution'

// 증명서 탭3 프로젝트 — 프로젝트 카드·기여 히트맵·Before/After·공개 산출물.
const card =
  'bg-surface rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'
const HEAT = ['bg-surface-muted', 'bg-brand/30', 'bg-brand/60', 'bg-brand']

export function ProjectsTab({ p }: { p: CertProjectsTab }) {
  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={3}
        title="프로젝트"
        sub="대표 프로젝트 2건 인증 완료 · 기여도 평균 36% · 외부 공개 가능 산출물 6건"
      >
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 인증 {p.certifiedLabel}
        </span>
        <span className="text-fg-muted text-[11px] font-semibold">
          ● 기여도 평균 {p.contribAvg}
        </span>
      </TabHead>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {p.projects.map((pj) => (
          <section
            key={pj.id}
            className={cn(card, 'border-brand flex flex-col gap-3 border-t-2')}
          >
            <div className="flex items-center gap-2">
              <span className="text-brand text-[11px] font-bold tracking-wider">
                {pj.badge}
              </span>
              {pj.certified && (
                <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-bold">
                  ✓ 감사 인증
                </span>
              )}
            </div>
            <span className="text-fg text-[17px] font-bold">{pj.title}</span>
            <div className="text-fg flex gap-6 text-[12px]">
              <span>
                <span className="text-fg-subtle">시간 </span>
                {pj.period}
              </span>
              <span>
                <span className="text-fg-subtle">역할 </span>
                {pj.role}
              </span>
              <span>
                <span className="text-fg-subtle">기여도 </span>
                <b>{pj.contrib}</b>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pj.tags.map((tg) => (
                <span
                  key={tg}
                  className="bg-surface-muted text-fg-muted rounded-md px-2 py-0.5 text-[11px] font-medium"
                >
                  {tg}
                </span>
              ))}
            </div>
            <div className="bg-brand/5 flex flex-col gap-1.5 rounded-[10px] p-3.5">
              <span className="text-fg text-[12px] font-bold">핵심 성과</span>
              {pj.outcomes.map((o, i) => (
                <span
                  key={i}
                  className="text-fg-muted flex gap-1.5 text-[12px]"
                >
                  <span className="text-brand">•</span>
                  {o}
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* v2: 프로젝트별 커밋 잔디밭(선택형) — 켜지면 아래 집계 매트릭스 대신 노출 */}
      {CERT_V2 && p.commitActivity && (
        <ProjectContribution activities={p.commitActivity} />
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        {!(CERT_V2 && p.commitActivity) && (
          <section className={cn(card, 'flex flex-1 flex-col gap-3')}>
            <span className="text-fg text-[15px] font-bold">
              Contribution Matrix
            </span>
            <span className="text-fg-subtle text-[11px]">
              최근 12주 · 일별 커밋 활동
            </span>
            <div className="grid grid-cols-12 gap-1">
              {p.matrix.map((v, i) => (
                <span
                  key={i}
                  className={cn(
                    'aspect-square rounded-[3px]',
                    HEAT[v] ?? HEAT[0],
                  )}
                />
              ))}
            </div>
          </section>
        )}

        <section className={cn(card, 'flex flex-1 flex-col gap-3')}>
          <span className="text-fg text-[15px] font-bold">
            Before → After 성과
          </span>
          {p.beforeAfter.map((b) => (
            <div
              key={b.label}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <span className="text-fg font-medium">{b.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-fg-subtle">{b.before}</span>
                <span className="text-fg-subtle">→</span>
                <span className="text-fg font-bold">{b.after}</span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[11px] font-bold',
                    b.good
                      ? 'bg-success-bg text-success'
                      : 'bg-danger-bg text-danger',
                  )}
                >
                  {b.delta}
                </span>
              </span>
            </div>
          ))}
        </section>
      </div>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">
          공개 산출물 · 외부 검증 가능
        </span>
        {p.artifacts.map((a, i) => (
          <div
            key={i}
            className="border-border flex items-center justify-between rounded-[10px] border p-3.5"
          >
            <span className="text-fg text-[13px] font-semibold">{a.title}</span>
            <span className="text-fg-subtle text-[11px]">{a.meta}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
