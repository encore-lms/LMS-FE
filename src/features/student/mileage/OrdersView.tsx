import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import {
  useMileageOrders,
  useCancelMileageOrder,
  type MileageOrderRow,
} from '../api/mileage'

// 구매 요청 뷰 — 내 마일리지 구매 요청(주문)의 처리 상태와 취소(대기 건). 마일리지 허브의 한 뷰.
const STATUS_TONE: Record<MileageOrderRow['status'], string> = {
  pending: 'bg-warning-bg text-warning',
  approved: 'bg-success-bg text-success',
  rejected: 'bg-danger-bg text-danger',
  canceled: 'bg-surface-muted text-fg-muted',
}

export function OrdersView({ onView }: { onView: (v: string) => void }) {
  const { data, isPending, isError, refetch } = useMileageOrders()
  const cancel = useCancelMileageOrder()
  const toast = useToast()

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      skeleton={<SkeletonListPage columns={4} className="" />}
      errorTitle="구매 요청을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
    >
      {data &&
        (data.orders.length === 0 ? (
          <Empty
            title="구매 요청이 없어요"
            description="상품을 신청하면 여기에서 처리 상태를 확인할 수 있어요."
            action={
              <button
                type="button"
                onClick={() => onView('shop')}
                className={buttonClass({ size: 'md' })}
              >
                상품 신청하러 가기 →
              </button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {data.orders.map((o) => (
              <section
                key={o.id}
                className="bg-surface flex items-center gap-4 rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-fg truncate text-[14px] font-bold">
                      {o.product}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
                        STATUS_TONE[o.status],
                      )}
                    >
                      {o.statusLabel}
                    </span>
                  </div>
                  <span className="text-fg-subtle text-[12px]">{o.date}</span>
                </div>
                <span className="text-fg shrink-0 text-[15px] font-bold tabular-nums">
                  -{o.amount.toLocaleString()}M
                </span>
                {o.status === 'pending' && (
                  <button
                    type="button"
                    disabled={cancel.isPending}
                    onClick={() =>
                      cancel.mutate(o.id, {
                        onSuccess: () =>
                          toast.success(
                            '구매를 취소했어요. 마일리지가 복원됩니다.',
                          ),
                        onError: () => toast.danger('취소에 실패했어요.'),
                      })
                    }
                    className="border-danger/40 text-danger shrink-0 rounded-md border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50"
                  >
                    구매 취소
                  </button>
                )}
              </section>
            ))}
          </div>
        ))}
    </DataBoundary>
  )
}
