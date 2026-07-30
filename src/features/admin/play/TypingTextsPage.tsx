import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Select } from '@/components/ui/Select'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePlayTypingTexts, useUpsertPassage } from './api'
import { PassageFormModal } from './PassageFormModal'
import { downloadTypingSampleCsv } from './sampleCsv'
import type { PassageStatus, TypingPassage, UploadValidationRow } from './types'
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
  const { summary, uploadValidation, uploadErrorRows } = data ?? {
    summary: { active: 0, inactive: 0, error: 0, disabledCourses: 0 },
    uploadValidation: [],
    uploadErrorRows: 0,
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
      className: 'w-24',
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
            // TODO: 제시문 복제(P0_15)
            onClick={() => toast.info(`${p.title} 복제는 준비 중입니다.`)}
            className="text-accent-strong text-[12px] font-semibold hover:underline"
          >
            복제
          </button>
        </div>
      ),
    },
  ]

  const uploadColumns: Column<UploadValidationRow>[] = [
    {
      key: 'rowNo',
      header: '행',
      className: 'w-14',
      cell: (r) => (
        <span className="text-fg text-[12px] tabular-nums">{r.rowNo}</span>
      ),
    },
    {
      key: 'title',
      header: 'title',
      cell: (r) => (
        <span
          className={cn(
            'text-[12px]',
            r.titleError ? 'text-danger' : 'text-fg',
          )}
        >
          {r.title}
        </span>
      ),
    },
    {
      key: 'content',
      header: 'content',
      cell: (r) => (
        <span
          className={cn(
            'text-[12px]',
            r.contentError ? 'text-danger' : 'text-fg',
          )}
        >
          {r.content}
        </span>
      ),
    },
    {
      key: 'language',
      header: 'language',
      className: 'w-24',
      cell: (r) => <span className="text-fg text-[12px]">{r.language}</span>,
    },
    {
      key: 'level',
      header: 'level',
      className: 'w-20',
      cell: (r) => <span className="text-fg text-[12px]">{r.level}</span>,
    },
    {
      key: 'result',
      header: '검증 결과',
      className: 'w-28',
      cell: (r) => (
        <span
          className={cn(
            'text-[12px] font-semibold',
            r.ok ? 'text-success' : 'text-danger',
          )}
        >
          {r.result}
        </span>
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
          // CSV/Excel 일괄 업로드 — BE 미구현(404)이라 '(준비 중)' 표기 유지, 내부 확인용 이동은 허용.
          onClick={() => navigate('/admin/play/typing-texts/bulk')}
          className="bg-brand hover:bg-brand/90 text-on-color h-9 rounded-lg px-4 text-[13px] font-semibold transition-colors"
        >
          일괄 업로드 (준비 중)
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

        {/* 일괄 업로드 검증 */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="border-border bg-surface min-w-0 flex-1 rounded-xl border p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-fg text-base font-bold">일괄 업로드 검증</p>
                <p className="text-fg-muted mt-1 text-xs">
                  CSV/Excel 업로드 후 필수 열, 중복 제목, 빈 내용, 잘못된
                  난이도를 저장 전에 검증합니다.
                </p>
              </div>
              <StatusBadge label={`오류 ${uploadErrorRows}행`} tone="danger" />
            </div>
            <div className="mt-4">
              <DataTable
                columns={uploadColumns}
                rows={uploadValidation}
                rowKey={(r) => r.id}
                empty="검증할 행이 없어요"
              />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                // TODO: 오류 행만 CSV로 추출(P0_15)
                onClick={() => toast.info('오류 행 내려받기는 준비 중입니다.')}
                className="border-border bg-surface text-fg hover:bg-surface-muted h-9 rounded-lg border px-4 text-[13px] font-semibold transition-colors"
              >
                오류 행 내려받기
              </button>
              <button
                type="button"
                // TODO: 정상 행만 저장(오류 행 제외 인입, P0_15)
                onClick={() => toast.info('정상 행만 저장은 준비 중입니다.')}
                className="bg-brand hover:bg-brand/90 text-on-color h-9 rounded-lg px-4 text-[13px] font-semibold transition-colors"
              >
                정상 행만 저장
              </button>
            </div>
          </div>
        </div>
      </DataBoundary>

      {/* 제시문 추가·수정 폼 모달 (Figma 1557:11159) */}
      <PassageFormModal
        open={formOpen}
        passage={formPassage}
        onClose={() => setFormOpen(false)}
        onSubmit={(mode, values) => {
          const status: PassageStatus = values.active ? 'active' : 'inactive'
          const next: TypingPassage = {
            id: formPassage?.id ?? crypto.randomUUID(),
            title: values.title,
            previewNote: values.content
              ? values.content.replace(/\s+/g, ' ').slice(0, 80)
              : (formPassage?.previewNote ?? ''),
            language: values.language,
            level: values.level,
            order: values.order,
            status,
          }
          upsert.mutate(next, {
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
          })
        }}
      />
    </div>
  )
}
