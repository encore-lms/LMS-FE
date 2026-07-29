import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useCertFlow } from '../useCertFlow'
import { CertTabs } from '../CertTabs'
import { SummaryTab } from '../tabs/SummaryTab'
import { CertChangeFlags } from './CertChangeFlags'
import type { CertStatus, CertificateOverview, CertTab } from '../types'

// 증명서 전체화면 미리보기 (/student/certificate/preview, 사이드바 없음) — 보기 전용.
// 정식 인증 요청 흐름은 인셸 페이지의 테스트 네비로 분리됐고, 여기선 증명서 모습만 보여준다.
const HERO_CHIP: Record<CertStatus, { dot: string; label: string }> = {
  draft: { dot: 'bg-warning', label: 'PREVIEW · 정식 인증 전' },
  under_review: { dot: 'bg-info', label: '검토 중 · 매니저 확인' },
  changes_requested: { dot: 'bg-danger', label: '보완 요청 · 수정 필요' },
  issued: { dot: 'bg-success', label: '정식 인증 완료' },
}

// 보완 카드·체크리스트 이동 라벨 → 라우트(인셸로 복귀하며 이동)
function ctaRoute(cta: string): string {
  if (cta.includes('프로필')) return '/student/profile'
  if (cta.includes('기록')) return '/student/records'
  if (cta.includes('공개')) return '/student/certificate/publication'
  if (cta.includes('프로젝트')) return '/student/projects'
  return '/student/certificate'
}

export function CertPreview({ data }: { data: CertificateOverview }) {
  const navigate = useNavigate()
  const status = useCertFlow((s) => s.status)
  // 요청 전 체크리스트 — 미리보기에선 충족 현황 표시용 로컬 토글(읽기 위주).
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const isPass = (id: string, def: boolean) => checked[id] ?? def
  const passCount = data.requestChecklist.filter((c) =>
    isPass(c.id, c.pass),
  ).length
  const total = data.requestChecklist.length
  const allPass = passCount === total
  const failCount = total - passCount
  const chip = HERO_CHIP[status]

  const close = () => navigate('/student/certificate')
  const goTab = (t: CertTab) => navigate(`/student/certificate?tab=${t}`)

  return (
    <div className="bg-surface-muted min-h-screen w-full overflow-auto">
      {/* 미리보기 상단바 — 테스트/미리보기 표시 + 닫기 */}
      <div className="border-border bg-surface sticky top-0 z-40 flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="bg-accent-strong rounded-md px-2 py-1 text-[11px] font-bold text-white">
            🧪 미리보기
          </span>
          <span className="text-fg text-[14px] font-bold">
            수강 역량 증명서 미리보기
          </span>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="미리보기 닫기"
          className="border-border text-fg-muted hover:text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
        >
          ✕ 닫기
        </button>
      </div>

      <div className="mx-auto flex max-w-[1040px] flex-col gap-5 p-8">
        {/* 리치 히어로 */}
        <section className="bg-brand relative flex items-start justify-between gap-6 overflow-hidden rounded-2xl px-8 py-7 text-white shadow-[0px_8px_22px_0px_rgba(26,140,133,0.18)]">
          <span className="pointer-events-none absolute -top-10 right-24 size-[220px] rounded-full border border-white/10" />
          <span className="pointer-events-none absolute top-0 right-6 size-[140px] rounded-full border border-white/10" />
          <div className="flex flex-col gap-1.5">
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
              <span className={cn('size-1.5 rounded-full', chip.dot)} />
              {chip.label}
            </span>
            <span className="text-[11px] font-semibold tracking-[1.5px] text-white/70">
              ENCORE DATA COMPETENCY CERTIFICATE
            </span>
            <span className="text-[40px] leading-none font-bold">
              {data.header.studentName}
            </span>
            <span className="text-[14px] font-medium text-white/90">
              {data.header.courseName} · {data.header.cohortName}
            </span>
            <span className="text-[12px] text-white/75">
              {data.header.periodLabel}
            </span>
          </div>
          <div className="z-10 flex shrink-0 flex-col items-end gap-2">
            <div className="flex gap-1.5">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
                {data.header.isPublic ? '공개 ON' : '공개 OFF'}
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
                마트 최신 · 03:12
              </span>
            </div>
            <span className="text-[12px] text-white/85">
              {status === 'issued'
                ? `검증 ID · ${data.header.certId}`
                : '검증 ID · 미발급 (preview)'}
            </span>
            <span className="mt-1 text-[11px] text-white/70">
              요청 전 체크 {passCount} / {total} 충족
              {failCount > 0 ? ` — 보완 ${failCount}건 필요` : ''}
            </span>
          </div>
        </section>

        {/* 보완이 필요한 항목 */}
        <CertChangeFlags
          flags={data.changeFlags}
          onCta={(cta) => navigate(ctaRoute(cta))}
        />

        {/* 탭(요약) — 다른 탭 클릭 시 인셸 상세로 이동 */}
        <CertTabs active="summary" onChange={goTab} />
        <SummaryTab
          s={data.summary}
          recommendations={data.growth.recommendations}
        />

        {/* 요청 전 체크리스트 */}
        <section className="bg-surface flex flex-col rounded-2xl shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex flex-col">
              <span className="text-fg text-[15px] font-bold">
                요청 전 체크리스트
              </span>
              <span className="text-fg-subtle text-[11px]">
                모든 항목이 충족되어야 정식 인증 요청이 가능합니다 · 항목을 눌러
                충족 처리
              </span>
            </div>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-[12px] font-bold',
                allPass
                  ? 'bg-success-bg text-success'
                  : 'bg-warning-bg text-warning',
              )}
            >
              {passCount} / {total} 충족
            </span>
          </div>
          {data.requestChecklist.map((c, i) => {
            const pass = isPass(c.id, c.pass)
            return (
              <Fragment key={c.id}>
                {i > 0 && <div className="bg-divider h-px w-full" />}
                <div className="flex items-center gap-3 px-6 py-3.5">
                  <button
                    type="button"
                    onClick={() => setChecked((p) => ({ ...p, [c.id]: !pass }))}
                    aria-pressed={pass}
                    aria-label={`${c.label} 충족 토글`}
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-md text-[12px] font-bold',
                      pass
                        ? 'bg-success text-white'
                        : 'bg-warning-bg text-warning border-warning/40 border',
                    )}
                  >
                    {pass ? '✓' : '!'}
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-fg text-[13px] font-semibold">
                      {c.label}
                    </span>
                    <span className="text-fg-muted text-[11px]">{c.sub}</span>
                  </div>
                  {pass ? (
                    <span className="text-success shrink-0 text-[12px] font-semibold">
                      통과
                    </span>
                  ) : (
                    c.cta && (
                      <button
                        type="button"
                        onClick={() => navigate(ctaRoute(c.cta as string))}
                        className="text-brand shrink-0 text-[12px] font-semibold"
                      >
                        {c.cta} →
                      </button>
                    )
                  )}
                </div>
              </Fragment>
            )
          })}
        </section>
      </div>
    </div>
  )
}
