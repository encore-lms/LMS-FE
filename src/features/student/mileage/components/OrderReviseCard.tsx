import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { buttonClass } from '@/components/ui/buttonClass'
import { inputClass } from '@/components/ui/inputClass'
import { NumberInput } from '@/components/ui/NumberInput'
import { useToast } from '@/components/ui/use-toast'
import { useReviseMileageOrder, type MileageOrderRow } from '../../api/mileage'

// 매니저가 수정 요청한 구매 건 — 사유를 보여주고, 수량·구매 링크를 고쳐 다시 낸다.
// 예전에는 상태가 '검토 대기'로만 보여서 무엇을 요구받았는지도, 무엇을 할 수 있는지도 알 수 없었다.
export function OrderReviseCard({ order }: { order: MileageOrderRow }) {
  const toast = useToast()
  const revise = useReviseMileageOrder()
  const [lines, setLines] = useState(() =>
    (order.lines ?? []).map((l) => ({
      productId: l.productId,
      productName: l.productName,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      link: l.link ?? '',
    })),
  )

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  const setLine = (i: number, patch: Partial<(typeof lines)[number]>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const submit = () => {
    if (lines.some((l) => l.quantity < 1)) {
      toast.danger('수량은 1개 이상이어야 해요')
      return
    }
    revise.mutate(
      {
        orderId: order.id,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          link: l.link.trim() || undefined,
        })),
      },
      {
        onSuccess: () => toast.success('수정해서 다시 요청했어요'),
        onError: () => toast.danger('다시 요청하지 못했어요'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3.5 border-t border-dashed border-divider pt-3.5">
      <div className="bg-warning-bg/70 flex flex-col gap-1 rounded-xl px-3.5 py-3">
        <span className="text-warning flex items-center gap-1.5 text-[12px] font-bold">
          <AlertTriangle className="size-3.5" aria-hidden="true" />
          매니저가 수정을 요청했어요
        </span>
        <span className="text-fg-muted text-[12px] leading-5">
          {order.reviewNote?.trim() ||
            '매니저가 사유를 남기지 않았어요. 운영팀에 확인해 주세요.'}
        </span>
      </div>

      {lines.map((l, i) => (
        <div key={l.productId + i} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-fg min-w-0 flex-1 truncate text-[13px] font-semibold">
              {l.productName}
            </span>
            <NumberInput
              value={l.quantity}
              onChange={(v) => setLine(i, { quantity: v })}
              min={1}
              className="w-20"
              aria-label={`${l.productName} 수량`}
            />
            <span className="text-fg-muted shrink-0 text-[12px] tabular-nums">
              {(l.unitPrice * l.quantity).toLocaleString()}M
            </span>
          </div>
          <input
            value={l.link}
            onChange={(e) => setLine(i, { link: e.target.value })}
            placeholder="구매 링크(도서·강의만)"
            className={inputClass({ size: 'sm' })}
          />
        </div>
      ))}

      <div className="flex items-center justify-between">
        <span className="text-fg-subtle text-[12px]">
          변경 후 합계{' '}
          <b className="text-fg tabular-nums">{total.toLocaleString()}M</b>
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={revise.isPending || lines.length === 0}
          className={buttonClass({ size: 'sm' })}
        >
          수정해서 다시 요청
        </button>
      </div>
    </div>
  )
}
