import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useMileageProducts } from '../api/mileage'
import type { Tone } from './types'

// 마일리지 상품 신청 (/student/mileage/products) — Figma 418:1961.
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
const input =
  'border-border bg-surface text-fg focus:border-brand w-full rounded-[10px] border px-4 py-3 text-[14px] focus:outline-none'

export default function ProductsPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useMileageProducts()
  const [active, setActive] = useState('all')
  const [link, setLink] = useState('')
  const [price, setPrice] = useState('')
  const [memo, setMemo] = useState('')

  if (isPending)
    return <div className="text-fg-muted p-8">상품을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="상품을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-[22px] font-bold">마일리지 상품 신청</h1>
        <p className="text-fg-muted text-[12px]">
          상품 타입별 잔여 한도를 확인하고 구매 요청을 제출합니다.
        </p>
      </div>

      <div className="bg-brand flex items-center justify-between rounded-2xl p-5">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-white/70">
              BALANCE · 보유
            </span>
            <span className="text-[22px] font-bold text-white">
              {data.balance}M
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-white/70">
              진행 중 요청
            </span>
            <span className="text-[22px] font-bold text-white">
              {data.inProgress}건
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/student/mileage/history')}
          className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold text-white"
        >
          신청 내역 →
        </button>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-fg text-[16px] font-bold">상품 목록</h2>
          <span className="text-fg-subtle text-[12px]">
            {data.products.length}개
          </span>
        </div>
        <span className="text-fg-subtle text-[12px]">
          운영자 등록 상품 + 유연가 신청 가능
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {data.filters.map((f) => {
          const on = f.key === active
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActive(f.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                on
                  ? 'bg-brand-deep text-white'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'text-[12px]',
                  on ? 'text-white/70' : 'text-fg-subtle',
                )}
              >
                {f.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.products.map((p) => (
          <section key={p.id} className={cn(card, 'flex flex-col gap-2.5')}>
            <div className="flex flex-wrap gap-1.5">
              {p.badges.map((b, i) => (
                <span
                  key={i}
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-bold',
                    CHIP[b.tone],
                  )}
                >
                  {b.label}
                </span>
              ))}
            </div>
            <span className="text-fg text-[15px] font-bold">{p.name}</span>
            <span className="text-brand text-[13px] font-bold">
              {p.price ?? p.priceType}
            </span>
            <span className="text-fg-muted min-h-[32px] text-[12px] leading-5">
              {p.desc}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-fg-subtle text-[11px]">잔여 한도</span>
              <span className="text-fg text-[13px] font-bold">{p.limit}M</span>
            </div>
            <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
              <div className="bg-brand h-full w-2/3 rounded-full" />
            </div>
            <button
              type="button"
              className="bg-brand mt-1 rounded-lg py-2.5 text-[13px] font-bold text-white"
            >
              신청하기 →
            </button>
          </section>
        ))}
      </div>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center gap-2">
          <span className="text-fg text-[15px] font-bold">직접 신청</span>
          <span className="bg-accent-bg text-accent-strong rounded px-1.5 py-0.5 text-[10px] font-bold">
            유연가
          </span>
          <span className="text-fg-subtle text-[11px]">
            매니저 검토 1영업일
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">
          등록 상품에 없는 항목은 링크 + 가격을 입력해 직접 신청합니다
        </span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[12px] font-bold">
              상품 링크 <span className="text-danger">*</span>
            </span>
            <input
              className={input}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[12px] font-bold">
              신청 가격 <span className="text-danger">*</span>
            </span>
            <input
              className={input}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="가격 입력 (단위: M)"
            />
          </div>
        </div>
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
        <div className="bg-info-bg/60 text-fg-muted rounded-xl p-3 text-[11px]">
          ⓘ 유연가 신청은 매니저 검토 후 마일리지가 차감됩니다. 승인되지 않으면
          마일리지는 그대로 보존됩니다.
        </div>
      </section>
    </div>
  )
}
