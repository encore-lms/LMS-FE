import { useState, type ReactNode } from 'react'
import { ArrowLeft, Check, RotateCw, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { KpiCard } from '@/components/data/KpiCard'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { CertReviewStatus } from '@/shared/types'
import { useReviewAction, useReviewDetail } from './api'
import {
  ApproveModal,
  ChangesRequestModal,
  MartRecalcModal,
} from './ReviewModals'

const TABS = [
  '종합 요약',
  '기술·검증',
  '프로젝트',
  '문제해결·협업',
  '성장·평판',
]

const STATUS_LABEL: Record<CertReviewStatus, string> = {
  requested: '요청됨',
  reviewing: '검토 중',
  changes_requested: '보완 요청',
  certified: '인증 완료',
}

function SectionCard({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: ReactNode
}) {
  return (
    <section className="border-border bg-surface rounded-xl border">
      <div className="border-divider border-b p-5">
        <h2 className="text-fg font-bold">{title}</h2>
        {desc && <p className="text-fg-subtle mt-1 text-xs">{desc}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

// 인증 검토 상세 (/admin/certificates/reviews/:reviewId) — Flow 11.
// 증명서 미리보기 + 승인 필수 체크 + 점수 근거/산출물/감사 로그 + 승인·보완 액션. (Figma "인증 검토 상세 v2")
export default function ReviewDetailPage() {
  const { reviewId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useReviewDetail(reviewId)
  const reviewAction = useReviewAction()
  usePageHeader(
    '인증 검토 상세',
    '증명서를 미리 보고 점수 근거를 확인한 뒤 승인 여부를 결정합니다',
  )
  const [tab, setTab] = useState(0)
  const [openModal, setOpenModal] = useState<
    'changes' | 'approve' | 'mart' | null
  >(null)
  const [martResolved, setMartResolved] = useState(false)

  const d = data
  // 마트 재계산 실행 시(mock) 원천 데이터 최신성 체크를 통과로 간주 → 승인 활성.
  const approvalChecks = d?.approvalChecks ?? []
  const checks = martResolved
    ? approvalChecks.map((c) => (c.key === 'mart' ? { ...c, pass: true } : c))
    : approvalChecks
  const passCount = checks.filter((c) => c.pass).length
  const allPass = passCount === checks.length

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError}
      onRetry={() => refetch()}
      loadingText="검토 상세를 불러오는 중…"
      errorTitle="검토 상세를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {d && (
        <div className="p-8">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/certificates/reviews')}
              className="text-fg-muted hover:text-fg flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> 검토 큐로
            </button>
            {/* 동결 스냅샷 진입(인증 완료 후 생성) — 검토 상세에서 스냅샷·감사로그로 연결 */}
            <button
              type="button"
              onClick={() =>
                navigate(`/admin/certificates/${d.student.certId}/snapshot`)
              }
              className="text-brand text-sm font-semibold hover:underline"
            >
              스냅샷 보기 →
            </button>
          </div>

          <div className="border-border bg-surface mt-3 flex items-start justify-between gap-4 rounded-xl border p-6">
            <div className="flex items-center gap-4">
              <Avatar name={d.student.name} size={64} />
              <div>
                <StatusBadge label={d.student.cohort} tone="neutral" />
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-fg text-2xl font-bold">
                    {d.student.name}
                  </span>
                  <span className="text-fg-subtle text-sm">
                    {d.student.certId}
                  </span>
                </div>
                <p className="text-fg-muted mt-1 text-xs">
                  {STATUS_LABEL[d.status]} · 담당자 {d.assignee} · 요청일{' '}
                  {d.requestedAt}
                </p>
              </div>
            </div>
            {d.martStale && (
              <div className="bg-warning-bg text-warning rounded-lg px-3 py-2 text-right text-xs">
                <p className="font-bold">원천 데이터 최신성 — 미갱신</p>
                <p className="mt-0.5">
                  인증 요청 이후 갱신 안 됨 · 재계산 필요
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            <SectionCard
              title="증명서 미리보기"
              desc="수강생이 보는 증명서 5탭과 동일한 콘텐츠 · 공개 payload 미리보기"
            >
              <Tabs
                variant="underline"
                aria-label="증명서 미리보기 탭"
                className="-mt-2 mb-4"
                items={TABS.map((t, i) => ({ value: String(i), label: t }))}
                value={String(tab)}
                onChange={(v) => setTab(Number(v))}
              />

              {tab !== 0 ? (
                <p className="text-fg-subtle py-8 text-center text-sm">
                  {TABS[tab]} 탭은 종합 요약과 동일 구조 — 상세 준비 중
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <KpiCard
                      label="교육시간"
                      value={`${d.metrics.trainingHours}h`}
                      hint="HRD 기준"
                    />
                    <KpiCard
                      label="출석률"
                      value={`${(d.metrics.attendance * 100).toFixed(1)}%`}
                      tone={d.metrics.attendance >= 0.8 ? 'success' : 'warning'}
                      hint={
                        d.metrics.attendance >= 0.8
                          ? '수료 기준(80%) 충족'
                          : '수료 기준(80%) 미달'
                      }
                    />
                    <KpiCard
                      label="시험 평균"
                      value={d.metrics.quizAvg}
                      hint="100점 만점"
                    />
                    <KpiCard
                      label="제출률"
                      value={`${Math.round(d.metrics.submissionRate * 100)}%`}
                      hint={d.metrics.submissionRaw}
                    />
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-fg text-sm font-bold">
                        6축 점수
                      </span>
                      <span className="text-fg-subtle text-xs">
                        평균{' '}
                        <span className="text-fg font-bold">{d.skillAvg}</span>{' '}
                        / 100
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {d.skills.map((s) => (
                        <div key={s.key} className="flex items-center gap-3">
                          <span className="text-fg-muted w-12 shrink-0 text-xs">
                            {s.key}
                          </span>
                          <div className="bg-surface-muted h-2 flex-1 overflow-hidden rounded-full">
                            <div
                              className="bg-brand h-full rounded-full"
                              style={{ width: `${s.score}%` }}
                            />
                          </div>
                          <span className="text-fg w-7 shrink-0 text-right text-sm font-medium">
                            {s.score}
                          </span>
                          {s.confirmed && (
                            <StatusBadge label="conf" tone="success" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center gap-2">
                      <span className="text-fg text-sm font-bold">
                        공개 payload — JSON 미리보기
                      </span>
                      <StatusBadge label="민감정보 없음" tone="success" />
                    </div>
                    <pre className="bg-surface-muted text-fg-muted mt-2 overflow-x-auto rounded-lg p-3 text-xs">
                      {d.payloadPreview}
                    </pre>
                  </div>
                </>
              )}
            </SectionCard>

            <div className="flex flex-col gap-4">
              <section className="border-border bg-surface rounded-xl border p-5">
                <div className="flex items-center justify-between">
                  <span className="text-fg text-sm font-bold">
                    승인 필수 체크
                  </span>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      allPass ? 'text-success' : 'text-warning',
                    )}
                  >
                    {passCount} / {d.approvalChecks.length}
                  </span>
                </div>
                <ul className="mt-3 flex flex-col gap-3">
                  {checks.map((c) => (
                    <li key={c.key} className="flex items-start gap-2">
                      {c.pass ? (
                        <Check className="text-success mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <X className="text-danger mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <div>
                        <p className="text-fg text-sm font-medium">{c.label}</p>
                        <p className="text-fg-subtle text-xs">{c.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border-border bg-surface rounded-xl border p-5">
                <span className="text-fg text-sm font-bold">
                  위험 플래그 {d.riskFlags.length}종
                </span>
                <ul className="mt-3 flex flex-col gap-3">
                  {d.riskFlags.map((r) => (
                    <li
                      key={r.label}
                      className="flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-fg text-sm font-medium">{r.label}</p>
                        <p className="text-fg-subtle text-xs">{r.detail}</p>
                      </div>
                      <StatusBadge
                        label={`${r.count}건`}
                        tone={r.count > 0 ? 'warning' : 'neutral'}
                      />
                    </li>
                  ))}
                </ul>
              </section>

              {d.martStale && (
                <section className="border-warning bg-warning-bg rounded-xl border p-5">
                  <p className="text-warning text-sm font-bold">
                    마트 미갱신 — 재계산 필요
                  </p>
                  <p className="text-fg-muted mt-2 text-xs">
                    마지막 갱신 {d.martLastRefreshed}
                  </p>
                  <p className="text-fg-muted text-xs">
                    요청 시점 {d.requestedAt} (이후)
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={() => setOpenModal('mart')}
                  >
                    <RotateCw className="h-4 w-4" /> 재계산 요청
                  </Button>
                </section>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard
              title="점수 근거"
              desc="6축 점수가 어떤 산출물·평판·코멘트로 산정됐는지 추적"
            >
              <ul className="flex flex-col">
                {d.scoreEvidence.map((e) => (
                  <li
                    key={e.skill}
                    className="border-divider border-b py-3 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <p className="text-fg text-sm font-medium">{e.skill}</p>
                    <p className="text-fg-subtle text-xs">{e.basis}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              title="산출물 승인 상태"
              desc="대표 근거 산출물의 강사·매니저 승인 여부"
            >
              <ul className="flex flex-col">
                {d.artifactApprovals.map((a) => (
                  <li
                    key={a.title}
                    className="border-divider flex items-center justify-between gap-2 border-b py-3 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="text-fg text-sm font-medium">{a.title}</p>
                      <p className="text-fg-subtle text-xs">{a.by}</p>
                    </div>
                    <StatusBadge
                      label={a.status === 'approved' ? '승인' : '미검증'}
                      tone={a.status === 'approved' ? 'success' : 'warning'}
                    />
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="감사 로그" desc="본 인증 요청의 처리 이력">
              <ul className="flex flex-col">
                {d.auditLog.map((l) => (
                  <li
                    key={`${l.at}-${l.action}`}
                    className="border-divider border-b py-3 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <p className="text-fg-subtle text-xs">
                      {l.at} · {l.actor}
                    </p>
                    <p className="text-fg mt-0.5 text-sm">{l.action}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          <div className="bg-brand-deep text-on-color mt-6 flex items-center justify-between gap-4 rounded-xl px-6 py-4">
            <div className="text-xs">
              <p className="font-bold">
                {allPass
                  ? '승인 조건 충족'
                  : '승인 조건 미충족 — 마트 미갱신·결측 보완 권장'}
              </p>
              <p className="text-on-color/70 mt-0.5">
                승인 시 CertificateSnapshot 자동 생성 · 보완 요청 시 reviewing →
                changes_requested 전이
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                onClick={() => setOpenModal('changes')}
              >
                보완 요청
              </Button>
              <Button
                disabled={!allPass}
                onClick={() => setOpenModal('approve')}
              >
                정식 인증 승인
              </Button>
            </div>
          </div>

          <ChangesRequestModal
            open={openModal === 'changes'}
            onClose={() => setOpenModal(null)}
            student={{ name: d.student.name, cohort: d.student.cohort }}
            onSubmitted={() =>
              reviewAction.mutate(
                { reviewId, next: 'changes_requested' },
                { onSuccess: () => navigate('/admin/certificates/reviews') },
              )
            }
          />
          <ApproveModal
            open={openModal === 'approve'}
            onClose={() => setOpenModal(null)}
            student={{ name: d.student.name, cohort: d.student.cohort }}
            onSubmitted={() =>
              reviewAction.mutate(
                { reviewId, next: 'certified' },
                { onSuccess: () => navigate('/admin/certificates/reviews') },
              )
            }
          />
          <MartRecalcModal
            open={openModal === 'mart'}
            onClose={() => setOpenModal(null)}
            onSubmitted={() => setMartResolved(true)}
          />
        </div>
      )}
    </DataBoundary>
  )
}
