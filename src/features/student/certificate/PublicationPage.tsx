import { Fragment, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useCertPublication } from '../api/certificate'

// 공개 설정 (/student/certificate/publication) — Figma 255:27.
const card =
  'border-border bg-surface rounded-2xl border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

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
  const { data, isPending, isError, refetch } = useCertPublication()
  const [over, setOver] = useState<Record<string, boolean>>({})
  const toast = useToast()
  usePageHeader('공개 설정')

  if (isPending)
    return <div className="text-fg-muted p-8">공개 설정을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="공개 설정을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }
  const isOn = (id: string, def: boolean) => over[id] ?? def

  return (
    <div className="flex flex-col gap-5 p-8 pb-24">
      {/* 발급 완료 배너 */}
      <section className="bg-success flex items-center gap-3.5 rounded-2xl px-6 py-5 text-white">
        <span className="bg-surface text-success flex size-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold">
          ✓
        </span>
        <div className="flex flex-col">
          <span className="text-[16px] font-bold">{data.issuedLabel}</span>
          <span className="text-[12px] text-white/85">{data.issuedSub}</span>
        </div>
      </section>

      {/* 공개 토글 */}
      <section className={cn(card, 'flex flex-col')}>
        {data.toggles.map((t, i) => (
          <Fragment key={t.id}>
            {i > 0 && <div className="bg-divider h-px w-full" />}
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-fg text-[14px] font-semibold">
                  {t.label}
                  {t.locked && (
                    <span className="text-fg-subtle ml-2 text-[11px] font-medium">
                      고정
                    </span>
                  )}
                </span>
                <span className="text-fg-muted text-[12px]">{t.sub}</span>
              </div>
              <Toggle
                on={isOn(t.id, t.on)}
                locked={t.locked}
                onClick={() =>
                  setOver((p) => ({ ...p, [t.id]: !isOn(t.id, t.on) }))
                }
              />
            </div>
          </Fragment>
        ))}
      </section>

      {/* 검증 정보 + 미리보기 */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-3 p-6')}>
          <span className="text-fg text-[15px] font-bold">검증 정보</span>
          <div className="flex items-center gap-4">
            <span className="bg-fg grid size-20 shrink-0 grid-cols-4 gap-0.5 rounded-lg p-1.5">
              {Array.from({ length: 16 }, (_, i) => (
                <span
                  key={i}
                  className={
                    (i * 5 + 2) % 3 === 0
                      ? 'bg-surface rounded-[1px]'
                      : 'bg-transparent'
                  }
                />
              ))}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-fg-subtle text-[11px]">외부 검증 URL</span>
              <div className="border-border flex items-center gap-2 rounded-lg border px-3 py-2">
                <span className="text-fg truncate text-[12px]">
                  {data.verifyUrl}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    // 상대 경로 mock을 현재 호스트 기준 절대 URL로 — 운영 스냅샷 복사와 동일 패턴
                    void navigator.clipboard?.writeText(
                      new URL(data.verifyUrl, window.location.origin).href,
                    )
                    toast.success('검증 URL이 복사됐어요')
                  }}
                  className="text-brand ml-auto shrink-0 text-[11px] font-bold"
                >
                  복사
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          className={cn(
            card,
            'bg-surface-muted/40 flex flex-1 flex-col gap-3 p-6',
          )}
        >
          <span className="text-fg text-[15px] font-bold">공개 미리보기</span>
          <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <span className="bg-brand flex size-8 items-center justify-center rounded-full text-[12px] font-bold text-white">
                {data.preview.name.slice(0, 1)}
              </span>
              <div className="flex flex-col">
                <span className="text-fg text-[13px] font-bold">
                  {data.preview.name}
                </span>
                <span className="text-fg-subtle text-[11px]">
                  {data.preview.course}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { l: '종합', v: data.preview.score },
                { l: '출석', v: data.preview.attendance },
                { l: '프로젝트', v: data.preview.projects },
                { l: '등급', v: data.preview.grade },
              ].map((m) => (
                <div
                  key={m.l}
                  className="bg-surface-muted flex flex-col rounded-lg py-2"
                >
                  <span className="text-fg text-[16px] font-bold">{m.v}</span>
                  <span className="text-fg-subtle text-[10px]">{m.l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 공개 ON/OFF 차이 */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <section
          className={cn(
            card,
            'border-success/40 flex flex-1 flex-col gap-2.5 p-6',
          )}
        >
          <span className="text-success text-[14px] font-bold">
            공개 시 노출
          </span>
          {data.onItems.map((it) => (
            <span
              key={it}
              className="text-fg flex items-start gap-2 text-[12px]"
            >
              <span className="text-success">✓</span>
              {it}
            </span>
          ))}
        </section>
        <section className={cn(card, 'flex flex-1 flex-col gap-2.5 p-6')}>
          <span className="text-fg-muted text-[14px] font-bold">
            비공개 항목 (항상 보호)
          </span>
          {data.offItems.map((it) => (
            <span
              key={it}
              className="text-fg-muted flex items-start gap-2 text-[12px]"
            >
              <span className="text-fg-subtle">✕</span>
              {it}
            </span>
          ))}
        </section>
      </div>

      {/* 개인정보 안내 */}
      <div className="bg-info-bg border-info flex items-center gap-3 rounded-[14px] border p-4">
        <span className="text-info shrink-0 text-[16px] font-bold">ⓘ</span>
        <span className="text-fg-muted text-[12px] leading-5">
          개인정보 안내 — 외부 공개 시에도 연락처·이메일 등 식별 정보는 공개되지
          않습니다. 공개 항목은 언제든 토글로 변경할 수 있으며, 변경 즉시 검증
          페이지에 반영됩니다.
        </span>
      </div>

      {/* 하단 액션바 */}
      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <div className="flex flex-col">
          <span className="text-[13px] font-bold">
            외부 공개 설정 · 토글을 켜야 검증 페이지에 노출됩니다
          </span>
          <span className="text-[11px] text-white/70">
            공개 적용 시 변경 내용이 검증 URL에 즉시 반영됩니다
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            공개 페이지 미리보기
          </button>
          <button
            type="button"
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold"
          >
            공개 적용
          </button>
        </div>
      </div>
    </div>
  )
}
