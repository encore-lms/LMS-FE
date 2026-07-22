import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MinusCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Avatar } from '@/components/ui/Avatar'
import { Checkbox } from '@/components/ui/Checkbox'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { DataTable, type Column } from '@/components/data/DataTable'
import { cn } from '@/shared/lib/cn'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
// 운영 액션 모달 v2 공통 — 처리 요약 + 메모 + 권한 확인(설정 화면과 동일 골격, 재사용).
import {
  ActionModal,
  type ActionModalSpec,
} from '@/features/admin/settings/ActionModal'
import { MileageTabs } from '../MileageTabs'
import { CohortScopeSelect } from '../CohortScope'
import { useMyCohorts } from '../../api/dashboard'
import { useDirectPayRoster, useDirectPaySubmit } from './api'
import type { MileageStudent, PayKind } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'

const QUICK_ADD = [1000, 5000, 10000, 50000]

// 마일리지 직접 지급 (/admin/mileage/direct-pay) — 운영(MANAGER/ADMIN) 신규.
// Figma 1226:6549 + 실행 확인(1306:8365)·결과(1306:8401) 모달.
// 다중 수강생 일괄 지급/차감 · 한도 자동 검증. 실제 처리는 BE 계약(P0_16) 미확정 → mock 흐름.
export default function DirectPayPage() {
  usePageHeader(
    '마일리지 직접 지급',
    '여러 수강생에게 마일리지를 한 번에 지급하거나 차감합니다',
  )
  const [cohortId, setCohortId] = useSearchParamState('cohortId')
  // 진입 시 담당 기수를 기본 선택 — '전체 기수' 고정으로 다른 기수 오지급을 방지.
  const myCohorts = useMyCohorts()
  const didDefaultCohort = useRef(false)
  useEffect(() => {
    if (didDefaultCohort.current || cohortId) return
    const first = myCohorts.data?.[0]
    if (!first) return
    didDefaultCohort.current = true
    setCohortId(first.cohortId)
  }, [cohortId, myCohorts.data, setCohortId])
  const { data, isPending, isError, refetch } = useDirectPayRoster(cohortId)
  const submit = useDirectPaySubmit()
  const navigate = useNavigate()
  const toast = useToast()

  // 금전성 화면 — 사전 선택 없이 빈 상태로 시작(오지급 방지).
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [kind, setKind] = useState<PayKind>('grant')
  const [amount, setAmount] = useState(50000)
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState<ActionModalSpec | null>(null)
  const [result, setResult] = useState<{ count: number; total: number } | null>(
    null,
  )

  // 이름 가나다순 고정(운영 요구)
  const students = useMemo(
    () =>
      [...(data?.students ?? [])].sort((a, b) =>
        (a.name ?? '').localeCompare(b.name ?? '', 'ko'),
      ),
    [data],
  )
  const selectedCount = selected.size
  const total = selectedCount * amount
  const word = kind === 'grant' ? '지급' : '차감'
  const canSubmit = selectedCount > 0 && amount > 0 && reason.trim().length > 0

  const { course, cohortLabel, totalStudents, nearLimitCount } = data ?? {
    course: '',
    cohortLabel: '',
    totalStudents: 0,
    nearLimitCount: 0,
  }
  const allSelected = students.length > 0 && selected.size === students.length

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  const toggleAll = (on: boolean) =>
    setSelected(on ? new Set(students.map((s) => s.id)) : new Set())

  const openConfirm = () => {
    setConfirm({
      title: `마일리지 ${word} 실행 확인`,
      subtitle: `선택 수강생에게 직접 ${word}을 실행합니다.`,
      rows: [
        {
          label: '대상',
          value: `선택 ${selectedCount}명 · ${course} ${cohortLabel}`,
        },
        {
          label: '금액',
          value: `1인 ${amount.toLocaleString()}M · 총 ${total.toLocaleString()}M`,
        },
        { label: '사유', value: reason },
      ],
      confirmLabel: '실행',
    })
  }

  const runPay = (memo: string) => {
    // 실행 시점의 선택 인원·총액을 동결(처리 후 선택을 비우므로 결과 모달엔 동결값 사용).
    const count = selectedCount
    const grandTotal = total
    submit.mutate(
      { ids: [...selected], kind, amount, reason, memo },
      {
        onSuccess: () => {
          setConfirm(null)
          setResult({ count, total: grandTotal })
          setSelected(new Set()) // 처리 완료 — 선택 초기화(목록은 캐시 갱신으로 보유/누적 즉시 반영)
        },
        onError: () => {
          setConfirm(null)
          toast.danger(
            `마일리지 ${word} 처리에 실패했어요. 잠시 후 다시 시도해 주세요.`,
          )
        },
      },
    )
  }

  const columns: Column<MileageStudent>[] = [
    {
      key: 'select',
      header: <Checkbox checked={allSelected} onChange={toggleAll} label="" />,
      className: 'w-12',
      cell: (s) => (
        <Checkbox
          checked={selected.has(s.id)}
          onChange={(on) => toggle(s.id, on)}
          label=""
        />
      ),
    },
    {
      key: 'student',
      header: '수강생',
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={s.name} size={28} />
          <div className="min-w-0">
            <p className="text-fg flex items-center gap-1.5 text-[13px] font-semibold">
              {s.name}
              {s.nearLimit && <StatusBadge label="상한 근접" tone="warning" />}
            </p>
            <p className="text-fg-subtle text-[11px] tabular-nums">
              현재 {s.held.toLocaleString()}M · 누적{' '}
              {s.accrued.toLocaleString()}M · 사용 {s.used.toLocaleString()}M
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'held',
      header: '보유',
      className: 'w-28',
      cell: (s) => (
        <span className="text-fg text-[13px] tabular-nums">
          {s.held.toLocaleString()} <span className="text-fg-subtle">M</span>
        </span>
      ),
    },
    {
      key: 'used',
      header: '사용',
      className: 'w-28',
      cell: (s) => (
        <span className="text-fg-muted text-[13px] tabular-nums">
          {s.used.toLocaleString()} M
        </span>
      ),
    },
    {
      key: 'accrued',
      header: '누적',
      className: 'w-28',
      cell: (s) => (
        <span className="text-fg-muted text-[13px] tabular-nums">
          {s.accrued.toLocaleString()} M
        </span>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 브레드크럼 */}
      {/* 클러스터 탭 + 기수 필터(실 BE) — 기수 전환 시 선택 초기화(오지급 방지) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MileageTabs />
        <CohortScopeSelect
          value={cohortId}
          onChange={(next) => {
            setCohortId(next)
            setSelected(new Set())
          }}
        />
      </div>

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        skeleton={<SkeletonListPage columns={5} className="" />}
        errorTitle="대상 명단을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {/* 2단 — 수강생 다중 선택(좌) + 지급 폼(우) */}
        <div className="mt-5 flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-fg text-base font-bold">
                  수강생 목록 · 다중 선택
                </p>
                <p className="text-fg-muted text-xs">
                  이름·보유·사용·누적 — 체크박스로 일괄 선택
                </p>
              </div>
              <StatusBadge
                label={`선택 ${selectedCount} / ${totalStudents}`}
                tone="accent"
              />
            </div>
            <DataTable
              columns={columns}
              rows={students}
              rowKey={(s) => s.id}
              empty="대상 수강생이 없어요"
            />
            <div className="text-fg-subtle mt-3 text-xs">
              총 {totalStudents}명 · 선택 {selectedCount}명 · 상한 근접{' '}
              {nearLimitCount}명
            </div>
          </div>

          {/* 지급 폼 */}
          <aside className="w-full lg:w-[360px] lg:shrink-0">
            <div className="border-border bg-surface rounded-xl border p-5">
              <p className="text-fg text-base font-bold">{word} 폼</p>
              <p className="text-fg-muted mt-0.5 text-xs">
                선택 {selectedCount}명에 일괄 적용 · 한도 자동 검증
              </p>

              {/* 구분 */}
              <p className="text-fg mt-4 text-[13px] font-semibold">
                구분 <span className="text-danger">*</span>
              </p>
              <div className="border-border bg-surface-muted/40 mt-1.5 grid grid-cols-2 gap-1 rounded-lg p-1">
                {(['grant', 'deduct'] as PayKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      'inline-flex items-center justify-center gap-1 rounded-md py-2 text-[13px] font-semibold transition-colors',
                      kind === k
                        ? k === 'grant'
                          ? 'bg-brand text-on-color'
                          : 'bg-fg text-on-color'
                        : 'text-fg-muted',
                    )}
                  >
                    {k === 'deduct' && <MinusCircle className="h-3.5 w-3.5" />}
                    {k === 'grant' ? '지급' : '차감'}
                  </button>
                ))}
              </div>

              {/* 금액 */}
              <p className="text-fg mt-4 text-[13px] font-semibold">
                금액 (1인당) <span className="text-danger">*</span>
              </p>
              <div className="border-border focus-within:border-brand bg-surface mt-1.5 flex items-center rounded-lg border px-3">
                <input
                  value={amount.toLocaleString()}
                  onChange={(e) =>
                    setAmount(Number(e.target.value.replace(/[^\d]/g, '')) || 0)
                  }
                  inputMode="numeric"
                  aria-label="금액 (1인당)"
                  className="text-fg h-11 flex-1 bg-transparent text-lg font-bold outline-none"
                />
                <span className="text-fg-subtle text-sm">M</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_ADD.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAmount((a) => a + d)}
                    className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-[11px] font-semibold"
                  >
                    +{d.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* 사유 */}
              <p className="text-fg mt-4 text-[13px] font-semibold">
                사유 <span className="text-danger">*</span>
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                aria-label="사유"
                className="border-border focus:border-brand text-fg placeholder:text-fg-subtle bg-surface mt-1.5 w-full rounded-lg border p-3 text-sm outline-none focus-visible:shadow-none"
              />

              {/* 합계 요약 */}
              <div className="border-success/30 bg-success-bg/50 mt-4 flex flex-col gap-1.5 rounded-lg border p-3.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted">선택 인원</span>
                  <span className="text-fg font-bold">{selectedCount}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted">1인당 {word}</span>
                  <span className="text-fg font-bold tabular-nums">
                    {amount.toLocaleString()} M
                  </span>
                </div>
                <div className="border-success/20 flex items-center justify-between border-t pt-1.5">
                  <span className="text-fg-muted">총 {word} 예정</span>
                  <span className="text-success text-lg font-bold tabular-nums">
                    {kind === 'grant' ? '+' : '-'}
                    {total.toLocaleString()} M
                  </span>
                </div>
              </div>

              <Button
                disabled={!canSubmit}
                onClick={openConfirm}
                className="mt-4 w-full"
              >
                {word} 실행 — {kind === 'grant' ? '+' : '-'}
                {total.toLocaleString()}M / {selectedCount}명
              </Button>
            </div>
          </aside>
        </div>

        {/* 실행 확인 모달 — 운영 액션 모달 공통 재사용 */}
        <ActionModal
          spec={confirm}
          onClose={() => setConfirm(null)}
          onConfirm={runPay}
        />

        {/* 지급 결과 모달 */}
        <Modal
          open={!!result}
          onClose={() => setResult(null)}
          title={`마일리지 ${word} 결과`}
          footer={
            <Button
              onClick={() => {
                setResult(null)
                navigate('/admin/mileage/history')
              }}
            >
              내역 보기
            </Button>
          }
        >
          {result && (
            <>
              <p className="text-fg-muted -mt-1 mb-4 text-sm">
                {result.count}명 {word} 완료 · 원장 {result.count}건 생성
              </p>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex gap-3">
                  <dt className="text-fg-muted w-24 shrink-0">{word}</dt>
                  <dd className="text-fg font-medium">
                    {result.total.toLocaleString()}M · {result.count}명
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="text-fg-muted w-24 shrink-0">부분 {word}</dt>
                  <dd className="text-fg">0건 · 한도 정상</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="text-fg-muted w-24 shrink-0">원장</dt>
                  <dd className="text-fg">{result.count}건 · 즉시 반영</dd>
                </div>
              </dl>
              <div className="bg-success-bg mt-4 rounded-lg p-3">
                <p className="text-success text-xs font-bold">다음 액션</p>
                <p className="text-fg-muted mt-0.5 text-xs">
                  {result.count}명 {word} 완료 · 원장 {result.count}건 생성
                </p>
              </div>
            </>
          )}
        </Modal>
      </DataBoundary>
    </div>
  )
}
