import { useState } from 'react'
import { isAxiosError } from 'axios'
import {
  AlertTriangle,
  ExternalLink,
  Info,
  PlusCircle,
  RotateCcw,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Pagination } from '@/components/data/Pagination'
import { Select } from '@/components/ui/Select'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { HrdCourseResult, HrdCourseStatus } from '@/shared/types'
import {
  useHrdKeyList,
  useHrdCourseSearch,
  useRegisterCourse,
  useDeleteCourseRegistration,
} from '../api/settings'
import { ActionModal, type ActionModalSpec } from './ActionModal'
import { SettingsTabs } from './SettingsTabs'

const STATUS_TONE: Record<HrdCourseStatus, BadgeTone> = {
  unregistered: 'info',
  registered: 'success',
  ended: 'neutral',
}

// Date → 'YYYY-MM-DD'
function isoDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 검색 폼 기본값 — 훈련과정명은 비움, 조회기간은 오늘 기준(종료=오늘, 시작=오늘−6개월).
function makeSearchDefaults() {
  const today = new Date()
  const from = new Date(today)
  from.setMonth(from.getMonth() - 6)
  return {
    org: '플레이데이터',
    title: '',
    from: isoDate(from),
    to: isoDate(today),
  }
}

// axios 에러 메시지(BE ErrorResponse.message) 추출.
function errMsg(e: unknown, fallback: string) {
  if (isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string } | undefined)?.message
    if (msg) return msg
  }
  return fallback
}

