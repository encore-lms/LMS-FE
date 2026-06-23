import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { MileageRequest } from '../store'

// 구매 요청 결과/상세 모달. request.status 에 따라 제출 완료(승인/대기)·반려를 분기한다.
//  - approved : 제출 완료 · 즉시 승인되어 차감됨
//  - pending  : 제출 완료 · 검토 대기(승인 전 보존)
//  - rejected : 반려 사유 상세
export function RequestStatusModal({
  request,
  onClose,
}: {
  request: MileageRequest | null
  onClose: () => void
}) {
  const navigate = useNavigate()

  const view = request
    ? request.status === 'approved'
      ? {
          tone: 'text-success',
          bg: 'bg-success-bg',
          Icon: CheckCircle2,
          badge: '승인 완료',
          title: '구매 요청이 승인되었어요',
          desc: `자동 승인 상품으로 즉시 처리되어 ${request.amount.toLocaleString()}M가 잔액에서 차감되었습니다.`,
        }
      : request.status === 'rejected'
        ? {
            tone: 'text-danger',
            bg: 'bg-danger-bg',
            Icon: XCircle,
            badge: '반려',
            title: '구매 요청이 반려되었어요',
            desc: '아래 반려 사유를 확인하고 상품 신청 화면에서 링크·가격을 수정해 재신청할 수 있습니다.',
          }
        : {
            tone: 'text-warning',
            bg: 'bg-warning-bg',
            Icon: Clock,
            badge: '검토 대기',
            title: '구매 요청이 접수되었어요',
            desc: `매니저 검토 후 승인 시 ${request.amount.toLocaleString()}M가 차감됩니다. 승인 전까지 마일리지는 보존됩니다.`,
          }
    : null

  const isRejected = request?.status === 'rejected'

  return (
    <Modal
      open={request !== null}
      onClose={onClose}
      size="sm"
      title="구매 요청 상태"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            닫기
          </button>
          {isRejected ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/student/mileage/products')
              }}
              className="bg-brand h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white"
            >
              재신청
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/student/mileage/history')
              }}
              className="bg-brand h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white"
            >
              사용 내역 보기
            </button>
          )}
        </>
      }
    >
      {request && view && (
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className={`flex size-14 items-center justify-center rounded-full ${view.bg} ${view.tone}`}
          >
            <view.Icon className="size-7" />
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${view.bg} ${view.tone}`}
          >
            {view.badge}
          </span>
          <span className="text-fg text-[16px] font-bold">{view.title}</span>
          <span className="text-fg-muted text-[13px] leading-5">
            {view.desc}
          </span>

          <div className="border-border mt-1 flex w-full flex-col gap-1.5 rounded-xl border p-3.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-fg-subtle text-[12px]">요청 번호</span>
              <span className="text-fg text-[12px] font-bold">
                {request.id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fg-subtle text-[12px]">상품</span>
              <span className="text-fg max-w-[60%] truncate text-[12px] font-semibold">
                {request.product}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-fg-subtle text-[12px]">신청 금액</span>
              <span className="text-fg text-[12px] font-bold">
                {request.amount.toLocaleString()}M
              </span>
            </div>
          </div>

          {isRejected && request.reason && (
            <div className="border-danger/40 bg-danger-bg/50 flex w-full flex-col gap-1 rounded-xl border p-3.5 text-left">
              <span className="text-danger text-[12px] font-bold">
                반려 사유
              </span>
              <span className="text-fg-muted text-[11px] leading-5">
                {request.reason}
              </span>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
