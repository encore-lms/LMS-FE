import { useEffect, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { ProductImage } from './ProductImage'
import type { Product, ProductType } from './types'

const TYPES: { value: ProductType; label: string }[] = [
  { value: 'COUPON', label: '기프티콘' },
  { value: 'GOODS', label: '도서' },
  { value: 'ETC', label: '인터넷 강의' },
]

/** 폼 입력값 — 등록/수정 시 페이지로 전달. */
export interface ProductFormValues {
  type: ProductType
  name: string
  price: string
  active: boolean
}

export interface ProductFormModalProps {
  open: boolean
  product: Product | null
  onClose: () => void
  /** 검증 통과 후 호출 — 입력값 + 선택한 이미지 파일(없으면 null) */
  onSubmit: (
    mode: 'create' | 'edit',
    values: ProductFormValues,
    file: File | null,
  ) => void
  pending?: boolean
}

// 상품 등록·수정 폼(정본 §40, COUPON/GOODS/ETC). 가격(고정가) + 이미지 업로드(JPG·PNG·WEBP).
export function ProductFormModal({
  open,
  product,
  onClose,
  onSubmit,
  pending,
}: ProductFormModalProps) {
  const mode: 'create' | 'edit' = product ? 'edit' : 'create'
  const [type, setType] = useState<ProductType>('COUPON')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [active, setActive] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({})
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setType(product?.type ?? 'COUPON')
    setName(product?.name ?? '')
    setPrice(product?.price ? product.price.replace(/[^\d]/g, '') : '')
    setActive(product ? product.active : true)
    setFile(null)
    setPreview(null)
    setErrors({})
  }, [open, product])

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  // 도서·인터넷 강의는 수강생이 구매 시 가격을 직접 입력한다(flexible) — 매니저는 가격을 정하지 않는다.
  const flexible = type === 'GOODS' || type === 'ETC'

  const submit = () => {
    const next: { name?: string; price?: string } = {}
    if (!name.trim()) next.name = '상품명을 입력해주세요'
    if (!flexible && (!price.trim() || Number(price) <= 0))
      next.price = '가격을 입력해주세요'
    setErrors(next)
    if (next.name || next.price) return
    onSubmit(
      mode,
      { type, name: name.trim(), price: flexible ? '0' : price.trim(), active },
      file,
    )
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
          <Button onClick={submit} disabled={pending}>
            {pending ? '저장 중…' : mode === 'edit' ? '저장' : '등록'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* 이미지 업로드 */}
        <div className="flex flex-col gap-[6px]">
          <span className="text-fg text-[13px] font-bold">상품 이미지</span>
          <div className="flex items-center gap-3">
            <div className="bg-surface-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl">
              {preview ? (
                <img src={preview} alt="" className="size-full object-cover" />
              ) : (
                <ProductImage
                  url={product?.imageUrl}
                  className="size-full object-cover"
                  fallback={<Upload className="text-fg-subtle size-6" />}
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onPickFile}
                className="hidden"
              />
              <Button
                variant="secondary"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" /> 이미지 선택
              </Button>
              <span className="text-fg-subtle text-[11px]">
                JPG·PNG·WEBP / 최대 5MB
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[6px]">
          <span className="text-fg text-[13px] font-bold">타입</span>
          <Select
            aria-label="타입"
            value={type}
            onChange={(v) => setType(v as ProductType)}
            options={TYPES}
            className="h-11 w-full"
          />
        </div>

        <Input
          label="상품명"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="상품명을 입력하세요"
          error={errors.name}
        />
        {flexible ? (
          <div className="flex flex-col gap-[6px]">
            <span className="text-fg text-[13px] font-bold">가격</span>
            <div className="border-border bg-surface-muted text-fg-muted rounded-lg border px-3 py-2.5 text-[13px]">
              수강생이 구매 시 구매 링크와 가격을 직접 입력합니다 · 매니저는
              가격을 정하지 않아요.
            </div>
          </div>
        ) : (
          <Input
            label="가격 (M)"
            required
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="예: 50000"
            error={errors.price}
          />
        )}
        <Checkbox
          checked={active}
          onChange={setActive}
          label="활성 (비활성 시 수강생 미노출)"
        />
      </div>
    </Modal>
  )
}
