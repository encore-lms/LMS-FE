import { useState } from 'react'
import { AlertTriangle, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useCsvImport } from './api'
import type {
  CsvImportSource,
  CsvMappingAction,
  CsvMappingRow,
  CsvMappingStatus,
  CsvValidationHandling,
  CsvValidationRow,
} from './types'

const SOURCES: { key: CsvImportSource; label: string }[] = [
  { key: 'student-project', label: '학생/프로젝트' },
  { key: 'record', label: '기록실' },
  { key: 'resume', label: '이력서' },
]

const MAPPING_STATUS_META: Record<
  CsvMappingStatus,
  { label: string; tone: BadgeTone }
> = {
  confirmed: { label: '확정', tone: 'success' },
  check: { label: '확인', tone: 'info' },
  candidate: { label: '후보', tone: 'warning' },
  unmapped: { label: '미매핑', tone: 'neutral' },
}

const MAPPING_ACTION_LABEL: Record<CsvMappingAction, string> = {
  pin: '고정',
  edit: '수정',
  review: '검토',
  select: '선택',
}

const HANDLING_META: Record<
  CsvValidationHandling,
  { label: string; tone: BadgeTone }
> = {
  quarantine: { label: '격리', tone: 'warning' },
  fix_needed: { label: '수정 필요', tone: 'danger' },
  pass: { label: '통과', tone: 'success' },
  ops_check: { label: '운영 확인', tone: 'info' },
}

