import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useCertPublication } from '../api/certificate'

// 공개 설정 (/student/certificate/publication) — Figma 255:27.
const card =
  'bg-surface rounded-2xl shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

function Toggle({
  on,
  locked,
  onClick,
}: {
  on: boolean
  locked?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      aria-pressed={on}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        on ? 'bg-brand' : 'bg-surface-muted',
        locked && 'opacity-50',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-5 rounded-full bg-white shadow transition-all',
          on ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  )
}

export default function PublicationPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useCertPublication()
  const [over, setOver] = useState<Record<string, boolean>>({})
  const toast = useToast()
  usePageHeader('공개 설정', '외부 검증 URL과 동료 평가 공개 여부를 관리합니다')

  const isOn = (id: string, def: boolean) => over[id] ?? def
  const set = (id: string, def: boolean) =>
    setOver((p) => ({ ...p, [id]: !isOn(id, def) }))
  const urlOn = data ? isOn(data.urlToggle.id, data.urlToggle.on) : false

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="공개 설정을 불러오는 중…"
      errorTitle="공개 설정을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="flex flex-col gap-5 p-8 pb-24">
          {/* 발급 완료 배너 */}
          <section className="bg-brand flex items-center justify-between gap-4 rounded-2xl px-6 py-5 text-white">
            <div className="flex items-center gap-4">
              <span className="bg-surface text-brand flex size-16 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold">
                ✓
              </span>
              <div className="flex flex-col gap-1">
                <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                  <span className="size-1.5 rounded-full bg-white" />
                  {data.issuedBadge}
                </span>
                <span className="text-[20px] font-bold">
                  {data.issuedLabel}
                </span>
                <span className="text-[12px] text-white/85">
                  {data.issuedSub}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2.5">
              <div className="flex flex-col">
                <span className="text-[10px] tracking-wide text-white/60">
                  검증 ID
                </span>
                <span className="font-mono text-[13px] font-semibold">
                  {data.verifyId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/student/certificate')}
                className="flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5 text-[12px] font-semibold"
              >
                증명서 상세 보기 →
              </button>
            </div>
          </section>

          {/* 외부 검증 URL 공개 */}
          <section className={cn(card, 'flex flex-col')}>
            <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3">
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 text-[14px] font-bold">
                  {data.urlToggle.label}
                  <span className="bg-success-bg text-success rounded px-1.5 py-0.5 text-[11px] font-bold">
                    {data.urlToggle.badge}
                  </span>
                </span>
                <span className="text-fg-muted text-[12px]">
                  {data.urlToggle.sub}
                </span>
              </div>
              <Toggle
                on={urlOn}
                onClick={() => set(data.urlToggle.id, data.urlToggle.on)}
              />
            </div>
            <div className="bg-surface-muted/40 text-fg-muted mx-6 mb-5 flex items-start gap-2 rounded-xl px-3.5 py-3 text-[12px] leading-5">
              <span className={cn(urlOn ? 'text-success' : 'text-fg-subtle')}>
                ●
              </span>
              {urlOn
                ? '현재 공개 — 외부 검증자가 URL에 접근하면 아래 공개 미리보기 화면이 표시됩니다.'
                : data.urlToggle.info}
            </div>
          </section>

          {/* 성장·평판 공개 항목 */}
          <section className={cn(card, 'flex flex-col')}>
            <div className="flex flex-col gap-0.5 px-6 pt-5 pb-1">
              <span className="text-fg text-[15px] font-bold">
                성장·평판 공개 항목
              </span>
              <span className="text-fg-subtle text-[12px]">
                동료 평가 / ShortComment 공개 여부 · 기본 OFF · 수료일
                다음날부터 활성
              </span>
            </div>
            {data.growthToggles.map((t) => (
              <Fragment key={t.id}>
                <div className="bg-divider mt-3 h-px w-full" />
                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-fg text-[13px] font-semibold">
                      {t.label}
                    </span>
                    <span className="text-fg-muted text-[12px]">{t.sub}</span>
                  </div>
                  <Toggle
                    on={isOn(t.id, t.on)}
                    onClick={() => set(t.id, t.on)}
                  />
                </div>
              </Fragment>
            ))}
            <div className="bg-divider h-px w-full" />
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 text-[13px] font-semibold">
                  {data.recommendRow.label}
                  <span className="border-border text-fg-subtle rounded border px-1.5 py-0.5 text-[10px] font-medium">
                    {data.recommendRow.tag}
                  </span>
                </span>
                <span className="text-fg-muted text-[12px]">
                  {data.recommendRow.sub}
                </span>
              </div>
              <span className="bg-surface-muted text-fg-muted shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold">
                {data.recommendRow.chip}
              </span>
            </div>
          </section>

          {/* 검증 정보 + 공개 미리보기 */}
          <div className="flex flex-col gap-4 lg:flex-row">
            <section className={cn(card, 'flex flex-1 flex-col gap-3 p-6')}>
              <div className="flex flex-col gap-0.5">
                <span className="text-fg text-[15px] font-bold">검증 정보</span>
                <span className="text-fg-subtle text-[12px]">
                  외부 검증자가 본 URL과 QR로 인증을 확인합니다
                </span>
              </div>
              <span className="text-fg-subtle text-[11px]">공개 URL</span>
              <div className="border-border flex items-center gap-2 rounded-lg border px-3 py-2.5">
                <span className="text-fg truncate text-[12px]">
                  {data.publicUrl}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(data.publicUrl)
                    toast.success('검증 URL이 복사됐어요')
                  }}
                  className="text-brand ml-auto flex shrink-0 items-center gap-1 text-[11px] font-bold"
                >
                  <span className="text-[12px]">⧉</span> 복사
                </button>
              </div>
              <div className="flex items-center gap-5 pt-1">
                <span className="bg-fg grid size-[140px] shrink-0 grid-cols-[repeat(14,1fr)] gap-[1px] rounded-lg p-2">
                  {Array.from({ length: 196 }, (_, i) => (
                    <span
                      key={i}
                      className={
                        (i * 7 + (i % 5) * 3) % 3 === 0
                          ? 'bg-surface rounded-[0.5px]'
                          : 'bg-transparent'
                      }
                    />
                  ))}
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <span className="text-fg text-[12px] font-bold">
                      QR 코드
                    </span>
                    <span className="text-fg-subtle text-[11px]">
                      이력서·명함 인쇄용
                    </span>
                  </div>
                  <span className="text-fg-muted text-[11px] leading-4">
                    외부 검증 URL을 QR 코드로 스캔하면 동일한 공개 페이지로
                    이동합니다. PNG/SVG 다운로드 가능.
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => toast.info('PNG를 내려받았어요')}
                      className={buttonClass({ size: 'sm' })}
                    >
                      PNG 다운로드
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info('SVG를 내려받았어요')}
                      className="border-border text-fg rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
                    >
                      SVG
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className={cn(card, 'flex flex-1 flex-col gap-3 p-6')}>
              <div className="flex flex-col gap-0.5">
                <span className="text-fg text-[15px] font-bold">
                  공개 미리보기
                </span>
                <span className="text-fg-subtle text-[12px]">
                  외부 검증자가 URL로 접근 시 볼 화면
                </span>
              </div>
              {/* 브라우저 목업 */}
              <div className="border-border overflow-hidden rounded-xl border">
                <div className="bg-surface-muted/60 flex items-center gap-2.5 px-4 py-2.5">
                  <span className="flex gap-1.5">
                    <span className="bg-danger/50 size-2 rounded-full" />
                    <span className="bg-warning/60 size-2 rounded-full" />
                    <span className="bg-success/60 size-2 rounded-full" />
                  </span>
                  <span className="text-fg-subtle text-[11px]">
                    {data.publicUrl.replace(/^https?:\/\//, '')}
                  </span>
                </div>
                <div className="bg-surface flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-success flex size-9 items-center justify-center rounded-lg text-[15px] font-bold text-white">
                      ✓
                    </span>
                    <div className="flex flex-col">
                      <span className="text-fg-subtle text-[11px] font-semibold">
                        PLAYDATA · 정식 인증
                      </span>
                      <span className="text-fg text-[15px] font-bold">
                        {data.preview.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-fg-muted text-[12px]">
                    {data.preview.period}
                  </span>
                  <div className="bg-divider h-px w-full" />
                  <div className="flex items-center justify-between">
                    {data.preview.metrics.map((m) => (
                      <div key={m.l} className="flex flex-col">
                        <span className="text-fg text-[16px] font-bold">
                          {m.v}
                        </span>
                        <span className="text-fg-subtle text-[10px]">
                          {m.l}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-fg-subtle flex items-center gap-2 text-[12px]">
                <span>👁</span>
                {urlOn
                  ? 'URL 공개가 ON이라 위 화면이 외부에 공개됩니다.'
                  : 'URL 공개가 OFF여서 비공개 안내만 노출됩니다. ON으로 변경 시 위 화면이 외부에 공개됩니다.'}
              </span>
            </section>
          </div>

          {/* 공개 ON / OFF 차이 */}
          <section className={cn(card, 'flex flex-col gap-4 p-6')}>
            <div className="flex flex-col gap-0.5">
              <span className="text-fg text-[15px] font-bold">
                공개 ON / OFF 차이
              </span>
              <span className="text-fg-subtle text-[12px]">
                토글 상태에 따라 외부 검증자에게 표시되는 페이로드
              </span>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="border-success/40 bg-success-bg/30 flex flex-1 flex-col gap-2.5 rounded-xl border p-4">
                <span className="bg-success w-fit rounded px-2 py-0.5 text-[11px] font-bold text-white">
                  ON
                </span>
                {data.onItems.map((it) => (
                  <span
                    key={it.text}
                    className="text-fg flex items-start gap-2 text-[12px]"
                  >
                    <span
                      className={
                        it.mark === 'check' ? 'text-success' : 'text-fg-subtle'
                      }
                    >
                      {it.mark === 'check' ? '✓' : '·'}
                    </span>
                    {it.text}
                  </span>
                ))}
              </div>
              <div className="bg-surface-muted/30 flex flex-1 flex-col gap-2.5 rounded-xl p-4">
                <span className="bg-fg-subtle w-fit rounded px-2 py-0.5 text-[11px] font-bold text-white">
                  OFF
                </span>
                {data.offItems.map((it) => (
                  <span
                    key={it.text}
                    className="text-fg-muted flex items-start gap-2 text-[12px]"
                  >
                    <span
                      className={
                        it.mark === 'check' ? 'text-success' : 'text-fg-subtle'
                      }
                    >
                      {it.mark === 'check' ? '✓' : '·'}
                    </span>
                    {it.text}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* 개인정보 안내 */}
          <div className="bg-info-bg border-info flex items-center gap-3 rounded-[14px] border p-4">
            <span className="text-info shrink-0 text-[18px] font-bold">ⓘ</span>
            <div className="flex flex-1 flex-col">
              <span className="text-fg text-[13px] font-bold">
                개인정보 안내
              </span>
              <span className="text-fg-muted text-[12px] leading-5">
                프로젝트 카드의 전화번호·이메일은 자동 마스킹됩니다. 공개
                페이로드는 PII 검사 후 운영자 최신화 작업 이후 외부에
                반영됩니다.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/student/profile')}
              className="border-info text-info shrink-0 rounded-lg border px-3 py-2 text-[12px] font-semibold"
            >
              개인정보 검사 결과 →
            </button>
          </div>

          {/* 하단 액션바 */}
          <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
            <div className="flex flex-col">
              <span className="text-[13px] font-bold">
                외부 검증 URL {urlOn ? '공개' : '비공개'} · 동료 평가 비공개
              </span>
              <span className="text-[11px] text-white/70">
                토글 변경 시 운영자 최신화 작업 이후 외부 증명서에 반영됩니다
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  window.open(data.verifyUrl, '_blank', 'noopener')
                }
                className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
              >
                공개 페이지 미리보기
              </button>
              <button
                type="button"
                onClick={() =>
                  toast.success(
                    '공개 설정을 저장했어요 · 최신화 이후 외부 반영',
                  )
                }
                className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold"
              >
                설정 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </DataBoundary>
  )
}
