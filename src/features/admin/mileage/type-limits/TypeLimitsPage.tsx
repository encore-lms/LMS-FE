import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, Info, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
// 운영 액션 모달 v2 공통 — 처리 요약 + 메모 + 권한 확인(재사용).
import {
  ActionModal,
  type ActionModalSpec,
} from '@/features/admin/settings/ActionModal'
import { MileageTabs } from '../MileageTabs'
import { useTypeLimits } from './api'
import type { LimitType, TypeLimit } from './types'

// 마일리지 타입 한도 설정 (/admin/mileage/type-limits) — 운영(MANAGER/ADMIN) 신규.
// Figma 1252:7320 + 저장 확인·결과 모달. 타입별 1인 누적 사용 한도(maxPerUser) 관리.
// 저장(PATCH)·초기화는 BE 계약(P0_16) 미확정 → mock 흐름 + TODO.
export default function TypeLimitsPage() {
  usePageHeader(
    '마일리지 타입 한도 설정',
    '상품 타입별 수강생 1인 누적 사용 한도(maxPerUser) 관리',
  )
  const { data, isPending, isError, refetch } = useTypeLimits()
  const toast = useToast()
  const [saved, setSaved] = useState<Record<string, number>>({})
  const [draft, setDraft] = useState<Record<string, number>>({})
  const [confirm, setConfirm] = useState<ActionModalSpec | null>(null)

  const limits = useMemo(() => data?.limits ?? [], [data])
  // 서버값으로 1회 초기화(쿼리 성공 후).
  const savedFor = (l: TypeLimit) => saved[l.type] ?? l.current
  const draftFor = (l: TypeLimit) => draft[l.type] ?? l.current
  const changed = limits.filter((l) => draftFor(l) !== savedFor(l))
  const changeCount = changed.length

  if (isPending) {
    return <div className="text-fg-muted p-8">타입 한도를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="타입 한도를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { course, cohortLabel } = data

  const setValue = (type: LimitType, v: number) =>
    setDraft((prev) => ({ ...prev, [type]: v }))

  const reset = () => {
    setDraft(Object.fromEntries(limits.map((l) => [l.type, l.defaultValue])))
  }

  const openSave = () => {
    setConfirm({
      title: '마일리지 타입 한도 저장',
      subtitle: `변경된 ${changeCount}개 타입의 maxPerUser를 일괄 반영합니다.`,
      rows: changed.map((l) => ({
        label: l.label,
        value: `${savedFor(l).toLocaleString()}M → ${draftFor(l).toLocaleString()}M`,
      })),
      confirmLabel: '한도 저장',
    })
  }

  const save = () => {
    // TODO: PATCH /api/admin/mileage/product-type-limits — 변경된 타입만 일괄 반영(P0_16)
    setSaved((prev) => {
      const next = { ...prev }
      changed.forEach((l) => {
        next[l.type] = draftFor(l)
      })
      return next
    })
    setConfirm(null)
    toast.success(`타입 한도 ${changeCount}건 저장됨`)
  }

  return (
    <div className="p-8">
      {/* 브레드크럼 */}
      <Link
        to="/admin/mileage"
        className="text-fg-muted hover:text-fg inline-flex items-center gap-1 text-[13px]"
      >
        <ChevronLeft className="h-4 w-4" />
        마일리지 관리
        <span className="text-fg-subtle">› 타입 한도</span>
      </Link>

      {/* 클러스터 탭 + 과정/기수 */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <MileageTabs />
        <div className="flex items-center gap-2">
          <select
            aria-label="과정"
            defaultValue="ai"
            className="border-border text-fg-muted focus:border-brand h-9 rounded-lg border bg-white px-3 text-sm outline-none"
          >
            <option value="ai">{course}</option>
          </select>
          <select
            aria-label="기수"
            defaultValue="22"
            className="border-border text-fg-muted focus:border-brand h-9 rounded-lg border bg-white px-3 text-sm outline-none"
          >
            <option value="22">{cohortLabel}</option>
          </select>
        </div>
      </div>

      {/* 안내 — maxPerUser */}
      <div className="border-border bg-surface mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-4">
        <p className="text-fg inline-flex items-center gap-1.5 text-sm font-bold">
          <Info className="text-info h-4 w-4" />
          타입 한도 설정 — maxPerUser
        </p>
        <code className="text-fg-subtle text-[11px]">
          GET · PATCH /api/admin/mileage/product-type-limits
        </code>
      </div>

      {/* 타입 3카드 */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {limits.map((l) => {
          const cur = savedFor(l)
          const nv = draftFor(l)
          const isChanged = nv !== cur
          const diff = nv - cur
          return (
            <div
              key={l.type}
              className="border-border bg-surface flex flex-col rounded-xl border p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <p className="text-fg text-base font-bold">{l.label}</p>
                  <StatusBadge label={l.type} tone="neutral" />
                </div>
                {isChanged && <StatusBadge label="변경됨" tone="warning" />}
              </div>
              <p className="text-fg-muted mt-1 text-xs">{l.description}</p>

              <dl className="border-divider mt-3 grid grid-cols-3 gap-2 border-y py-3 text-[11px]">
                <div>
                  <dt className="text-fg-subtle">등록 상품</dt>
                  <dd className="text-fg font-semibold">{l.productCount}개</dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">가격 방식</dt>
                  <dd className="text-fg font-semibold">{l.priceMode}</dd>
                </div>
                <div>
                  <dt className="text-fg-subtle">구매 입력</dt>
                  <dd className="text-fg font-semibold">{l.purchaseInput}</dd>
                </div>
              </dl>

              <p className="text-fg-subtle mt-3 text-[11px]">현재 maxPerUser</p>
              <p className="text-fg text-[15px] font-bold tabular-nums">
                {cur.toLocaleString()} M
              </p>

              <label className="text-fg mt-3 text-[13px] font-semibold">
                새 maxPerUser <span className="text-danger">*</span>
              </label>
              <div className="border-border focus-within:border-brand mt-1.5 flex items-center rounded-lg border bg-white px-3">
                <input
                  value={nv.toLocaleString()}
                  onChange={(e) =>
                    setValue(
                      l.type,
                      Number(e.target.value.replace(/[^\d]/g, '')) || 0,
                    )
                  }
                  inputMode="numeric"
                  aria-label={`${l.label} 새 maxPerUser`}
                  className="text-fg h-10 flex-1 bg-transparent text-[15px] font-bold outline-none"
                />
                <span className="text-fg-subtle text-sm">M</span>
              </div>

              {isChanged && (
                <p className="text-warning mt-2 text-[12px] font-semibold tabular-nums">
                  {cur.toLocaleString()}M → {nv.toLocaleString()}M (
                  {diff > 0 ? '+' : ''}
                  {diff.toLocaleString()})
                </p>
              )}
              <p className="text-fg-subtle mt-2 text-[11px]">
                기본값 {l.defaultValue.toLocaleString()}M · 같은 타입 상품
                전체에 적용
              </p>
            </div>
          )
        })}
      </div>

      {/* 저장 바 */}
      <div className="bg-brand-deep mt-4 flex flex-col gap-3 rounded-xl p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-sm font-bold">
            <Info className="h-4 w-4" />
            변경 {changeCount}건 — 저장 대기
          </p>
          <p className="mt-1 text-xs text-white/70">
            저장 시 PATCH 요청으로 일괄 반영 · 변경된 타입만 갱신
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-white/15 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/25"
          >
            <RotateCcw className="h-4 w-4" />
            초기화 — 기본값 복원
          </button>
          <button
            type="button"
            disabled={changeCount === 0}
            onClick={openSave}
            className="bg-surface text-brand-deep inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-[13px] font-semibold transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            한도 저장 — 변경 {changeCount}건
          </button>
        </div>
      </div>

      {/* 타입 한도 정책 §21 */}
      <div className="border-info/30 bg-info-bg/50 mt-6 rounded-xl border p-5">
        <p className="text-info inline-flex items-center gap-1.5 text-base font-bold">
          <Info className="h-4 w-4" />
          타입 한도 정책 · §21 완료 기준
        </p>
        <ul className="text-info/90 mt-2 flex flex-col gap-1.5 text-[13px] leading-relaxed">
          <li>현재 한도와 변경값을 카드 안에서 구분 (변경됨 AMBER 배지)</li>
          <li>
            저장 후 같은 타입 상품 전체에 즉시 반영 (PATCH
            /api/admin/mileage/product-type-limits)
          </li>
          <li>
            구매 요청 승인 시 타입별 누적 사용 한도 검증 — §19 한도 초과 시 자동
            차단
          </li>
        </ul>
      </div>

      {/* 저장 확인 모달 — 운영 액션 모달 공통 재사용 */}
      <ActionModal
        spec={confirm}
        onClose={() => setConfirm(null)}
        onConfirm={save}
      />
    </div>
  )
}