// CSV 매핑·업로드 (/admin/csv-mapping) — 운영(MANAGER/ADMIN) 신규.
// Figma 1521:10678. 원본 CSV/XLSX → 도메인 필드 매핑·검증 후 인입(격리 큐 경유).
// 학생/프로젝트 탭이 정본(Figma 동결). 기록실/이력서는 소스별 mock으로 탭 전환.
// 업로드·검증 실행·매핑 행 액션 흐름은 별도 시안 미설계 → 토스트 안내 + TODO.
export default function CsvMappingPage() {
  usePageHeader('CSV 매핑·업로드', '원본 CSV/XLSX → 도메인 필드 매핑·검증·인입')
  const { data, isPending, isError, refetch } = useCsvImport()
  const toast = useToast()
  const [source, setSource] = useState<CsvImportSource>('student-project')

  if (isPending) {
    return <div className="text-fg-muted p-8">CSV 인입 정보를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="CSV 인입 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const current = data[source]
  const { file, summary, mappings, validations } = current

  const mappingColumns: Column<CsvMappingRow>[] = [
    {
      key: 'source',
      header: '원본 필드',
      cell: (r) => (
        <span className="text-fg font-mono text-[13px] font-semibold">
          {r.sourceField}
        </span>
      ),
    },
    {
      key: 'domain',
      header: '도메인 필드',
      cell: (r) => (
        <span className="text-fg-muted font-mono text-[12px]">
          {r.domainField}
        </span>
      ),
    },
    {
      key: 'confidence',
      header: '신뢰도',
      className: 'w-20',
      cell: (r) => (
        <span className="text-fg text-[13px] tabular-nums">
          {r.confidence}%
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-20',
      cell: (r) => (
        <StatusBadge
          label={MAPPING_STATUS_META[r.status].label}
          tone={MAPPING_STATUS_META[r.status].tone}
        />
      ),
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-16',
      cell: (r) => (
        <button
          type="button"
          // TODO: 매핑 고정/수정/검토/선택 모달(P0_20 BE 계약 확정 후)
          onClick={() =>
            toast.info(
              `${r.sourceField} ${MAPPING_ACTION_LABEL[r.action]}은(는) 준비 중입니다.`,
            )
          }
          className="text-brand text-[13px] font-semibold hover:underline"
        >
          {MAPPING_ACTION_LABEL[r.action]}
        </button>
      ),
    },
  ]

  const validationColumns: Column<CsvValidationRow>[] = [
    {
      key: 'item',
      header: '검증 항목',
      cell: (r) => (
        <span className="text-fg text-[13px] font-semibold">{r.item}</span>
      ),
    },
    {
      key: 'normal',
      header: '정상',
      className: 'w-28',
      cell: (r) => (
        <span className="text-fg text-[13px] tabular-nums">
          {r.normal.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'error',
      header: '오류',
      className: 'w-24',
      cell: (r) => (
        <span
          className={cn(
            'text-[13px] font-semibold tabular-nums',
            r.error > 0 ? 'text-danger' : 'text-fg-subtle',
          )}
        >
          {r.error}
        </span>
      ),
    },
    {
      key: 'handling',
      header: '처리',
      className: 'w-32',
      cell: (r) => (
        <StatusBadge
          label={HANDLING_META[r.handling].label}
          tone={HANDLING_META[r.handling].tone}
        />
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 소스 탭(학생/프로젝트·기록실·이력서) + 우측 액션(검증 실행·업로드 시작) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="border-border bg-surface inline-flex gap-1 rounded-lg border p-1">
          {SOURCES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSource(s.key)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                source === s.key
                  ? 'bg-brand text-on-color'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            // TODO: 검증 실행(매핑 규칙 적용·오류 재집계, P0_20)
            onClick={() => toast.info('검증 실행은 준비 중입니다.')}
            className="bg-accent-bg text-accent-strong hover:bg-accent-bg/70 h-9 rounded-md px-4 text-[13px] font-semibold transition-colors"
          >
            검증 실행
          </button>
          <button
            type="button"
            // TODO: 업로드 시작(정상 행 인입·오류 행 격리 큐 이동, P0_20)
            onClick={() => toast.info('업로드 시작은 준비 중입니다.')}
            className="bg-brand hover:bg-brand/90 text-on-color h-9 rounded-md px-4 text-[13px] font-semibold transition-colors"
          >
            업로드 시작
          </button>
        </div>
      </div>

      {/* KPI 5종 */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="업로드 파일"
          value={summary.uploadFiles}
          hint={summary.uploadFilesHint}
        />
        <KpiCard
          label="매핑 신뢰도"
          value={`${summary.mappingConfidence}%`}
          hint={`미매핑 ${summary.unmappedFields}필드`}
        />
        <KpiCard
          label="검증 오류"
          value={summary.validationErrors}
          hint={`필수값 ${summary.requiredValueErrors}`}
          tone={summary.validationErrors > 0 ? 'danger' : 'default'}
        />
        <KpiCard
          label="격리 후보"
          value={summary.quarantineCandidates}
          hint="인입 큐 이동"
          tone={summary.quarantineCandidates > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          label="처리 예상"
          value={`${summary.estimatedMinutes}m`}
          hint={`${summary.totalRows.toLocaleString()}행`}
        />
      </div>

      {/* 메인 — 파일 업로드 카드(좌) + 매핑 표(우) */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-[360px] lg:shrink-0">
          <div className="border-border bg-surface rounded-xl border p-5">
            <p className="text-fg text-lg font-bold">파일 업로드</p>
            <p className="text-fg mt-4 text-[13px]">{file.fileName}</p>
            <p className="text-fg-muted mt-1.5 text-xs">{file.detail}</p>
            <button
              type="button"
              // TODO: 파일 선택·교체(드래그앤드롭, P0_20)
              onClick={() => toast.info('파일 추가·교체는 준비 중입니다.')}
              className="border-border bg-surface-muted/50 text-fg-muted hover:bg-surface-muted mt-4 flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-[13px] transition-colors"
            >
              <UploadCloud className="text-fg-subtle h-5 w-5" />
              CSV/XLSX 파일을 추가하거나 교체
            </button>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <DataTable
            columns={mappingColumns}
            rows={mappings}
            rowKey={(r) => r.id}
            empty="매핑할 필드가 없어요"
          />
        </div>
      </div>

      {/* 인입 결과 처리 원칙 — 안내 콜아웃 */}
      <div className="border-info/30 bg-info-bg/50 mt-6 rounded-xl border p-5">
        <p className="text-info text-base font-bold">인입 결과 처리 원칙</p>
        <p className="text-info/90 mt-2 text-[13px] leading-relaxed">
          검증 오류가 있는 행은 바로 반영하지 않고 인입 격리 큐로 이동합니다.
          확정 매핑은 DataMappingRule로 저장되어 다음 업로드에 재사용됩니다.
        </p>
      </div>

      {/* 검증 항목 표 */}
      <div className="mt-6">
        <DataTable
          columns={validationColumns}
          rows={validations}
          rowKey={(r) => r.id}
          empty="검증 항목이 없어요"
        />
      </div>
    </div>
  )
}
