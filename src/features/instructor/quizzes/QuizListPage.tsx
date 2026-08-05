import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuizBasePath, useQuizTemplateBasePath } from './useQuizBasePath'
import { FileText, Plus, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type {
  GradingMode,
  InstructorQuizRow,
  QuizVisibility,
} from '@/shared/types'
import { useDeleteQuiz, useInstructorQuizzes } from '../api/quizzes'
import { useQuizTemplates } from '../api/quizTemplates'
import { GRADING_MODE_META, VISIBILITY_META } from './meta'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { ListToolbar } from '@/components/ui/ListToolbar'
import { SearchInput } from '@/components/ui/SearchInput'
import { FilterSelect } from '@/components/ui/FilterSelect'

type ModeFilter = 'all' | GradingMode
type VisibilityFilter = 'all' | QuizVisibility

// 퀴즈 관리 목록 (/instructor/quizzes) — §5. (Figma 1337:9753)
// 제출 있는 퀴즈는 삭제 비활성, 임시저장은 제출 현황 비활성.
// embedded=true면 과정·기수·교과목 '퀴즈' 탭에 임베드(자체 헤더·패딩 생략).
export default function QuizListPage({
  embedded = false,
  cohortId = null,
}: {
  embedded?: boolean
  /** 임베드(과정·기수·교과목 탭) 시 선택 기수로 목록 스코프 */
  cohortId?: string | null
}) {
  const navigate = useNavigate()
  const base = useQuizBasePath()
  const templateBase = useQuizTemplateBasePath()
  const toast = useToast()
  // 허브(퀴즈 탭) 진입이면 폼·제출현황에 cohortId를 넘겨 저장·취소 후 허브로 복귀·기수 고정.
  const hubQs = embedded && cohortId ? `?cohortId=${cohortId}` : ''
  const { data, isPending, isError, refetch } = useInstructorQuizzes(cohortId)
  const deleteQuiz = useDeleteQuiz()
  const [q, setQ] = useState('')
  const [cohort, setCohort] = useState<string>('전체')
  const [mode, setMode] = useState<ModeFilter>('all')
  const [visibility, setVisibility] = useState<VisibilityFilter>('all')
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateQ, setTemplateQ] = useState('')
  usePageHeader(
    '퀴즈 관리',
    '담당 기수의 퀴즈를 출제하고 채점 현황을 관리합니다',
    !embedded,
  )

  // 기수 필터 옵션 — 데이터에서 파생(실 기수 라벨). AssignmentsPage와 동일 패턴.
  const cohortOpts = useMemo(
    () => ['전체', ...new Set((data?.items ?? []).map((i) => i.cohortLabel))],
    [data],
  )

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    const needle = q.trim().toLowerCase()
    return items.filter((r) => {
      if (cohort !== '전체' && r.cohortLabel !== cohort) return false
      if (mode !== 'all' && r.gradingMode !== mode) return false
      if (visibility !== 'all' && r.visibility !== visibility) return false
      if (needle) {
        const hay = `${r.title} ${r.subject}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [data, q, cohort, mode, visibility])

  const gradingCell = (r: InstructorQuizRow) => {
    if (r.manualPending === null)
      return <span className="text-fg-muted text-sm">-</span>
    if (r.manualPending > 0)
      return (
        <StatusBadge label={`수동 대기 ${r.manualPending}`} tone="warning" />
      )
    if (r.gradingMode === 'AUTO')
      return <StatusBadge label="자동 완료" tone="success" />
    return <StatusBadge label="완료" tone="success" />
  }

  const columns: Column<InstructorQuizRow>[] = [
    {
      key: 'title',
      header: '퀴즈명',
      cell: (r) => (
        // 긴 퀴즈명이 여러 줄로 접히지 않도록 폭 상한 + 말줄임.
        <div className="max-w-[320px]">
          <p className="text-fg truncate text-sm font-medium" title={r.title}>
            {r.title}
          </p>
          <p className="text-fg-subtle truncate text-xs">
            {[r.cohortLabel, r.subject].filter(Boolean).join(' · ')}
          </p>
        </div>
      ),
    },
    {
      key: 'mode',
      header: '채점 모드',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={GRADING_MODE_META[r.gradingMode].label}
          tone={GRADING_MODE_META[r.gradingMode].tone}
        />
      ),
    },
    {
      key: 'period',
      header: '기간',
      className: 'w-36',
      cell: (r) =>
        r.startAt || r.endAt ? (
          <div className="text-fg-muted text-xs">
            <p>{r.startAt || '—'}</p>
            <p>~ {r.endAt || '—'}</p>
          </div>
        ) : (
          <span className="text-fg-subtle text-xs">기간 미설정</span>
        ),
    },
    {
      key: 'submitRate',
      header: '제출률',
      className: 'w-28',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">
            {r.submitted} / {r.targetCount}
          </p>
          <p className="text-fg-subtle text-xs">
            {r.targetCount > 0
              ? Math.round((r.submitted / r.targetCount) * 100)
              : 0}
            %
          </p>
        </div>
      ),
    },
    {
      key: 'grading',
      header: '채점 상태',
      className: 'w-32',
      cell: gradingCell,
    },
    {
      key: 'visibility',
      header: '공개 상태',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={VISIBILITY_META[r.visibility].label}
          tone={VISIBILITY_META[r.visibility].tone}
        />
      ),
    },
    {
      key: 'actions',
      header: '액션',
      className: 'w-60',
      cell: (r) => {
        const hasSubmissions = r.submitted > 0
        const isDraft = r.visibility === 'draft'
        return (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`${base}/${r.id}/edit${hubQs}`)
              }}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap"
            >
              수정
            </button>
            <button
              type="button"
              disabled={hasSubmissions}
              title={
                hasSubmissions
                  ? '제출이 있는 퀴즈는 삭제할 수 없어요'
                  : undefined
              }
              onClick={(e) => {
                e.stopPropagation()
                deleteQuiz.mutate(r.id, {
                  onSuccess: () => toast.success(`${r.title} 삭제`),
                  onError: () => toast.danger('삭제에 실패했어요'),
                })
              }}
              className={cn(
                'rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap',
                hasSubmissions
                  ? 'border-border text-fg-subtle cursor-not-allowed opacity-50'
                  : 'border-danger/40 text-danger hover:bg-danger-bg',
              )}
            >
              삭제
            </button>
            <button
              type="button"
              disabled={isDraft}
              title={isDraft ? '임시저장 퀴즈는 제출 현황이 없어요' : undefined}
              onClick={(e) => {
                e.stopPropagation()
                navigate(`${base}/${r.id}/submissions${hubQs}`)
              }}
              className={cn(
                'rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap',
                isDraft
                  ? 'border-border text-fg-subtle cursor-not-allowed opacity-50'
                  : 'border-border text-fg-muted hover:bg-surface-muted',
              )}
            >
              제출 현황
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<SkeletonListPage kpis={3} columns={5} className="" />}
      errorTitle="퀴즈 목록을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className={embedded ? '' : 'p-8'}
    >
      {data && (
        <div className={embedded ? '' : 'p-8'}>
          {/* 탭 공통 툴바(ListToolbar) — 좌: 총 개수 / 우: 검색·필터·주 액션 */}
          <ListToolbar
            left={
              <span>
                총 {data.total}개 · 수동 대기 {data.manualPendingTotal}건
              </span>
            }
            search={{
              value: q,
              onChange: setQ,
              placeholder: '퀴즈명·과목으로 검색',
              ariaLabel: '퀴즈 검색',
            }}
            filters={
              <>
                {/* 기수 필터 — 임베드(과정·기수·교과목 탭)에선 상단에서 이미 기수를 선택하므로 숨김 */}
                {!embedded && (
                  <FilterSelect
                    label="기수"
                    value={cohort}
                    onChange={setCohort}
                    options={cohortOpts.map((c) => ({ value: c, label: c }))}
                  />
                )}
                <FilterSelect
                  label="채점 모드"
                  value={mode}
                  onChange={(v) => setMode(v as ModeFilter)}
                  options={[
                    { value: 'all', label: '전체' },
                    { value: 'AUTO', label: 'AUTO' },
                    { value: 'MANUAL', label: 'MANUAL' },
                    { value: 'MIXED', label: 'MIXED' },
                  ]}
                />
                <FilterSelect
                  label="공개 상태"
                  value={visibility}
                  onChange={(v) => setVisibility(v as VisibilityFilter)}
                  options={[
                    { value: 'all', label: '전체' },
                    { value: 'draft', label: '임시저장' },
                    { value: 'published', label: '공개' },
                    { value: 'closed', label: '종료' },
                  ]}
                />
              </>
            }
            actions={
              <>
                {/* 템플릿 관리 — 전역 자산이라 별도 메뉴 없이 퀴즈 영역에서 진입(생성·편집·삭제). */}
                <Button
                  variant="secondary"
                  onClick={() => navigate(templateBase)}
                >
                  <Settings2 className="h-4 w-4" /> 템플릿 관리
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setTemplateOpen(true)}
                >
                  <FileText className="h-4 w-4" /> 템플릿 열기
                </Button>
                <Button
                  onClick={() =>
                    navigate(
                      `${base}/new${cohortId ? `?cohortId=${cohortId}` : ''}`,
                    )
                  }
                >
                  <Plus className="h-4 w-4" /> 퀴즈 생성
                </Button>
              </>
            }
          />

          <div className="mt-4">
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              onRowClick={(r) => navigate(`${base}/${r.id}/edit${hubQs}`)}
              empty="조건에 맞는 퀴즈가 없어요"
            />
          </div>

          {/* 템플릿 열기 — 검색 + 템플릿 목록 팝업 */}
          <TemplatePickerModal
            open={templateOpen}
            query={templateQ}
            onQueryChange={setTemplateQ}
            onClose={() => setTemplateOpen(false)}
            onPick={(t) => {
              setTemplateOpen(false)
              navigate(
                `${base}/new?templateId=${t.id}${cohortId ? `&cohortId=${cohortId}` : ''}`,
              )
            }}
          />
        </div>
      )}
    </DataBoundary>
  )
}

// 템플릿 열기 팝업 — 검색 입력 + 템플릿 목록(useQuizTemplates). 열렸을 때만 조회.
function TemplatePickerModal({
  open,
  query,
  onQueryChange,
  onClose,
  onPick,
}: {
  open: boolean
  query: string
  onQueryChange: (v: string) => void
  onClose: () => void
  onPick: (t: { id: string; name: string }) => void
}) {
  const { data, isPending } = useQuizTemplates()
  const needle = query.trim().toLowerCase()
  const items = (data?.items ?? []).filter(
    (t) => !needle || `${t.name} ${t.category}`.toLowerCase().includes(needle),
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="템플릿 열기"
      footer={
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {/* 검색 */}
        <SearchInput
          value={query}
          onChange={onQueryChange}
          placeholder="템플릿명·분류로 검색"
          ariaLabel="템플릿 검색"
          className="h-10"
        />

        {/* 목록 */}
        <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
          {isPending ? (
            <p className="text-fg-muted py-8 text-center text-sm">
              불러오는 중…
            </p>
          ) : items.length === 0 ? (
            <p className="text-fg-muted py-8 text-center text-sm">
              템플릿이 없어요
            </p>
          ) : (
            items.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onPick(t)}
                className="border-border hover:border-brand hover:bg-info-bg/40 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-1.5">
                    <span className="text-fg truncate text-sm font-semibold">
                      {t.name}
                    </span>
                    {t.isNew && (
                      <span className="bg-brand/10 text-brand rounded-[4px] px-1.5 py-px text-[10px] font-bold">
                        NEW
                      </span>
                    )}
                  </span>
                  <span className="text-fg-subtle truncate text-xs">
                    {t.category} · 문항 {t.questionCount} · 만점 {t.totalPoints}
                  </span>
                </span>
                <span className="text-fg-subtle shrink-0 text-xs">
                  사용 {t.useCount}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
