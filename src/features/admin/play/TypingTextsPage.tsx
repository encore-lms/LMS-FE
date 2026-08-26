import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Select } from '@/components/ui/Select'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDeletePassage, usePlayTypingTexts, useUpsertPassage } from './api'
import { PassageFormModal } from './PassageFormModal'
import { downloadTypingSampleCsv } from './sampleCsv'
import type { PassageStatus, TypingPassage } from './types'
import { SkeletonListPage } from '@/components/ui/Skeleton'

const STATUS_META: Record<PassageStatus, { label: string; tone: BadgeTone }> = {
  active: { label: '활성', tone: 'success' },
  inactive: { label: '비활성', tone: 'neutral' },
  error: { label: '오류', tone: 'danger' },
}

const LANGUAGES = ['Python', '한글', '영문']
const LEVELS = ['쉬움', '보통', '어려움']

// 폼 모달 기준(우측 참조 패널) — Figma 동결 텍스트.
const FORM_CRITERIA: { label: string; desc: string }[] = [
  { label: '제목', desc: '필수 · 80자 이내' },
  { label: '내용', desc: '필수 · 타자 입력 대상 원문' },
  { label: '언어', desc: 'Python / 한글 / 영문' },
  { label: '난이도', desc: '쉬움 / 보통 / 어려움' },
  { label: '정렬 순서', desc: '기본 0' },
  { label: '활성 여부', desc: '비활성 시 수강생 미노출' },
]

