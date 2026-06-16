import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useTsCase } from '../api/troubleshooting'
import { TsToast } from './components/TsToast'
import type { TsCaseDetail, Tone } from './types'

// 트러블슈팅 사례 상세 (/student/troubleshooting/:id) + 인증 요청 모달(?modal=certify) — Figma 3283:5853·3283:5949.
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}

export default function CaseDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data, isPending, isError, refetch } = useTsCase(id)
  const [open, setOpen] = useState(params.get('modal') === 'certify')
  const [toast, setToast] = useState<string | null>(null)
  usePageHeader(
    '트러블슈팅 사례 상세',
    '작성한 사례를 확인하고 발표 연결과 인증 요청을 상세 단계에서 진행해요.',
  )

  if (isPending)
    return <div className="text-fg-muted p-8">사례를 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="사례를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const closeModal = () => {
    setOpen(false)
    if (params.get('modal')) setParams({}, { replace: true })
  }

  // 인증 완료 사례는 인증 요청 대신 변경 제안으로만 수정 가능.
  const isCertified = data.status === 'certified'
  const goChangeRequest = () =>
    navigate(`/student/troubleshooting/${data.id}/change-requests/new`)
  // 발표 연결: 전용 화면이 Figma에 없어(상세 내 stat만 존재) 안내 토스트로 처리.
  const notifyPresentation = () =>
    setToast('발표 연결 화면은 아직 준비되지 않았어요 (Figma 미설계).')
  const onCertifyRequested = () => {
    closeModal()
    setToast('인증 요청이 접수되었습니다. 강사 검토 큐로 전달됐어요.')
  }

  const stats = [
    { label: '인증 상태', value: data.statusLabel, tone: 'accent' as Tone },
    {
      label: '발표 연결',
      value: data.presentationLinked ? '연결됨' : '미연결',
      tone: (data.presentationLinked ? 'success' : 'danger') as Tone,
    },
    {
      label: '독립 해결',
      value: data.independent ? '예' : '아니오',
      tone: 'brand' as Tone,
    },
    { label: '소요 일수', value: data.days, tone: 'info' as Tone },
  ]

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[11px] font-bold',
              CHIP.accent,
            )}
          >
            {data.statusLabel}
          </span>
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[11px] font-bold',
              CHIP[data.categoryTone],
            )}
          >
            {data.category}
          </span>
          {!data.presentationLinked && (
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[11px] font-bold',
                CHIP.warning,
              )}
            >
              발표 미연결
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/student/troubleshooting')}
            className="border-border text-fg-muted rounded-lg border px-4 py-2 text-[12px] font-semibold"
          >
            목록으로
          </button>
          <button
            type="button"
            onClick={notifyPresentation}
            className="border-border text-fg-muted rounded-lg border px-4 py-2 text-[12px] font-semibold"
          >
            발표 연결
          </button>
          {isCertified ? (
            <button
              type="button"
              onClick={goChangeRequest}
              className="bg-brand rounded-lg px-4 py-2 text-[12px] font-bold text-white"
            >
              변경 제안
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="bg-brand rounded-lg px-4 py-2 text-[12px] font-bold text-white"
            >
              인증 요청
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={cn(card, 'flex flex-col gap-2')}>
            <span className="text-fg-muted text-[12px]">{s.label}</span>
            <span
              className={cn(
                'text-[20px] font-bold',
                s.tone === 'danger' ? 'text-danger' : 'text-fg',
              )}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-5')}>
          <div className="flex flex-col gap-1">
            <span className="text-fg-subtle text-[11px]">사례 제목</span>
            <h2 className="text-fg text-[18px] font-bold">{data.title}</h2>
          </div>
          {[
            { label: '상황', text: data.situation },
            { label: '해결', text: data.resolution },
            { label: '결과', text: data.result },
          ].map((b) => (
            <div
              key={b.label}
              className="border-divider flex flex-col gap-1.5 border-t pt-4"
            >
              <span className="text-fg text-[14px] font-bold">{b.label}</span>
              <p className="text-fg-muted text-[13px] leading-6">{b.text}</p>
            </div>
          ))}
          <div className="border-divider flex items-center gap-2 border-t pt-4">
            <span className="text-fg-subtle text-[11px]">첨부 근거</span>
            {data.attachments.map((a) => (
              <span
                key={a.label}
                className="bg-surface-muted text-fg-muted rounded-md px-2 py-1 text-[11px] font-medium"
              >
                {a.label}
              </span>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-4 lg:w-[320px]">
          <section className={cn(card, 'flex flex-col gap-3')}>
            <span className="text-fg text-[14px] font-bold">
              인증 요청 준비
            </span>
            <span className="text-fg-subtle text-[11px]">
              작성 폼이 아니라 상세 화면에서 발표 연결과 인증 요청을 진행해요.
            </span>
            {data.checklist.map((c, i) => {
              const done = c.status.tone === 'success'
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                      done
                        ? 'bg-success text-white'
                        : 'bg-warning-bg text-warning',
                    )}
                  >
                    {done ? '✓' : '!'}
                  </span>
                  <span className="text-fg flex-1 text-[12px] font-medium">
                    {c.label}
                  </span>
                </div>
              )
            })}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={notifyPresentation}
                className="border-border text-fg flex-1 rounded-lg border py-2.5 text-[12px] font-semibold"
              >
                발표 연결
              </button>
              {isCertified ? (
                <button
                  type="button"
                  onClick={goChangeRequest}
                  className="bg-brand flex-1 rounded-lg py-2.5 text-[12px] font-bold text-white"
                >
                  변경 제안
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="bg-brand flex-1 rounded-lg py-2.5 text-[12px] font-bold text-white"
                >
                  인증 요청
                </button>
              )}
            </div>
          </section>

          <section className={cn(card, 'flex flex-col gap-3')}>
            <span className="text-fg text-[14px] font-bold">상태 이력</span>
            {data.timeline.map((t) => (
              <div key={t.key} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    'mt-1 size-2.5 shrink-0 rounded-full',
                    t.state === 'current'
                      ? 'bg-brand'
                      : t.state === 'done'
                        ? 'bg-success'
                        : 'bg-border',
                  )}
                />
                <div className="flex flex-col">
                  <span
                    className={cn(
                      'text-[13px] font-semibold',
                      t.state === 'todo' ? 'text-fg-subtle' : 'text-fg',
                    )}
                  >
                    {t.label}
                  </span>
                  <span className="text-fg-subtle text-[11px]">{t.sub}</span>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {open && (
        <CertifyModal
          data={data}
          onClose={closeModal}
          onConfirm={onCertifyRequested}
        />
      )}
      {toast && <TsToast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function CertifyModal({
  data,
  onClose,
  onConfirm,
}: {
  data: TsCaseDetail
  onClose: () => void
  onConfirm: () => void
}) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    data.certChecklist.map(() => true),
  )
  const allChecked = checked.every(Boolean)
  const toggle = (i: number) =>
    setChecked((p) => p.map((v, j) => (j === i ? !v : v)))
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-surface flex w-[440px] max-w-full flex-col gap-4 rounded-2xl p-6 shadow-[0px_20px_48px_0px_rgba(18,23,38,0.24)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-fg text-[18px] font-bold">인증 요청</h2>
          <span className="text-fg-muted text-[12px]">
            발표 연결과 체크리스트를 확인하고 강사 검토 큐로 제출합니다.
          </span>
        </div>
        <Field label="발표 연결" value={data.certPresentation} />
        <Field label="교과목/검토자" value={data.certReviewer} />
        <div className="flex flex-col gap-2">
          <span className="text-fg text-[12px] font-bold">
            요청 전 체크리스트
          </span>
          {data.certChecklist.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className="flex items-start gap-2 text-left"
            >
              <span
                className={cn(
                  'mt-px flex size-4 shrink-0 items-center justify-center rounded text-[10px] text-white transition-colors',
                  checked[i] ? 'bg-success' : 'border-border bg-surface border',
                )}
              >
                {checked[i] && '✓'}
              </span>
              <span className="text-fg-muted text-[12px] leading-4">{c}</span>
            </button>
          ))}
        </div>
        <div className="bg-info-bg/60 text-fg-muted rounded-lg p-3 text-[11px] leading-4">
          제출 후 상태가 submitted가 되며, 인증 완료 전까지 보완 요청을 받을 수
          있습니다.
        </div>
        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!allChecked}
            className="bg-brand h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            인증 요청
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-fg text-[12px] font-bold">{label}</span>
      <span className="border-border bg-surface text-fg rounded-[10px] border px-4 py-3 text-[13px]">
        {value}
      </span>
    </div>
  )
}
