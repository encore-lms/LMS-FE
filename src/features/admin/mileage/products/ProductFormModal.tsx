import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Modal } from '@/components/ui/Modal'
import type { Product, ProductType } from './types'

const TYPES: { value: ProductType; label: string }[] = [
  { value: 'GIFTICON', label: '기프티콘' },
  { value: 'BOOK', label: '도서' },
  { value: 'LECTURE', label: '강의' },
]

// GIFTICON=고정가(가격 입력 필수), BOOK·LECTURE=유연가(수강생 구매 시 입력 — 매니저 가격 입력 안 함).
const isFixedType = (t: ProductType) => t === 'GIFTICON'

/** 폼 입력값 — 등록/수정 시 페이지로 전달해 목록에 반영한다. */
export interface ProductFormValues {
  type: ProductType
  name: string
  /** 고정가 입력값(유연가는 빈 문자열) */
  price: string
  order: number
  active: boolean
}

export interface ProductFormModalProps {
  open: boolean
  /** 수정 대상(없으면 신규 등록) */
  product: Product | null
  onClose: () => void
  /** 검증 통과 후 호출 — mode로 등록/수정 분기 + 입력값 전달 */
  onSubmit: (mode: 'create' | 'edit', values: ProductFormValues) => void
}

// 상품 등록·수정 폼 모달 (Figma 1306:8434) — §20 폼 입력(타입·상품명·가격[고정가 한정]·정렬·활성).
// 이미지 업로드·실제 생성/수정 mutation은 BE 계약(P0_16) 확정 후 — 현재는 검증 + onSubmit 콜백(mock).
export function ProductFormModal({
  open,
  product,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const mode: 'create' | 'edit' = product ? 'edit' : 'create'
  const [type, setType] = useState<ProductType>('GIFTICON')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [order, setOrder] = useState('0')
  const [active, setActive] = useState(true)
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({})

  useEffect(() => {
    if (!open) return
    setType(product?.type ?? 'GIFTICON')
    setName(product?.name ?? '')
    setPrice(product?.price ?? '')
    setOrder(String(product?.order ?? 0))
    setActive(product ? product.active : true)
    setErrors({})
  }, [open, product])

  const fixed = isFixedType(type)

  const submit = () => {
    const next: { name?: string; price?: string } = {}
    if (!name.trim()) next.name = '상품명을 입력해주세요'
    if (fixed && !price.trim()) next.price = '고정가 상품은 가격이 필요해요'
    setErrors(next)
    if (next.name || next.price) return
    onSubmit(mode, {
      type,
      name: name.trim(),
      price: fixed ? price.trim() : '',
      order: Number(order) || 0,
      active,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? '상품 수정' : '상품 등록'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={submit}>{mode === 'edit' ? '저장' : '등록'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="product-type"
            className="text-fg text-[13px] font-bold"
          >
            타입
          </label>
          <select
            id="product-type"
            value={type}
            onChange={(e) => setType(e.target.value as ProductType)}
            className="border-border text-fg focus:border-brand h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="상품명"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="상품명을 입력하세요"
          error={errors.name}
        />

        <Input
          label={fixed ? '가격 (M)' : '가격 (유연가 — 수강생 입력)'}
          required={fixed}
          type="number"
          value={fixed ? price : ''}
          onChange={(e) => setPrice(e.target.value)}
          disabled={!fixed}
          placeholder={fixed ? '예: 50000' : '유연가 — 매니저 입력 안 함'}
          error={errors.price}
        />

        <Input
          label="정렬 순서"
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        />

        <Checkbox
          checked={active}
          onChange={setActive}
          label="활성 (비활성 시 수강생 미노출)"
        />

        <p className="text-fg-subtle text-xs">
          이미지 업로드(JPG·PNG·WEBP, 최대 5MB)는 BE 연동 후 제공됩니다 (P0_16).
        </p>
      </div>
    </Modal>
  )
}
