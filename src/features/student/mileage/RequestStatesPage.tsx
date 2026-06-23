import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import {
  useMileageStore,
  type MileageRequest,
  type RequestStatus,
} from './store'
import { RequestStatusModal } from './components/RequestStatusModal'

// 마일리지 구매 요청 내역 (/student/mileage/requests) — Figma 3357:5971.
// 제출한 구매 요청 전용 목록 + 상태(검토 대기/승인 완료/반려). 행을 누르면 상태 상세 모달.
const card =
  'border-border bg-surface rounded-2xl border shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const summaryCard =
  'border-border bg-surface flex flex-col gap-1 rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

const STATUS: Record<RequestStatus, { label: string; chip: string }> = {
  pending: { label: '검토 대기', chip: 'bg-warning-bg text-warning' },
  approved: { label: '승인 완료', chip: 'bg-success-bg text-success' },
  rejected: { label: '반려', chip: 'bg-danger-bg text-danger' },
}

export default function RequestStatesPage() {
  const navigate = useNavigate()
  const requests = useMileageStore((s) => s.requests)
  const balance = useMileageStore((s) => s.balance)
  const [selected, setSelected] = useState<MileageRequest | null>(null)
  usePageHeader(
    '마일리지 구매 요청 내역',
    '제출한 구매 요청의 처리 상태를 확인합니다.',
  )

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={summaryCard}>
          <span className="text-fg-muted text-[12px]">보유 마일리지</span>
          <span className="text-fg text-[24px] leading-none font-bold">
            {balance.toLocaleString()}
            <span className="text-fg-muted ml-0.5 text-[13px]">M</span>
          </span>
        </div>
        <div className={summaryCard}>
          <span className="text-fg-muted text-[12px]">전체 요청</span>
          <span className="text-fg text-[24px] leading-none font-bold">
            {requests.length}
            <span className="text-fg-muted ml-0.5 text-[13px]">건</span>
          </span>
        </div>
        <div className={summaryCard}>
          <span className="text-fg-muted text-[12px]">검토 대기</span>
          <span className="text-warning text-[24px] leading-none font-bold">
            {pendingCount}
            <span className="text-fg-muted ml-0.5 text-[13px]">건</span>
          </span>
        </div>
      </div>

      {requests.length === 0 ? (
        <Empty
          title="구매 요청이 없어요"
          description="상품 신청 화면에서 마일리지로 상품을 신청해 보세요."
          action={
            <Button onClick={() => navigate('/student/mileage/products')}>
              상품 신청하러 가기
            </Button>
          }
        />
      ) : (
        <section className={cn(card, 'flex flex-col')}>
          <div className="text-fg-muted grid grid-cols-[100px_1fr_120px_92px_24px] gap-3 px-5 py-3 text-[11px] font-bold">
            <span>일자</span>
            <span>상품</span>
            <span className="text-right">신청 금액</span>
            <span>상태</span>
            <span />
          </div>
          {requests.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className="border-divider hover:bg-surface-muted grid grid-cols-[100px_1fr_120px_92px_24px] items-center gap-3 border-t px-5 py-3.5 text-left text-[12px] transition-colors"
            >
              <span className="text-fg-subtle">{r.date}</span>
              <span className="text-fg min-w-0 truncate font-semibold">
                {r.product}
              </span>
              <span
                className={cn(
                  'text-right font-bold',
                  r.status === 'rejected'
                    ? 'text-fg-subtle line-through'
                    : 'text-fg',
                )}
              >
                -{r.amount.toLocaleString()}M
              </span>
              <span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-bold',
                    STATUS[r.status].chip,
                  )}
                >
                  {STATUS[r.status].label}
                </span>
              </span>
              <span className="text-fg-subtle text-center">›</span>
            </button>
          ))}
        </section>
      )}

      <div className="bg-surface-muted/40 text-fg-subtle rounded-xl px-4 py-3 text-[11px]">
        수강생 화면은 구매 요청 생성·상태 조회까지만 담당합니다. 승인·수정·반려
        처리는 매니저 마일리지 구매 요청 화면에서 수행합니다.
      </div>

      <RequestStatusModal
        request={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