// PLAY 타자 관리 (/admin/play/typing-texts) — 운영(MANAGER/ADMIN) 신규.
// Figma 3380:7959(보강). 과정별 PLAY 타자 제시문 등록·노출 상태·일괄 업로드 오류 관리.
// 운영은 콘텐츠 관리만 — 세션 진행·결과 제출은 P0_14(수강생) 범위. 추가·수정·복제·업로드
// 흐름은 별도 시안 미설계 → 토스트 + TODO.
export default function TypingTextsPage() {
  usePageHeader(
    'PLAY 타자 관리',
    '과정별 타자 게임 제시문을 등록하고 노출 상태를 관리합니다',
  )
  const { data, isPending, isError, refetch } = usePlayTypingTexts()
  const upsert = useUpsertPassage()
  const toast = useToast()
  const navigate = useNavigate()
  const [language, setLanguage] = useSearchParamState('language', 'all')
  const [level, setLevel] = useSearchParamState('level', 'all')
  const [status, setStatus] = useSearchParamState('status', 'all')
  // 제시문 추가·수정 폼 모달(formPassage=null → 추가).
  const [formOpen, setFormOpen] = useState(false)
  const [formPassage, setFormPassage] = useState<TypingPassage | null>(null)
  // 삭제 확인 대상 — 하드 삭제라 다이얼로그로 한 번 확인한다.
  const [deleteTarget, setDeleteTarget] = useState<TypingPassage | null>(null)
  const deletePassage = useDeletePassage()

  const passages = useMemo(() => data?.passages ?? [], [data])
  const filtered = useMemo(
    () =>
      passages.filter((p) => {
        if (language !== 'all' && p.language !== language) return false
        if (level !== 'all' && p.level !== level) return false
        if (status !== 'all' && p.status !== status) return false
        return true
      }),
    [passages, language, level, status],
  )

  // DataBoundary children은 eager 평가 — 로딩/에러 중에도 크래시하지 않게 기본값 폴백.
  const { summary } = data ?? {
    summary: { active: 0, inactive: 0, error: 0, disabledCourses: 0 },
  }

  const columns: Column<TypingPassage>[] = [
    {
      key: 'title',
      header: '제목',
      cell: (p) => (
        <div className="min-w-0">
          <p className="text-fg text-[14px] font-medium">{p.title}</p>
          <p className="text-fg-muted text-xs">{p.previewNote}</p>
        </div>
      ),
    },
    {
      key: 'language',
      header: '언어',
      className: 'w-20',
      cell: (p) => <span className="text-fg text-[13px]">{p.language}</span>,
    },
    {
      key: 'level',
      header: '난이도',
      className: 'w-20',
      cell: (p) => <span className="text-fg text-[13px]">{p.level}</span>,
    },
    {
      key: 'order',
      header: '정렬',
      className: 'w-16',
      cell: (p) => (
        <span className="text-fg text-[13px] tabular-nums">{p.order}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-20',
      cell: (p) => (
        <StatusBadge
          label={STATUS_META[p.status].label}
          tone={STATUS_META[p.status].tone}
        />
      ),
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-32',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFormPassage(p)
              setFormOpen(true)
            }}
            className="text-accent-strong text-[12px] font-semibold hover:underline"
          >
            수정
          </button>
          <button
            type="button"
            // 복제 — 같은 내용으로 새 행 생성. 실수 노출 방지를 위해 비활성으로 시작한다.
            onClick={() =>
              upsert.mutate(
                {
                  id: null,
                  body: {
                    title: `${p.title} 복사본`.slice(0, 80),
                    content: p.content ?? '',
                    language: p.language,
                    level: p.level,
                    order: p.order,
                    active: false,
                  },
                },
                {
                  onSuccess: () =>
                    toast.success(
                      `"${p.title}" 복사본을 만들었습니다 (비활성).`,
                    ),
                  onError: () =>
                    toast.danger('복제에 실패했어요. 잠시 후 다시 시도해 주세요.'),
                },
              )
            }
            className="text-accent-strong text-[12px] font-semibold hover:underline"
          >
            복제
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(p)}
            className="text-danger text-[12px] font-semibold hover:underline"
          >
            삭제
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 액션 툴바 — 헤더 우측 액션 대체 */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            downloadTypingSampleCsv()
            toast.success('샘플 CSV 양식을 내려받았습니다.')
          }}
          className="border-border bg-surface text-fg hover:bg-surface-muted h-9 rounded-lg border px-4 text-[13px] font-semibold transition-colors"
        >
          샘플 다운로드
        </button>
        <button
          type="button"
          // CSV/Excel 일괄 업로드 — 실동작(검증 미리보기 → 정상 행 일괄 등록).
          onClick={() => navigate('/admin/play/typing-texts/bulk')}
          className="bg-brand hover:bg-brand/90 text-on-color h-9 rounded-lg px-4 text-[13px] font-semibold transition-colors"
        >
          일괄 업로드
        </button>
        <button
          type="button"
          onClick={() => {
            setFormPassage(null)
            setFormOpen(true)
          }}
          className="bg-accent-strong text-on-color h-9 rounded-lg px-4 text-[13px] font-semibold transition-colors hover:opacity-90"
        >
          제시문 추가
        </button>
      </div>

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={refetch}
        skeleton={<SkeletonListPage columns={4} className="" />}
        errorTitle="PLAY 제시문을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {/* 필터 — 타자 제시문은 언어·난이도 기준 전역 카탈로그(기수 무관) */}
        <div className="border-border bg-surface mt-4 flex flex-wrap items-center gap-2 rounded-xl border p-3.5">
          <Select
            aria-label="언어 필터"
            value={language}
            onChange={(v) => setLanguage(v)}
            options={[
              { value: 'all', label: '언어 전체' },
              ...LANGUAGES.map((l) => ({ value: l, label: l })),
            ]}
            className="h-9"
          />
          <Select
            aria-label="난이도 필터"
            value={level}
            onChange={(v) => setLevel(v)}
            options={[
              { value: 'all', label: '난이도 전체' },
              ...LEVELS.map((l) => ({ value: l, label: l })),
            ]}
            className="h-9"
          />
          <Select
            aria-label="활성 상태 필터"
            value={status}
            onChange={(v) => setStatus(v)}
            options={[
              { value: 'all', label: '활성 상태 전체' },
              ...(Object.keys(STATUS_META) as PassageStatus[]).map((key) => ({
                value: key,
                label: STATUS_META[key].label,
              })),
            ]}
            className="h-9"
          />
        </div>

        {/* 2단 — 제시문 목록(좌) + 폼 기준 패널(우) */}
        <div className="mt-4 flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-fg text-base font-bold">
                타자 제시문 목록
              </span>
              <span className="text-fg-muted text-xs">
                활성 {summary.active} · 비활성 {summary.inactive} · 오류{' '}
                {summary.error}
              </span>
            </div>
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(p) => p.id}
              empty="조건에 맞는 제시문이 없어요"
            />
          </div>

          <aside className="w-full lg:w-[336px] lg:shrink-0">
            <div className="border-border bg-surface rounded-xl border p-5">
              <p className="text-fg text-base font-bold">제시문 폼 모달 기준</p>
              <dl className="mt-4 flex flex-col gap-3.5">
                {FORM_CRITERIA.map((c) => (
                  <div key={c.label}>
                    <dt className="text-fg text-[13px] font-semibold">
                      {c.label}
                    </dt>
                    <dd className="text-fg-muted mt-0.5 text-xs">{c.desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>

      </DataBoundary>

      {/* 제시문 삭제 확인 — 하드 삭제라 danger 톤으로 한 번 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="제시문 삭제"
        confirmLabel="삭제"
        tone="danger"
        confirmDisabled={deletePassage.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deletePassage.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success('제시문을 삭제했습니다.')
              setDeleteTarget(null)
            },
            onError: () =>
              toast.danger('제시문 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.'),
          })
        }}
      >
        <p className="text-fg-muted text-sm leading-6">
          “{deleteTarget?.title}” 제시문을 삭제합니다. 삭제하면 복구할 수
          없어요.
        </p>
      </ConfirmDialog>

      {/* 제시문 추가·수정 폼 모달 (Figma 1557:11159) */}
      <PassageFormModal
        open={formOpen}
        passage={formPassage}
        onClose={() => setFormOpen(false)}
        onSubmit={(mode, values) => {
          // 실 API — 신규는 POST, 수정은 PATCH. 미리보기·상태는 서버가 산출해 내려준다.
          upsert.mutate(
            {
              id: formPassage?.id ?? null,
              body: {
                title: values.title,
                content: values.content,
                language: values.language,
                level: values.level,
                order: values.order,
                active: values.active,
              },
            },
            {
              onSuccess: () => {
                toast.success(
                  mode === 'edit'
                    ? '제시문을 수정했습니다.'
                    : '제시문을 추가했습니다.',
                )
                setFormOpen(false)
              },
              onError: () =>
                toast.danger(
                  '제시문 저장에 실패했어요. 잠시 후 다시 시도해 주세요.',
                ),
            },
          )
        }}
      />
    </div>
  )
}
