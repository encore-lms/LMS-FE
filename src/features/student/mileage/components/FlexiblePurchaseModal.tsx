import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

// 도서·인터넷 강의(수강생 직접 입력) 구매 신청 — 구매 링크 + 가격을 입력받아 장바구니에 담는다.
export function FlexiblePurchaseModal({
  open,
  productName,
  balance,
  onClose,
  onConfirm,
}: {
  open: boolean
  productName: string
  /** 보유 마일리지(초과 가드) */
  balance: number
  onClose: () => void
  onConfirm: (price: number, link: string) => void
}) {
  const [link, setLink] = useState('')
  const [price, setPrice] = useState('')
  const [errors, setErrors] = useState<{ link?: string; price?: string }>({})

  useEffect(() => {
    if (!open) return
    setLink('')
    setPrice('')
    setErrors({})
  }, [open])

  const submit = () => {
    const p = Number(price)
    const next: { link?: string; price?: string } = {}
    if (!link.trim()) next.link = '구매 링크를 입력해주세요'
    else if (!/^https?:\/\//i.test(link.trim()))
      next.link = 'http(s):// 로 시작하는 링크를 입력해주세요'
    if (!price.trim() || !Number.isFinite(p) || p <= 0)
      next.price = '가격을 입력해주세요'
    else if (p > balance) next.price = `보유 마일리지(${balance.toLocaleString()}M)를 초과합니다`
    setErrors(next)
    if (next.link || next.price) return
    onConfirm(p, link.trim())
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${productName} — 구매 신청`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={submit}>장바구니 담기</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-fg-muted text-[13px]">
          구매할 상품의 링크와 가격을 입력하세요. 매니저가 확인 후 구매를
          진행합니다.
        </p>
        <Input
          label="구매 링크"
          required
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://www.yes24.com/Product/..."
          error={errors.link}
        />
        <Input
          label="가격 (M)"
          required
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="예: 26000"
          error={errors.price}
        />
      </div>
    </Modal>
  )
}
