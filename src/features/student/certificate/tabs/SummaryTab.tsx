import { Fragment } from 'react'
import { cn } from '@/shared/lib/cn'
import type { CertSummaryTab } from '../types'
import { SkillRadar } from '../components/SkillRadar'
import { CERT_V2 } from '../config'
import { DomainDonut } from '../v2/DomainDonut'
import { OntologyMap } from '../v2/OntologyMap'
import { useQuery } from '@tanstack/react-query'
import { fetchAiAnalysis, fetchAiDerived } from '../ai'
import { TONE_SOLID } from '@/shared/lib/tone'

// 증명서 탭1 종합 요약.
// 상단: 핵심 지표 — 종합 점수 카드 + 핵심 지표 2×2 (Figma 미리보기 metrics-row).
// 하단: 6축 레이더/360° + 도메인 경험 + 온톨로지 맵(시안엔 없지만 화면 전용 유지).
// 제외(시안 정렬): 퀴즈 카테고리·근거 요약·대표 프로젝트·요청 전 체크리스트.
// AI 종합분석은 'AI 분석' 탭에만 노출 — 여기선 제외.
const card =
  'border-border bg-surface rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

export function SummaryTab({ s }: { s: CertSummaryTab }) {
  // 온톨로지·AI 분석은 LMS-AI 엔진 서버에서 fetch(없으면 mock). TODO(BE 연동): studentId 실제 연결.
  const { data: ai } = useQuery({
    queryKey: ['aiAnalysis', 'stu-001'],
    queryFn: () => fetchAiAnalysis('stu-001'),
  })
  // 6축 '자동 산정' = 결정 함수(derive) 계산값으로 연결. 점수만 대체하고
  // 동료(peer)·강사(confirmed·note) 표시 메타는 mock 유지. (동료 peerAgg 정합은 후속)
  // 6축 자동 산정 = LMS-AI 엔진 서버에서 fetch(없으면 mock). 로딩 중엔 s.skillAxes 기존값 유지.
  const { data: derived } = useQuery({
    queryKey: ['aiDerived', 'stu-001'],
    queryFn: () => fetchAiDerived('stu-001'),
  })
  const sixAxisScore = (derived?.sixAxis ?? {}) as Record<string, number>
  const skillAxes = s.skillAxes.map((a) => ({
    ...a,
    score: sixAxisScore[a.key] ?? a.score,
  }))
  const skillAvg = Math.round(
    skillAxes.reduce((sum, a) => sum + a.score, 0) / skillAxes.length,
  )
  const skillHighlight = [...skillAxes]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((a) => `${a.key} ${a.score}`)
    .join(' · ')
  const miniStats = [
    { v: s.ratioLabel, l: '요청 전 체크 충족' },
    { v: '3 건', l: '보완 권장' },
    { v: 'preview', l: '증명서 상태' },
    { v: s.sourceLabel, l: '산정 방식' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* 섹션 헤더 — 핵심 지표 · 종합 요약 */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[16px] font-bold">
            핵심 지표 · 종합 요약
          </span>
          <span className="text-fg-subtle text-[11px]">
            출결·시험·과제·프로젝트·평판을 한 화면에서 요약
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">
          마트 갱신 2026-05-14 03:12
        </span>
      </div>

      {/* 종합 점수 카드 + 핵심 지표 2×2 (Figma metrics-row) */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-col gap-5 lg:w-[46%]')}>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-fg-subtle text-[10px] font-bold tracking-[0.14em]">
                AGGREGATE SCORE
              </span>
              <span className="text-fg text-[15px] font-bold">종합 점수</span>
            </div>
            {s.scoreDelta && (
              <span className="bg-success-bg text-success flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold">
                ▲ {s.scoreDelta}
              </span>
            )}
          </div>
          <div className="flex items-end gap-3">
            <span className="text-fg text-[56px] leading-none font-bold">
              {s.overallScore}
            </span>
            <div className="flex flex-col gap-1.5 pb-1">
              <span className="text-fg-muted text-[14px] font-medium">
                / {s.scoreMax}
              </span>
              <span className="bg-brand/10 text-brand w-fit rounded-md px-2 py-0.5 text-[12px] font-bold">
                Grade {s.grade}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-fg-muted font-semibold">
                6축 평균 · {s.confirmedLabel}
              </span>
              <span className="text-fg-subtle">{skillHighlight}</span>
            </div>
            <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full"
                style={{ width: `${skillAvg}%` }}
              />
            </div>
          </div>
          <div className="border-divider grid grid-cols-4 gap-2 border-t pt-4">
            {miniStats.map((m) => (
              <div key={m.l} className="flex flex-col gap-0.5">
                <span className="text-fg text-[15px] font-bold">{m.v}</span>
                <span className="text-fg-subtle text-[10px]">{m.l}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid flex-1 grid-cols-2 gap-4">
          {s.kpis.map((k) => (
            <div
              key={k.key}
              className={cn(card, 'flex flex-col gap-3 p-[18px]')}
            >
              <div className="flex items-center justify-between">
                <span className="text-fg-muted text-[12px] font-medium">
                  {k.label}
                </span>
                <span
                  className={cn(
                    'size-2 rounded-full',
                    TONE_SOLID[k.tone ?? 'brand'],
                  )}
                />
              </div>
              <span className="text-fg text-[28px] leading-none font-bold">
                {k.value}
                {k.unit && (
                  <span className="text-fg-muted ml-0.5 text-[14px] font-medium">
                    {k.unit}
                  </span>
                )}
              </span>
              <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full',
                    TONE_SOLID[k.tone ?? 'brand'],
                  )}
                  style={{ width: `${k.bar ?? 0}%` }}
                />
              </div>
              {k.sub && (
                <span className="text-fg-subtle text-[11px]">{k.sub}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6축 레이더 + 360° 비교 */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <section
          className={cn(card, 'flex flex-1 flex-col items-center gap-2')}
        >
          <div className="flex w-full flex-col gap-0.5">
            <span className="text-fg text-[15px] font-bold">
              6축 자동 산정 레이더
            </span>
            <span className="text-fg-muted text-[11px]">
              StudentSkillAxisMart · confirmed only · 0–100
            </span>
          </div>
          <SkillRadar axes={skillAxes} />
        </section>

        <section className={cn(card, 'flex flex-1 flex-col gap-2')}>
          <div className="flex flex-col gap-0.5">
            <span className="text-fg text-[15px] font-bold">360° 비교</span>
            <span className="text-fg-muted text-[11px]">
              자동 산정 · 동료 · 강사 검증
            </span>
          </div>
          <div className="mt-1 grid grid-cols-[1fr_auto_auto_minmax(0,1.5fr)] items-center gap-x-5">
            <span className="text-fg-subtle pb-2 text-[11px] font-semibold">
              축
            </span>
            <span className="text-fg-subtle pb-2 text-right text-[11px] font-semibold">
              자동
            </span>
            <span className="text-fg-subtle pb-2 text-right text-[11px] font-semibold">
              동료
            </span>
            <span className="text-fg-subtle pb-2 text-right text-[11px] font-semibold">
              강사
            </span>
            {skillAxes.map((a) => (
              <Fragment key={a.key}>
                <span className="border-divider text-fg border-t py-2.5 text-[12px] font-bold">
                  {a.key}
                </span>
                <span className="border-divider text-brand border-t py-2.5 text-right text-[12px] font-bold">
                  {a.score}
                </span>
                <span className="border-divider text-fg-muted border-t py-2.5 text-right text-[12px]">
                  {(a.peer / 20).toFixed(1)}/5.0
                </span>
                <span className="border-divider border-t py-2.5 text-right">
                  {a.note ? (
                    <span className="text-fg-muted text-[11px]">{a.note}</span>
                  ) : a.confirmed ? (
                    <span className="bg-success-bg text-success rounded px-1.5 py-0.5 text-[10px] font-bold">
                      confirmed
                    </span>
                  ) : (
                    <span className="text-fg-subtle text-[11px]">—</span>
                  )}
                </span>
              </Fragment>
            ))}
          </div>
        </section>
      </div>

      {/* 도메인 경험 (폭 전체) */}
      {CERT_V2 && s.domains && <DomainDonut domains={s.domains} />}

      {/* ── v2 (CERT_V2): 온톨로지 역량 맵 ── */}
      {/* Figma '탭1 종합요약 상세'엔 없지만 화면엔 의도적으로 유지(제거 금지). */}
      {CERT_V2 && ai && <OntologyMap ontology={ai.ontology} />}
    </div>
  )
}
