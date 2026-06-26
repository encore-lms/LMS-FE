import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Info,
  PlusCircle,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { Pagination } from '@/components/data/Pagination'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { HrdCourseResult, HrdCourseStatus } from '@/shared/types'
import { useHrdCourseSearch } from '../api/settings'
import { ActionModal, type ActionModalSpec } from './ActionModal'
import { SettingsTabs } from './SettingsTabs'

const STATUS_TONE: Record<HrdCourseStatus, BadgeTone> = {
  unregistered: 'info',
  registered: 'success',
  ended: 'neutral',
}

// 검색 폼 기본값 — 이전 LMS CourseAddView와 동일 구성(인증키·와일드카드 like 검색).
const SEARCH_DEFAULTS = {
  org: '플레이데이터',
  title: 'AI 캠프',
  from: '2025-02-07',
  to: '2026-12-31',
}

// 교육 과정 추가 (/admin/settings/courses/new) — HRD-Net 검색·등록. (Figma 1284:9435)
// 등록은 운영 액션 모달 v2(1306:8293) 확인 후 실행 — (trprId + 기수) 1:1 중복 차단.
export default function CourseAddPage() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const { data, isPending, isError, refetch } = useHrdCourseSearch(page)
  const [form, setForm] = useState(SEARCH_DEFAULTS)
  // 조회 시 적용된 과정명 필터(클라이언트). 빈 값이면 전체.
  const [appliedQuery, setAppliedQuery] = useState('')
  const [modal, setModal] = useState<ActionModalSpec | null>(null)
  // 등록/제거 낙관적 토글 — mock이라 영속 없음(새로고침 초기화).
  const [registeredOverride, setRegisteredOverride] = useState<
    Record<string, boolean>
  >({})
  const [pendingCourse, setPendingCourse] = useState<HrdCourseResult | null>(
    null,
  )
  usePageHeader('운영 설정 · 교육 과정 추가')

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="HRD-Net 검색 결과를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const results = appliedQuery
    ? data.results.filter(
        (r) => r.title.includes(appliedQuery) || r.grade.includes(appliedQuery),
      )
    : data.results

  const isRegistered = (c: HrdCourseResult) =>
    registeredOverride[c.trprId] ?? c.status === 'registered'

  const openRegister = (c: HrdCourseResult) => {
    setPendingCourse(c)
    setModal({
      title: 'HRD 과정 등록 확인',
      subtitle: '선택한 HRD 과정을 LMS 과정으로 등록합니다.',
      rows: [
        { label: '과정', value: `${c.title} ${c.grade}` },
        { label: 'HRD 식별자', value: `trprId ${c.trprId}` },
        { label: '중복 검증', value: '동일 (trprId + 기수) 등록 차단' },
        { label: '등록 후 작업', value: '강사·퀴즈·멘토 매핑 필요' },
      ],
      confirmLabel: '등록',
    })
  }

  const onConfirmRegister = (memo: string) => {
    if (pendingCourse) {
      setRegisteredOverride((p) => ({ ...p, [pendingCourse.trprId]: true }))
      toast.success(
        `${pendingCourse.title} ${pendingCourse.grade} 등록 — 감사 로그에 기록됨`,
      )
      if (memo.trim()) toast.info('매니저 메모가 감사 로그에 함께 기록됐어요')
    }
    setPendingCourse(null)
    setModal(null)
  }

  const removeRegistration = (c: HrdCourseResult) => {
    setRegisteredOverride((p) => ({ ...p, [c.trprId]: false }))
    toast.success(`${c.title} ${c.grade} 시스템 등록 제거`)
  }

  return (
    <div className="p-8">
      {/* 히어로 */}
      <div className="bg-brand mt-4 flex flex-wrap items-start justify-between gap-4 rounded-xl px-6 py-5 text-white">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-white/60">
            COURSE ADD · HRD-Net 과정 등록
          </p>
          <p className="mt-1 text-xl font-bold">교육 과정 추가</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-white/15 px-2.5 py-1 font-mono">
              APIPO0101T.do
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-1">
              12 카드 / 페이지
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-1">
              (trprId + 기수) 1:1 중복 차단
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-medium tracking-wide">
            이번 검색 결과
          </p>
          <p className="text-2xl font-bold">{data.summary.total}</p>
          <p className="text-[11px]">scn_cnt 기준 · {data.totalPages} 페이지</p>
        </div>
      </div>

      <SettingsTabs
        right={
          <>
            <Info className="h-3 w-3" /> 검색 → 카드 선택 → 시스템 등록 →
            담당자·기능 설정은 별도 탭
          </>
        }
      />

      {/* HRD 검색 폼 */}
      <div className="border-border bg-surface mt-4 rounded-xl border p-5">
        <p className="text-fg text-sm font-bold">HRD-Net 과정 검색</p>
        <p className="text-fg-subtle text-xs">인증키 · 과정명·기관명 검색</p>
        <div className="mt-3 grid items-end gap-3 lg:grid-cols-[200px_1fr_1fr_150px_150px_auto]">
          <label className="flex flex-col gap-1">
            <span className="text-fg text-xs font-bold">
              인증키 <span className="text-danger">*</span>
            </span>
            <select
              aria-label="인증키"
              defaultValue="prod"
              className="border-border text-fg focus:border-brand h-10 rounded-lg border bg-white px-3 text-sm outline-none"
            >
              <option value="prod">HRD 운영키 2026 (APIPO****9K2A)</option>
              <option value="sub">HRD 보조키 (APIPO****77QA)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-fg text-xs font-bold">훈련기관명</span>
            <input
              value={form.org}
              onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
              aria-label="훈련기관명"
              className="border-border text-fg focus:border-brand h-10 rounded-lg border bg-white px-3 text-sm outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-fg text-xs font-bold">훈련과정명</span>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              aria-label="훈련과정명"
              className="border-border text-fg focus:border-brand h-10 rounded-lg border bg-white px-3 text-sm outline-none"
            />
          </label>
          {/* 공통 DateTimePicker(date 모드) — 조회기간 범위. 시작≤종료 자동 제약. */}
          <DateTimePicker
            mode="date"
            label="조회기간 시작"
            value={form.from}
            onChange={(v) => setForm((f) => ({ ...f, from: v }))}
            ariaLabel="조회기간 시작"
            max={form.to || undefined}
            placeholder="시작일"
          />
          <DateTimePicker
            mode="date"
            label="조회기간 종료"
            value={form.to}
            onChange={(v) => setForm((f) => ({ ...f, to: v }))}
            ariaLabel="조회기간 종료"
            min={form.from || undefined}
            placeholder="종료일"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(SEARCH_DEFAULTS)
                setAppliedQuery('')
              }}
              className="border-border text-fg-muted hover:bg-surface-muted flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 검색 조건 초기화
            </button>
            <button
              type="button"
              onClick={() => {
                const q = form.title.trim()
                setPage(1)
                setAppliedQuery(q)
                const n = q
                  ? data.results.filter(
                      (r) => r.title.includes(q) || r.grade.includes(q),
                    ).length
                  : data.results.length
                toast.success(`HRD-Net 조회 — ${n}건`)
              }}
              className="bg-brand-deep flex h-10 items-center gap-1.5 rounded-lg px-4 text-xs font-bold text-white"
            >
              <Search className="h-3.5 w-3.5" /> 조회
            </button>
          </div>
        </div>
      </div>

      {/* KPI 4 */}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="검색 결과"
          value={data.summary.total}
          hint="scn_cnt 기준"
          icon={<FileText className="h-4 w-4" />}
        />
        <KpiCard
          label="등록 가능"
          value={data.summary.registrable}
          tone="info"
          hint="종료 제외 미등록"
          icon={<PlusCircle className="h-4 w-4" />}
        />
        <KpiCard
          label="이미 등록"
          value={data.summary.registered}
          tone="success"
          hint="(trprId + 기수) 매칭"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <KpiCard
          label="종료 과정"
          value={data.summary.ended}
          hint="endDate < today 비활성"
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>

      {/* 결과 카드 그리드 */}
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-fg text-sm font-bold">
            검색 결과 · 페이지 {data.page}
          </p>
          <p className="text-fg-subtle text-xs">
            LMS 저장 필드: title · trprId · 기수 · 기간 / 정원·신청·링크는
            미저장 (검색 시점만 표시)
          </p>
        </div>
        <span className="text-fg-subtle text-xs">정렬: 시작일 DESC</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {results.map((c) => {
          const registered = isRegistered(c)
          const ended = c.status === 'ended'
          return (
            <div
              key={c.trprId}
              className={cn(
                'border-border bg-surface flex flex-col gap-2.5 rounded-xl border p-4',
                ended && 'opacity-60',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 font-mono text-[11px]">
                  {c.trprId}
                </span>
                <StatusBadge
                  label={ended ? '종료' : registered ? '등록됨' : '미등록'}
                  tone={
                    ended
                      ? STATUS_TONE.ended
                      : registered
                        ? STATUS_TONE.registered
                        : STATUS_TONE.unregistered
                  }
                />
              </div>
              <div>
                <p className="text-fg text-sm font-bold">{c.title}</p>
                <p className="text-fg-subtle text-xs">{c.grade}</p>
              </div>
              <div className="bg-surface-muted flex flex-col gap-1 rounded-lg px-3 py-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-fg-subtle">기간</span>
                  <span className="text-fg font-medium">{c.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fg-subtle">정원 / 신청</span>
                  <span className="text-fg font-medium">
                    {c.capacity} / {c.applied}
                  </span>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <a
                  href={c.hrdUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-info flex items-center gap-1 text-xs font-medium hover:underline"
                >
                  HRD-Net 신청 페이지 <ExternalLink className="h-3 w-3" />
                </a>
                {ended ? (
                  <span className="text-fg-subtle text-xs">종료된 과정</span>
                ) : registered ? (
                  <button
                    type="button"
                    onClick={() => removeRegistration(c)}
                    className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2.5 py-1.5 text-xs font-medium"
                  >
                    시스템 등록 제거
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openRegister(c)}
                    className="bg-brand-deep flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-bold text-white"
                  >
                    <PlusCircle className="h-3 w-3" /> 시스템 등록
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {results.length === 0 && (
        <p className="text-fg-subtle py-10 text-center text-sm">
          조건에 맞는 과정이 없어요
        </p>
      )}

      {/* 페이지네이션 — 공통 Pagination. mock이 page별 다른 결과 반환(a안) + placeholderData로 깜빡임 제거. */}
      <div className="mt-4">
        <Pagination
          page={page}
          pageCount={data.totalPages}
          totalCount={data.summary.total}
          shownCount={results.length}
          onPage={setPage}
        />
      </div>

      <ActionModal
        spec={modal}
        onClose={() => {
          setPendingCourse(null)
          setModal(null)
        }}
        onConfirm={onConfirmRegister}
      />
    </div>
  )
}
