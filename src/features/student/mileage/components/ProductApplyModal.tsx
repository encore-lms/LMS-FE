import { useEffect, useState } from 'react'
import { Book, Coffee, Gift, Send, Video, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/components/ui/Modal'
import { useMileageStore, parseMoney, type MileageRequest } from '../store'
import type { MileageProduct, Tone } from '../types'

const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
const PRODUCT_ICON: Record<MileageProduct['icon'], LucideIcon> = {
  book: Book,
  video: Video,
  cup: Coffee,
  gift: Gift,
}
const input =
  'border-border bg-surface text-fg focus:border-brand w-full rounded-[10px] border px-4 py-3 text-[14px] focus:outline-none'

// 상품 링크는 http/https URL만 허용
function isValidUrl(s: string): boolean {
  const v = s.trim()
  if (!v) return false
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// 기프티콘 고정가 = 즉시 발급/자동 승인 → 제출 시 바로 차감
function isAutoApprove(p: MileageProduct): boolean {
  return p.categoryKey === 'gift' && p.price != null
}
// 상품 타입 라벨(MileageProductTypeLimit 안내 문구용)
const TYPE_LABEL: Record<MileageProduct['categoryKey'], string> = {
  book: '도서',
  course: '온라인 강의',
  gift: '기프티콘',
}

/**
 * 구매 요청 "확인 필요" 모달. 보유 잔액·타입별 잔여 한도·신청 금액·차감 안내를 확인하고 제출한다.
 * 고정가 상품은 금액 확정, 직접 입력 상품은 링크+가격을 받는다.
 * 신청 금액이 보유 마일리지나 상품 타입별 잔여 한도를 넘으면 "신청 불가"로 막는다.
 */
export function ProductApplyModal({
  product,
  onClose,
  onSubmitted,
}: {
  product: MileageProduct | null
  onClose: () => void
  onSubmitted: (req: MileageRequest) => void
}) {
  const submit = useMileageStore((s) => s.submit)
  const balance = useMileageStore((s) => s.balance)
  const [link, setLink] = useState('')
  const [price, setPrice] = useState('')
  const [memo, setMemo] = useState('')

  // 다른 상품으로 다시 열릴 때 입력 초기화
  useEffect(() => {
    setLink('')
    setPrice('')
    setMemo('')
  }, [product])

  const isFixed = product?.price != null
  const autoApprove = product ? isAutoApprove(product) : false
  const amount = isFixed ? parseMoney(product?.price) : Number(price || 0)
  const urlOk = isValidUrl(link)
  // 타입별 잔여 한도(MileageProductTypeLimit) — 상품 limit 값(예: 도서 58,000M)
  const typeLimit = parseMoney(product?.limit)
  const typeLabel = product ? TYPE_LABEL[product.categoryKey] : ''
  const overBalance = amount > balance
  const overTypeLimit = typeLimit > 0 && amount > typeLimit
  const blocked = overBalance || overTypeLimit
  const canSubmit =
    product != null &&
    amount > 0 &&
    !blocked &&
    (isFixed || (urlOk && price.trim() !== ''))

  const Icon = product ? PRODUCT_ICON[product.icon] : Book

  const submitApply = () => {
    if (!product || !canSubmit) return
    const req = submit({
      product: product.name,
      amount,
      autoApprove,
      memo: memo.trim() || undefined,
      link: isFixed ? undefined : link.trim(),
    })
    onSubmitted(req)
  }

  return (
    <Modal
      open={product !== null}
      onClose={onClose}
      closeOnBackdrop={false}
      title="마일리지 상품 신청"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submitApply}
            disabled={!canSubmit}
            className="bg-brand flex h-10 items-center gap-1.5 rounded-[10px] px-[18px] text-[14px] font-semibold text-white disabled:opacity-50"
          >
            <Send className="size-4" /> 신청 제출
          </button>
        </>
      }
    >
      {product && (
        <div className="flex flex-col gap-4">
          {/* 신청 상품 요약 */}
          <div className="bg-surface-muted flex items-center gap-3 rounded-[10px] p-3">
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-[10px]',
                CHIP[product.tone],
              )}
            >
              <Icon className="size-[21px]" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-fg text-[14px] font-bold">
                {product.name}
              </span>
              <span className="text-brand text-[12px] font-bold">
                {product.price ?? '가격 직접 입력'}
              </span>
            </div>
          </div>

          {/* 확인 요약 — 보유 잔액 / 타입별 잔여 한도 / 신청 금액 */}
          <div className="border-border grid grid-cols-2 gap-3 rounded-[10px] border p-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-fg-subtle text-[11px]">보유 마일리지</span>
              <span className="text-fg text-[15px] font-bold">
                {balance.toLocaleString()}M
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-fg-subtle text-[11px]">
                {typeLabel} 잔여 한도
              </span>
              <span
                className={cn(
                  'text-[15px] font-bold',
                  overTypeLimit ? 'text-danger' : 'text-fg',
                )}
              >
                {typeLimit.toLocaleString()}M
              </span>
            </div>
            <div className="border-divider col-span-2 flex items-center justify-between border-t pt-2">
              <span className="text-fg-subtle text-[11px]">신청 금액</span>
              <span
                className={cn(
                  'text-[15px] font-bold',
                  blocked ? 'text-danger' : 'text-fg',
                )}
              >
                {amount > 0 ? `${amount.toLocaleString()}M` : '—'}
              </span>
            </div>
          </div>

          {/* 신청 불가 — 타입별 잔여 한도/보유 잔액 초과 (어떤 기준을 넘었는지 표시) */}
          {blocked && (
            <div className="border-danger/40 bg-danger-bg/50 flex flex-col gap-1 rounded-xl border p-3">
              <span className="text-danger text-[12px] font-bold">
                {overTypeLimit
                  ? `${typeLabel} 타입 잔여 한도를 ${(amount - typeLimit).toLocaleString()}M 초과했습니다 · 신청 불가`
                  : `보유 마일리지를 ${(amount - balance).toLocaleString()}M 초과했습니다 · 신청 불가`}
              </span>
              <span className="text-fg-muted text-[11px]">
                {overTypeLimit
                  ? '타입 한도는 운영자가 설정하며, 승인 전 차감은 발생하지 않습니다.'
                  : '금액을 줄이거나 마일리지를 더 적립한 뒤 신청해 주세요.'}
              </span>
            </div>
          )}

          {/* 직접 입력 상품: 링크 + 가격 */}
          {!isFixed && (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-fg text-[12px] font-bold">
                  상품 링크 <span className="text-danger">*</span>
                </span>
                <input
                  className={cn(
                    input,
                    link.trim() !== '' &&
                      !urlOk &&
                      'border-danger focus:border-danger',
                  )}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                />
                <span
                  className={cn(
                    'text-[11px]',
                    link.trim() !== '' && !urlOk
                      ? 'text-danger'
                      : 'text-fg-subtle',
                  )}
                >
                  구매하려는 상품 페이지의 http:// 또는 https:// 링크를
                  입력하세요.
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-fg text-[12px] font-bold">
                  신청 가격 <span className="text-danger">*</span>
                </span>
                <div className="border-border bg-surface focus-within:border-brand flex w-full items-center rounded-[10px] border px-4 text-[14px]">
                  <input
                    inputMode="numeric"
                    className="text-fg placeholder:text-fg-subtle min-w-0 flex-1 bg-transparent py-3 outline-none"
                    value={price ? Number(price).toLocaleString() : ''}
                    onChange={(e) =>
                      setPrice(e.target.value.replace(/[^\d]/g, ''))
                    }
                    placeholder="가격만 입력"
                  />
                  <span className="text-fg-muted ml-1 font-semibold">M</span>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-fg text-[12px] font-bold">
              매니저에게 남길 메모
            </span>
            <textarea
              className={cn(input, 'min-h-[80px] resize-none leading-6')}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="구매 목적이나 확인이 필요한 내용을 적어주세요."
            />
          </div>

          {/* 차감 안내 — 신청 가능할 때만(신청 불가 안내는 상단에 표시) */}
          {!blocked && (
            <div className="bg-info-bg/60 text-fg-muted rounded-xl p-3 text-[11px]">
              {autoApprove
                ? 'ⓘ 자동 승인 상품입니다. 신청 즉시 승인되어 마일리지가 바로 차감됩니다.'
                : 'ⓘ 매니저 검토 후 승인 시 마일리지가 차감됩니다. 승인 전까지 잔액은 보존됩니다.'}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
