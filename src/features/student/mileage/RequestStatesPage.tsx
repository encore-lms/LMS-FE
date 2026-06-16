import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'

// 마일리지 구매 요청 상태 (/student/mileage/requests) — Figma 3357:5971.
// 구매 요청 확인 모달 / 요청 완료 / 반려 사유 / 한도 초과 오류 4개 상태 카탈로그.
const card =
  'border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const input =
  'border-border bg-surface text-fg w-full rounded-[10px] border px-4 py-3 text-[14px]'
// 숫자만 입력받고 끝에 M을 고정 표기하는 금액 입력
const money =
  'border-border bg-surface focus-within:border-brand flex items-center rounded-[10px] border px-4 text-[14px]'

export default function RequestStatesPage() {
  const navigate = useNavigate()
  // 구매 요청 확인 모달 — 편집 가능 입력
  const [product, setProduct] = useState('교보문고 도서 구매')
  const [amount, setAmount] = useState('32000')
  const confirmValid = product.trim() !== '' && Number(amount) > 0
  // 한도 초과 카드 — 신청 가격 편집 시 잔여 한도(58,000M) 대비 초과액 실시간 계산
  const LIMIT = 58000
  const [price, setPrice] = useState('145000')
  const over = Number(price || 0) - LIMIT

  usePageHeader(
    '마일리지 구매 요청 상태',
    '상품 신청 화면에서 이어지는 확인·완료·반려·한도 초과 상태를 한 화면에 고정합니다.',
  )
  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 구매 요청 확인 모달 */}
        <section className={card}>
          <span className="bg-brand/10 text-brand w-fit rounded-full px-2.5 py-1 text-[11px] font-bold">
            확인 필요
          </span>
          <span className="text-fg text-[16px] font-bold">
            구매 요청 확인 모달
          </span>
          <span className="text-fg-muted text-[12px] leading-5">
            요청 제출 전 보유 마일리지, 상품 타입, 신청 금액, 타입별 잔여 한도,
            승인 전에는 차감되지 않는다는 안내를 확인합니다.
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-fg-subtle text-[11px]">상품</span>
              <input
                className={cn(input, 'focus:border-brand focus:outline-none')}
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="상품명"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-fg-subtle text-[11px]">신청 금액</span>
              <div className={money}>
                <input
                  inputMode="numeric"
                  className="text-fg placeholder:text-fg-subtle min-w-0 flex-1 bg-transparent py-3 outline-none"
                  value={amount ? Number(amount).toLocaleString() : ''}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^\d]/g, ''))
                  }
                  placeholder="금액"
                />
                <span className="text-fg-muted ml-1 font-semibold">M</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/student/mileage/products')}
              className="border-border text-fg rounded-lg border px-4 py-2 text-[12px] font-semibold"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() =>
                confirmValid && navigate('/student/mileage/history')
              }
              disabled={!confirmValid}
              className="bg-brand rounded-lg px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
            >
              요청 제출
            </button>
          </div>
        </section>

        {/* 요청 완료 상태 */}
        <section className={card}>
          <span className="bg-success-bg text-success w-fit rounded-full px-2.5 py-1 text-[11px] font-bold">
            제출 완료
          </span>
          <span className="text-fg text-[16px] font-bold">요청 완료 상태</span>
          <span className="text-fg-muted text-[12px] leading-5">
            구매 요청이 접수되면 사용 내역으로 이동할 수 있고, 상태는
            PENDING으로 표시됩니다. 승인 전까지 보유 마일리지는 보존됩니다.
          </span>
          <div className="bg-success-bg/50 flex flex-col gap-1 rounded-xl p-3.5">
            <span className="text-success text-[13px] font-bold">
              요청 번호 MLG-20260602-014
            </span>
            <span className="text-fg-muted text-[11px]">
              매니저 검토 예상 · 1영업일
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/student/mileage/history')}
              className="bg-brand rounded-lg px-4 py-2 text-[12px] font-bold text-white"
            >
              사용 내역 보기
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/mileage/products')}
              className="border-border text-fg rounded-lg border px-4 py-2 text-[12px] font-semibold"
            >
              상품 더 보기
            </button>
          </div>
        </section>

        {/* 반려 사유 상세 모달 */}
        <section className={card}>
          <span className="bg-danger-bg text-danger w-fit rounded-full px-2.5 py-1 text-[11px] font-bold">
            반려
          </span>
          <span className="text-fg text-[16px] font-bold">
            반려 사유 상세 모달
          </span>
          <span className="text-fg-muted text-[12px] leading-5">
            반려된 구매 요청은 사유와 매니저 메모를 확인합니다. 동일 상품을
            재신청하려면 상품 신청 화면으로 돌아가 링크와 가격을 수정합니다.
          </span>
          <div className="border-danger/40 bg-danger-bg/50 flex flex-col gap-1 rounded-xl border p-3.5">
            <span className="text-danger text-[12px] font-bold">반려 사유</span>
            <span className="text-fg-muted text-[11px]">
              구매 링크가 접근 불가 상태입니다. 공개 링크로 다시 제출해 주세요.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/student/mileage/products')}
              className="border-border text-fg rounded-lg border px-4 py-2 text-[12px] font-semibold"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/mileage/products')}
              className="bg-brand rounded-lg px-4 py-2 text-[12px] font-bold text-white"
            >
              재신청
            </button>
          </div>
        </section>

        {/* 타입별 잔여 한도 초과 오류 */}
        <section className={card}>
          <span className="bg-warning-bg text-warning w-fit rounded-full px-2.5 py-1 text-[11px] font-bold">
            신청 불가
          </span>
          <span className="text-fg text-[16px] font-bold">
            타입별 잔여 한도 초과 오류
          </span>
          <span className="text-fg-muted text-[12px] leading-5">
            신청 금액이 보유 마일리지나 상품 타입별 잔여 한도를 초과하면 제출
            버튼을 비활성화하고 어떤 기준을 넘었는지 표시합니다.
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-fg-subtle text-[11px]">신청 가격</span>
              <div
                className={cn(
                  money,
                  over > 0 && 'border-danger focus-within:border-danger',
                )}
              >
                <input
                  inputMode="numeric"
                  className={cn(
                    'min-w-0 flex-1 bg-transparent py-3 font-bold outline-none',
                    over > 0 ? 'text-danger' : 'text-fg',
                  )}
                  value={price ? Number(price).toLocaleString() : ''}
                  onChange={(e) =>
                    setPrice(e.target.value.replace(/[^\d]/g, ''))
                  }
                  placeholder="금액"
                />
                <span
                  className={cn(
                    'ml-1 font-semibold',
                    over > 0 ? 'text-danger' : 'text-fg-muted',
                  )}
                >
                  M
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-fg-subtle text-[11px]">잔여 한도</span>
              <span className={input}>{LIMIT.toLocaleString()}M</span>
            </div>
          </div>
          {over > 0 ? (
            <div className="border-danger/40 bg-danger-bg/50 flex flex-col gap-1 rounded-xl border p-3.5">
              <span className="text-danger text-[12px] font-bold">
                도서 타입 잔여 한도를 {over.toLocaleString()}M 초과했습니다.
              </span>
              <span className="text-fg-muted text-[11px]">
                타입 한도는 분배되어 설정되며, 승인 전 차감은 발생하지 않습니다.
              </span>
            </div>
          ) : (
            <div className="border-success/40 bg-success-bg/50 flex flex-col gap-1 rounded-xl border p-3.5">
              <span className="text-success text-[12px] font-bold">
                잔여 한도 내 금액입니다 · 신청 가능
              </span>
              <span className="text-fg-muted text-[11px]">
                남은 한도 {(LIMIT - Number(price || 0)).toLocaleString()}M ·
                제출하면 매니저 검토 후 차감됩니다.
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => over <= 0 && navigate('/student/mileage/history')}
            disabled={over > 0}
            className="bg-brand w-fit rounded-lg px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50"
          >
            {over > 0 ? '금액 수정 필요' : '요청 제출'}
          </button>
        </section>
      </div>

      <div className="bg-surface-muted/40 text-fg-subtle rounded-xl px-4 py-3 text-[11px]">
        수강생 화면은 구매 요청 생성·상태 조회까지만 담당합니다. 승인·수정·반려
        처리는 매니저 마일리지 구매 요청 화면에서 수행합니다.
      </div>
    </div>
  )
}
