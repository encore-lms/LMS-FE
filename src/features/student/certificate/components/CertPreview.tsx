import { Fragment, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/components/ui/use-toast'
import { useCertFlow } from '../useCertFlow'
import { CertTabs } from '../CertTabs'
import { SummaryTab } from '../tabs/SummaryTab'
import { CertChangeFlags } from './CertChangeFlags'
import type { CertStatus, CertificateOverview, CertTab } from '../types'

// 증명서 미리보기 랜딩 (/student/certificate, ?tab 없음) — Figma 249:27.
// 리치 히어로 + 보완 카드 + 탭(요약) + 요청 전 체크리스트 + 정식 인증 요청 액션바.
const HERO_CHIP: Record<CertStatus, { dot: string; label: string }> = {
  draft: { dot: 'bg-warning', label: 'PREVIEW · 정식 인증 전' },
  under_review: { dot: 'bg-info', label: '검토 중 · 매니저 확인' },
  changes_requested: { dot: 'bg-danger', label: '보완 요청 · 수정 필요' },
  issued: { dot: 'bg-success', label: '정식 인증 완료' },
}

// 보완 카드·체크리스트 이동 라벨 → 라우트
function ctaRoute(cta: string): string {
  if (cta.includes('프로필')) return '/student/profile'
  if (cta.includes('기록')) return '/student/records'
  if (cta.includes('공개')) return '/student/certificate/publication'
  if (cta.includes('프로젝트')) return '/student/projects'
  return '/student/certificate'
}

export function CertPreview({ data }: { data: CertificateOverview }) {
  const navigate = useNavigate()
  const [, setParams] = useSearchParams()
  const toast = useToast()
  const status = useCertFlow((s) => s.status)
  const setStatus = useCertFlow((s) => s.setStatus)
  // 요청 전 체크리스트 — 로컬 토글(미충족 항목 처리 → 정식 인증 요청 활성). BE 연동 시 서버 상태.
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const isPass = (id: string, def: boolean) => checked[id] ?? def
  const passCount = data.requestChecklist.filter((c) =>
    isPass(c.id, c.pass),
  ).length
  const total = data.requestChecklist.length
  const allPass = passCount === total
  const failCount = total - passCount
  const chip = HERO_CHIP[status]

  const setTab = (t: CertTab) => setParams({ tab: t })
  const requestCert = () => {
    // 테스트용: 체크리스트 게이팅을 일단 풀어 항상 요청되게(버튼 모양은 유지).
    setStatus('under_review')
    toast.success('정식 인증을 요청했어요 · 매니저 검토 대기')
  }

  return (
    <div className="flex flex-col gap-5 p-8 pb-28">
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
          <button
            type="button"
            onClick={requestCert}
            disabled={status !== 'draft'}
            className="text-brand mt-1 rounded-lg bg-white px-5 py-2.5 text-[13px] font-bold disabled:opacity-60"
          >
            ▶ 정식 인증 요청
          </button>
          <span className="text-[11px] text-white/70">
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

      {/* 탭(요약) — 탭 클릭 시 ?tab 상세로 이동 */}
      <CertTabs active="summary" onChange={setTab} />
      <SummaryTab s={data.summary} />

      {/* 요청 전 체크리스트 */}
      <section className="border-border bg-surface flex flex-col rounded-2xl border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
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

      {/* 상태별 액션바 — draft는 요청 전 체크리스트로 게이팅 */}
      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between gap-4 rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        {status === 'draft' && (
          <>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold">
                요청 전 체크 {passCount} / {total} 충족
                {failCount > 0 ? ` — 보완 ${failCount}건 필요` : ' — 요청 가능'}
              </span>
              <span className="text-[11px] text-white/70">
                모든 체크 충족 시 [정식 인증 요청] 버튼이 활성화됩니다
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => toast.info('미리보기를 새로고침했어요')}
                className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
              >
                미리보기 새로고침
              </button>
              <button
                type="button"
                onClick={requestCert}
                className={cn(
                  'rounded-lg px-5 py-2.5 text-[13px] font-bold',
                  allPass ? 'bg-brand text-white' : 'bg-white/15 text-white/70',
                )}
              >
                {allPass
                  ? '정식 인증 요청 →'
                  : `🔒 정식 인증 요청 (${failCount}건 보완 필요)`}
              </button>
            </div>
          </>
        )}

        {status === 'under_review' && (
          <>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold">
                매니저 검토 중 — 결과를 기다리는 중입니다
              </span>
              <span className="text-[11px] text-white/70">
                검토 결과에 따라 정식 인증 완료 또는 보완 요청으로 안내됩니다
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatus('draft')
                  toast.info('인증 요청을 취소했어요')
                }}
                className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
              >
                요청 취소
              </button>
              <span className="rounded bg-white/10 px-1.5 py-1 text-[10px] font-bold text-white/60">
                시뮬레이션
              </span>
              <button
                type="button"
                onClick={() => {
                  setStatus('changes_requested')
                  toast.info('보완 요청이 도착했어요')
                }}
                className="bg-warning rounded-lg px-3 py-2.5 text-[12px] font-bold"
              >
                보완 요청
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('issued')
                  toast.success('정식 인증이 완료됐어요')
                }}
                className="bg-success rounded-lg px-3 py-2.5 text-[12px] font-bold"
              >
                승인
              </button>
            </div>
          </>
        )}

        {status === 'changes_requested' && (
          <>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold">
                보완 요청 {data.changeFlags.length}건 — 사유를 확인하고 수정 후
                재요청하세요
              </span>
              <span className="text-[11px] text-white/70">
                보완 요청 상세에서 항목별 코멘트와 재요청 체크리스트를 확인할 수
                있습니다
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/student/certificate/changes-requested')}
              className="bg-brand shrink-0 rounded-lg px-5 py-2.5 text-[13px] font-bold"
            >
              보완 요청 확인 →
            </button>
          </>
        )}

        {status === 'issued' && (
          <>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold">
                정식 인증 완료 · 검증 ID {data.header.certId}
              </span>
              <span className="text-[11px] text-white/70">
                외부 공개 범위는 공개 설정에서 관리할 수 있습니다
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/student/certificate/publication')}
              className="bg-brand shrink-0 rounded-lg px-5 py-2.5 text-[13px] font-bold"
            >
              공개 설정 →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
