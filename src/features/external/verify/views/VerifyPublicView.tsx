import { Check, Hash } from 'lucide-react'
import type { CertifiedPublicResult } from '../types'
import { VerifyCertificateDoc } from './VerifyCertificateDoc'

/**
 * 공개 증명서 — 진본 배너 + 증명서 본문.
 *
 * <p>본문은 수강생 미리보기와 같은 히어로·탭·탭 콘텐츠를 그대로 쓴다.
 * 무결성 근거(해시·발급기관·인증일)는 배너가, 검증 ID 는 히어로가 보여준다.</p>
 */
export function VerifyPublicView({
  result,
}: {
  result: CertifiedPublicResult
  publicToken: string
}) {
  const p = result.publicPayload

  return (
    // 최대 1440 까지 넓히고 그 아래는 화면을 따라 줄인다. 여백도 폭에 맞춰 단계적으로.
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 pt-8 pb-[60px] sm:px-6 lg:px-8 lg:pt-12">
      {/* Hero 진본 배너 — brand bg, certified·해시 칩 + 우측 메타 3쌍(흰 세로 구분선). */}
      <section className="bg-brand flex flex-wrap items-center justify-between gap-6 rounded-2xl px-7 py-[26px] shadow-[0_2px_8px_rgba(18,23,38,0.04)]">
        <div className="flex flex-col gap-2">
          <span className="text-on-color text-[11px] font-semibold tracking-[1.98px]">
            PLAYDATA · 수강 역량 증명서
          </span>
          <h1 className="text-on-color text-2xl leading-[30px] font-bold">
            이 증명서는 정식으로 발급된 진본입니다
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-success-bg text-success flex items-center gap-1 rounded-[7px] px-2.5 py-[5px] text-xs font-bold">
              <Check size={11} aria-hidden />
              certified · 진본 검증 완료
            </span>
            {/* 해시 칩 — 유색 배경 위 '배경' 요소라 on-color ADR 기준 bg-surface 유지. */}
            <span className="bg-surface text-fg flex items-center gap-1 rounded-[7px] px-2.5 py-[5px] text-[11px] font-medium">
              <Hash size={11} aria-hidden />
              snapshotHash {result.snapshotHash}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-[18px]">
          {[
            // 검증 ID 는 아래 증명서 히어로가 이미 보여준다 — 배너에서는 뺀다.
            { label: '발급기관', value: p.issuer },
            { label: '인증일', value: p.certifiedDate },
          ].map((meta, i) => (
            <div key={meta.label} className="flex items-center gap-[18px]">
              {i > 0 && (
                // 세로 구분선 — Figma surface 바인딩이나 brand 위 장식선이라 on-color/40로
                // 매핑(2026-06-08 흰색 의미분리 ADR 검토 대상).
                <span className="bg-on-color/40 h-8 w-px" aria-hidden />
              )}
              <div className="flex flex-col items-end gap-1">
                <span className="text-on-color text-[10px] font-medium tracking-[0.6px]">
                  {meta.label}
                </span>
                <span className="text-on-color text-[13px] font-bold">
                  {meta.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 증명서 본문 — 수강생 미리보기와 같은 히어로·탭·탭 콘텐츠를 그대로 쓴다. */}
      <VerifyCertificateDoc
        payload={p}
        verificationId={result.verificationId}
      />

    </main>
  )
}
