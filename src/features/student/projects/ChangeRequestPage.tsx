import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

// 프로젝트 변경 제안 (/student/projects/:projectId/change-requests/new) — Figma 345:1083.
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const ITEMS = ['제목', '설명', '팀원', '기여도', '성과', '산출물']
const DIFF: Record<string, { before: string; after: string }> = {
  설명: {
    before: '주문·결제·재고 도메인을 분리한 MSA 구조의 백엔드 프로젝트입니다.',
    after:
      '주문·결제·재고 도메인을 분리한 MSA 구조의 백엔드 프로젝트입니다. 결제 모듈은 이벤트 기반 비동기 처리로 재설계했습니다.',
  },
  산출물: {
    before: 'API 명세서 v1.pdf',
    after: 'API 명세서 v2.pdf — 결제 비동기 호출 반영',
  },
}

export default function ChangeRequestPage() {
  const navigate = useNavigate()
  const [reason, setReason] = useState(
    '결제 모듈 리팩터링 결과를 설명에 반영하고, 최신 API 명세서로 산출물을 교체하기 위함입니다.',
  )
  const [selected, setSelected] = useState<string[]>(['설명', '산출물'])
  const toggle = (v: string) =>
    setSelected((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))

  return (
    <div className="flex flex-col gap-5 p-8 pb-24">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-[22px] font-bold">프로젝트 변경 제안</h1>
        <p className="text-fg-muted text-[12px]">
          인증 완료된 프로젝트의 수정·삭제를 강사에게 제안합니다. 승인 시 원본에
          반영됩니다.
        </p>
      </div>

      <div className="bg-info-bg/60 flex flex-col gap-1 rounded-xl p-4">
        <span className="text-info text-[12px] font-bold">
          ⓘ 인증 완료된 프로젝트입니다
        </span>
        <span className="text-fg-muted text-[11px]">
          변경 제안은 강사 검토·승인 후 원본에 반영됩니다. 반려 시 사유 코멘트가
          전달됩니다.
        </span>
      </div>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center gap-2">
          <span className="text-fg text-[15px] font-bold">
            주문 관리 MSA 백엔드
          </span>
          <span className="bg-success-bg text-success rounded px-1.5 py-0.5 text-[10px] font-bold">
            인증 완료
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">
          예칼 PM · 팀 프로젝트 4명 · 2026-04-01 ~ 2026-05-30 · 인증일
          2026-05-08
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-fg text-[13px] font-bold">변경 사유</span>
          <span className="text-danger text-[11px]">필수</span>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border-border bg-surface text-fg focus:border-brand min-h-[100px] w-full resize-none rounded-[10px] border px-4 py-3 text-[14px] leading-6 focus:outline-none"
        />
      </section>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center gap-2">
          <span className="text-fg text-[15px] font-bold">변경 항목 선택</span>
          <span className="text-fg-subtle text-[11px]">
            변경할 항목을 선택하세요
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ITEMS.map((it) => {
            const on = selected.includes(it)
            return (
              <button
                key={it}
                type="button"
                onClick={() => toggle(it)}
                className={cn(
                  'rounded-lg border px-3.5 py-2 text-[12px] font-semibold',
                  on
                    ? 'border-brand bg-brand text-white'
                    : 'border-border text-fg-muted hover:border-brand/50',
                )}
              >
                {it}
              </button>
            )
          })}
        </div>
      </section>

      <section className={cn(card, 'flex flex-col gap-4')}>
        <span className="text-fg text-[15px] font-bold">변경 전 / 후 비교</span>
        {selected.length === 0 && (
          <span className="text-fg-subtle text-[12px]">
            변경 항목을 선택하면 전/후 비교가 표시됩니다.
          </span>
        )}
        {selected.map((it) => {
          const diff = DIFF[it]
          return (
            <div key={it} className="flex flex-col gap-2">
              <span className="bg-brand/10 text-brand w-fit rounded px-2 py-0.5 text-[11px] font-bold">
                {it}
              </span>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="border-border bg-surface-muted/40 flex flex-col gap-1 rounded-[10px] border p-3.5">
                  <span className="text-fg-subtle text-[11px]">변경 전</span>
                  <span className="text-fg-muted text-[12px] leading-5">
                    {diff?.before ?? '기존 값'}
                  </span>
                </div>
                <div className="border-brand/40 bg-brand/5 flex flex-col gap-1 rounded-[10px] border p-3.5">
                  <span className="text-brand text-[11px] font-semibold">
                    변경 후
                  </span>
                  <span className="text-fg text-[12px] leading-5">
                    {diff?.after ?? '새 값을 입력하세요'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* 하단 액션바 */}
      <div className="bg-surface border-border fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl border px-6 py-4 shadow-[0px_12px_32px_0px_rgba(18,23,38,0.16)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border-border text-fg rounded-lg border px-4 py-2.5 text-[13px] font-semibold"
        >
          취소
        </button>
        <div className="flex items-center gap-4">
          <span className="text-fg-subtle text-[12px]">
            저장 시 강사에게 requested 상태로 전달됩니다
          </span>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold text-white"
          >
            변경 제안 저장
          </button>
        </div>
      </div>
    </div>
  )
}
