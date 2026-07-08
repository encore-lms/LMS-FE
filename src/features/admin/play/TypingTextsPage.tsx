import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
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
    '과정별 PLAY 제시문 등록 · 노출 상태 · 업로드 오류 관리',
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

  if (isPending) {
    return <SkeletonListPage columns={4} />
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="PLAY 제시문을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { summary, uploadValidation, uploadErrorRows } = data

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
          // CSV/Excel 일괄 업로드 — 검증 미리보기 화면으로 이동
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

      {/* 노출 조건 배너 */}
      <div className="border-warning/30 bg-warning-bg/50 mt-4 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-warning text-sm font-bold">
            노출 조건: CourseFeatureConfig.playEnabled = true
          </p>
          <p className="text-warning/90 mt-1 text-xs leading-relaxed">
            PLAY 기능이 꺼진 과정은 운영 메뉴와 수강생 PLAY 화면 모두
            숨겨집니다. 기능을 켜기 전에는 제시문을 등록해도 수강생에게 노출되지
            않습니다.
          </p>
        </div>
        <StatusBadge
          label={`비활성 과정 ${summary.disabledCourses}개`}
          tone="warning"
        />
      </div>

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
            <div className="border-warning/30 bg-warning-bg/50 mt-4 rounded-lg border p-3.5">
              <p className="text-warning text-sm font-bold">
                활성 변경 확인 필요
              </p>
              <p className="text-warning/90 mt-1 text-xs leading-relaxed">
                진행 중 세션에는 기존 제시문을 유지하고, 새 세션부터 변경된 활성
                상태를 적용합니다.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* 명세 경계(좌) + 일괄 업로드 검증(우) */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="border-border bg-info-bg/40 w-full rounded-xl border p-5 lg:w-[220px] lg:shrink-0">
          <p className="text-fg text-[13px] font-bold">명세 경계</p>
          <p className="text-fg-muted mt-2 text-xs leading-relaxed">
            운영 화면은 콘텐츠 관리만 담당합니다. 수강생 세션 진행과 결과 제출은
            P0_14 범위입니다.
          </p>
        </aside>

        <div className="border-border bg-surface min-w-0 flex-1 rounded-xl border p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-fg text-base font-bold">일괄 업로드 검증</p>
              <p className="text-fg-muted mt-1 text-xs">
                CSV/Excel 업로드 후 필수 열, 중복 제목, 빈 내용, 잘못된 난이도를
                저장 전에 검증합니다.
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