// 교육 과정 추가 (/admin/settings/courses/new) — HRD-Net 실 검색·등록. (Figma 1284:9435)
// 선택한 HRD Key를 authKey로 work24 호출. (trprId + 기수) 1:1 중복 차단.
export default function CourseAddPage() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  // 폼은 편집 상태, applied는 '조회' 시 적용된 검색 조건(서버 필터).
  const [form, setForm] = useState(makeSearchDefaults)
  const [applied, setApplied] = useState(makeSearchDefaults)
  const [selectedKeyId, setSelectedKeyId] = useState('')
  // 조회 버튼을 눌렀는지 — 누르기 전엔 검색하지 않는다.
  const [searched, setSearched] = useState(false)
  const [modal, setModal] = useState<ActionModalSpec | null>(null)
  const [pendingCourse, setPendingCourse] = useState<HrdCourseResult | null>(
    null,
  )
  usePageHeader('운영 설정 · 교육 과정 추가')

  // 실제 등록된 활성 HRD Key 목록 — 인증키 select에 채운다.
  const { data: keyList } = useHrdKeyList({ active: true, size: 100 })
  const activeKeys = keyList?.items ?? []
  // 선택 없으면 첫 활성 키를 기본 사용(BE도 미지정 시 활성 키 폴백).
  const effectiveKeyId = selectedKeyId || activeKeys[0]?.id || ''

  // '조회'(searched) 전에는 호출하지 않는다.
  const { data, isPending, isError, error, refetch } = useHrdCourseSearch(
    {
      keyId: effectiveKeyId || undefined,
      organ: applied.org,
      title: applied.title,
      from: applied.from,
      to: applied.to,
      page,
    },
    searched,
  )
  const registerCourse = useRegisterCourse()
  const removeCourse = useDeleteCourseRegistration()

  const results = data?.results ?? []

  // 조회 후 실패 시 결과 영역에 표시할 에러 안내.
  const errorView = () => {
    // 교육 과정 추가도 실 BE(learning-service) 전용. mock 모드에선 mock 토큰이라 401.
    const status = isAxiosError(error) ? error.response?.status : undefined
    const realAuth = import.meta.env.VITE_REAL_AUTH === 'true'
    const view = !realAuth
      ? {
          title: '교육 과정 추가는 서버 연동 환경에서만 사용할 수 있어요',
          description:
            '관리자(ADMIN/MANAGER) 계정으로 로그인했는지 확인해 주세요.',
        }
      : status === 401 || status === 403
        ? {
            title: '인증이 필요해요',
            description:
              '로그인이 만료됐거나 권한이 없습니다. ADMIN/MANAGER로 다시 로그인해 주세요(토큰 TTL 30분).',
          }
        : {
            title: 'HRD-Net 검색 결과를 불러오지 못했어요',
            description: errMsg(
              error,
              '연결 상태를 확인한 뒤 다시 시도해 주세요.',
            ),
          }
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title={view.title}
        description={view.description}
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const openRegister = (c: HrdCourseResult) => {
    setPendingCourse(c)
    setModal({
      title: 'HRD 과정 등록 확인',
      subtitle: '선택한 HRD 과정을 LMS 과정으로 등록합니다.',
      rows: [
        { label: '과정', value: `${c.title} ${c.grade}` },
        { label: '기간', value: c.period },
      ],
      confirmLabel: '등록',
    })
  }

  const onConfirmRegister = (memo: string) => {
    const c = pendingCourse
    setPendingCourse(null)
    setModal(null)
    if (!c) return
    registerCourse.mutate(
      {
        trprId: c.trprId,
        title: c.title,
        grade: c.grade,
        startDate: c.startDate,
        endDate: c.endDate,
      },
      {
        onSuccess: () => {
          toast.success(`${c.title} ${c.grade} 등록 — 감사 로그에 기록됨`)
          if (memo.trim())
            toast.info('매니저 메모가 감사 로그에 함께 기록됐어요')
        },
        onError: (e) => toast.danger(errMsg(e, '과정 등록에 실패했어요')),
      },
    )
  }

  const removeRegistration = (c: HrdCourseResult) => {
    removeCourse.mutate(
      { trprId: c.trprId, grade: c.grade },
      {
        onSuccess: () =>
          toast.success(`${c.title} ${c.grade} 시스템 등록 제거`),
        onError: (e) => toast.danger(errMsg(e, '등록 제거에 실패했어요')),
      },
    )
  }

  const onSearch = () => {
    setPage(1)
    setApplied({ ...form })
    setSearched(true)
  }

  return (
    <div className="p-8">
      {/* 히어로 */}
      <div className="bg-brand text-on-color mt-4 flex flex-wrap items-start justify-between gap-4 rounded-xl px-6 py-5">
        <div>
          <p className="text-on-color/60 text-[11px] font-semibold tracking-wider">
            COURSE ADD · HRD-Net 과정 등록
          </p>
          <p className="mt-1 text-xl font-bold">교육 과정 추가</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-medium tracking-wide">
            이번 검색 결과
          </p>
          <p className="text-2xl font-bold">{data?.summary.total ?? '-'}</p>
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
          <div className="flex flex-col gap-1">
            <span className="text-fg text-xs font-bold">
              인증키 <span className="text-danger">*</span>
            </span>
            <Select
              aria-label="인증키"
              value={effectiveKeyId}
              onChange={(v) => {
                setSelectedKeyId(v)
                setPage(1)
              }}
              options={activeKeys.map((k) => ({
                value: k.id,
                label: `${k.name} (${k.maskedKey})`,
              }))}
              placeholder="활성 키 없음 — HRD API Key 등록 필요"
              disabled={activeKeys.length === 0}
            />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-fg text-xs font-bold">훈련기관명</span>
            <input
              value={form.org}
              onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
              aria-label="훈련기관명"
              className="border-border text-fg focus:border-brand bg-surface h-10 rounded-lg border px-3 text-sm outline-none focus-visible:shadow-none"
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
              placeholder="예: AI 캠프 (비워두면 전체)"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface h-10 rounded-lg border px-3 text-sm outline-none focus-visible:shadow-none"
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
                const d = makeSearchDefaults()
                setForm(d)
                setApplied(d)
                setSearched(false)
                setPage(1)
              }}
              className="border-border text-fg-muted hover:bg-surface-muted flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 검색 조건 초기화
            </button>
            <Button onClick={onSearch}>
              <Search className="h-3.5 w-3.5" /> 조회
            </Button>
          </div>
        </div>
      </div>

      {!searched ? (
        <Empty
          icon={<Search className="h-6 w-6" />}
          title="검색 조건을 설정하고 조회하세요"
          description="인증키·훈련기관명·훈련과정명·조회기간을 설정한 뒤 '조회'를 누르면 HRD-Net 과정이 표시됩니다."
        />
      ) : isPending ? (
        <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
      ) : isError || !data ? (
        errorView()
      ) : (
        <>
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
              const registered = c.status === 'registered'
              const ended = c.status === 'ended'
              return (
                <div
                  key={c.trprId}
                  className={cn(
                    'border-border bg-surface flex flex-col gap-3 rounded-xl border p-4 transition-colors',
                    ended
                      ? 'opacity-80'
                      : 'hover:border-brand/40 hover:shadow-sm',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-surface-muted text-fg-muted rounded px-2 py-0.5 font-mono text-[11px] font-medium tracking-tight">
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
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-fg text-base leading-snug font-bold">
                      {c.title}
                    </p>
                    <span className="bg-accent-bg text-accent-strong inline-block rounded px-1.5 py-0.5 text-[11px] font-bold">
                      {c.grade}
                    </span>
                  </div>
                  <dl className="border-divider grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t pt-3 text-xs">
                    <dt className="text-fg-muted">기간</dt>
                    <dd className="text-fg text-right font-semibold tabular-nums">
                      {c.period}
                    </dd>
                    <dt className="text-fg-muted">정원 / 신청</dt>
                    <dd className="text-fg text-right font-semibold tabular-nums">
                      {c.capacity} / {c.applied}
                    </dd>
                  </dl>
                  <div className="border-divider mt-auto flex items-center justify-between border-t pt-3">
                    <a
                      href={c.hrdUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-info flex items-center gap-1 text-xs font-medium hover:underline"
                    >
                      HRD-Net 신청 페이지 <ExternalLink className="h-3 w-3" />
                    </a>
                    {ended ? (
                      <span className="text-fg-subtle text-xs font-medium">
                        종료된 과정
                      </span>
                    ) : registered ? (
                      <button
                        type="button"
                        onClick={() => removeRegistration(c)}
                        disabled={removeCourse.isPending}
                        className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                      >
                        시스템 등록 제거
                      </button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => openRegister(c)}
                        disabled={registerCourse.isPending}
                      >
                        <PlusCircle className="h-3 w-3" /> 시스템 등록
                      </Button>
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

          {/* 페이지네이션 — 공통 Pagination. 서버 페이지네이션 + placeholderData로 깜빡임 제거. */}
          <div className="mt-4">
            <Pagination
              page={page}
              pageCount={data.totalPages}
              totalCount={data.summary.total}
              shownCount={results.length}
              onPage={setPage}
            />
          </div>
        </>
      )}

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
