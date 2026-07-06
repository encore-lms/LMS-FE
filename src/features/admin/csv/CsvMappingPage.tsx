import { useRef, useState } from 'react'
import { AlertTriangle, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import {
  useCsvImport,
  useCsvIngestDatasets,
  useCsvIngestRollback,
  useCsvIngestUpload,
  useCsvIngestUploads,
} from './api'
import type {
  CsvImportSource,
  CsvIngestDataset,
  CsvIngestUploadResult,
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

// CSV 매핑·업로드 (/admin/csv-mapping) — 운영(MANAGER/ADMIN).
// Figma 1521:10678. 원본 CSV → 검증 후 staging 인입(오류 행은 격리 큐 경유).
// 파일 선택·업로드는 operations-service /admin/csv-ingest 실연동(P0_20 업로드 구간).
// KPI·매핑 표·검증 표는 소스별 mock 유지(매핑 규칙 UI는 BE 계약 미확정 → 토스트 + TODO).
export default function CsvMappingPage() {
  usePageHeader('CSV 매핑·업로드', '원본 CSV/XLSX → 도메인 필드 매핑·검증·인입')
  const { data, isPending, isError, refetch } = useCsvImport()
  const { data: ingestDatasets } = useCsvIngestDatasets()
  const { data: ingestUploads } = useCsvIngestUploads()
  const uploadMutation = useCsvIngestUpload()
  const rollbackMutation = useCsvIngestRollback()
  const toast = useToast()
  const [source, setSource] = useState<CsvImportSource>('student-project')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detectedDataset, setDetectedDataset] =
    useState<CsvIngestDataset | null>(null)
  const [lastResult, setLastResult] = useState<CsvIngestUploadResult | null>(
    null,
  )

  // CSV 헤더를 읽어 어떤 인입 데이터셋인지 자동 감지한다(필수 컬럼 포함 + 일치 컬럼 최다 우선).
  const handleFileSelected = async (file: File) => {
    const text = await file.text()
    const firstLine = text.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] ?? ''
    const headers = firstLine
      .split(',')
      .map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())
    const match =
      (ingestDatasets ?? [])
        .filter((d) => d.requiredColumns.every((c) => headers.includes(c)))
        .sort(
          (a, b) =>
            b.columns.filter((c) => headers.includes(c)).length -
            a.columns.filter((c) => headers.includes(c)).length,
        )[0] ?? null
    setSelectedFile(file)
    setDetectedDataset(match)
    setLastResult(null)
    if (match) {
      toast.info(`'${match.label}' 데이터셋으로 인식했어요.`)
    } else {
      toast.danger('CSV 헤더가 어떤 인입 데이터셋과도 일치하지 않아요.')
    }
  }

  const handleUpload = () => {
    if (!selectedFile) {
      toast.info('업로드할 CSV 파일을 먼저 선택해 주세요.')
      return
    }
    if (!detectedDataset) {
      toast.danger('데이터셋을 인식하지 못한 파일이에요. 헤더를 확인해 주세요.')
      return
    }
    uploadMutation.mutate(
      { dataset: detectedDataset.key, file: selectedFile, mode: 'replace' },
      {
        onSuccess: (result) => {
          setLastResult(result)
          toast.success(
            `${result.insertedRows.toLocaleString()}행 반영 · ${result.quarantinedRows.toLocaleString()}행 격리`,
          )
        },
        onError: () =>
          toast.danger('업로드에 실패했어요. 잠시 후 다시 시도해 주세요.'),
      },
    )
  }

  // 업로드 롤백 — 해당 업로드가 반영한 행을 staging에서 제거한다(격리 행 포함).
  const handleRollback = (uploadId: number, fileName: string) => {
    if (!window.confirm(`'${fileName}' 업로드로 반영된 데이터를 제거할까요?`)) {
      return
    }
    rollbackMutation.mutate(uploadId, {
      onSuccess: (result) => {
        toast.success(
          `롤백 완료 — ${result.removedRows.toLocaleString()}행 제거`,
        )
      },
      onError: () =>
        toast.danger('롤백에 실패했어요. 잠시 후 다시 시도해 주세요.'),
    })
  }

  if (isPending) {
    return <SkeletonListPage kpis={5} columns={5} />
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
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="bg-brand hover:bg-brand/90 text-on-color h-9 rounded-md px-4 text-[13px] font-semibold transition-colors disabled:opacity-50"
          >
            {uploadMutation.isPending ? '업로드 중…' : '업로드 시작'}
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
            <p className="text-fg mt-4 text-[13px]">
              {selectedFile ? selectedFile.name : file.fileName}
            </p>
            <p className="text-fg-muted mt-1.5 text-xs">
              {selectedFile
                ? detectedDataset
                  ? `데이터셋: ${detectedDataset.label} · staging ${detectedDataset.rowCount.toLocaleString()}행 보유`
                  : '데이터셋 미인식 — 헤더를 확인해 주세요'
                : file.detail}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              data-testid="csv-file-input"
              onChange={(e) => {
                const picked = e.target.files?.[0]
                if (picked) void handleFileSelected(picked)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-border bg-surface-muted/50 text-fg-muted hover:bg-surface-muted mt-4 flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-[13px] transition-colors"
            >
              <UploadCloud className="text-fg-subtle h-5 w-5" />
              CSV 파일을 추가하거나 교체
            </button>
            {lastResult && (
              <div className="border-border bg-surface-muted/40 mt-4 rounded-lg border p-3">
                <p className="text-fg text-[13px] font-semibold">
                  업로드 결과 — {lastResult.dataset}
                </p>
                <p className="text-fg-muted mt-1 text-xs">
                  전체 {lastResult.totalRows.toLocaleString()}행 · 반영{' '}
                  {lastResult.insertedRows.toLocaleString()}행 · 격리{' '}
                  {lastResult.quarantinedRows.toLocaleString()}행
                </p>
                {lastResult.quarantinePreview.length > 0 && (
                  <ul className="text-danger mt-2 space-y-1 text-xs">
                    {lastResult.quarantinePreview.slice(0, 5).map((q) => (
                      <li key={q.rowNo}>
                        {q.rowNo}행: {q.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* 최근 업로드 이력 — 업로드 단위 롤백(반영 행 제거) */}
          {(ingestUploads?.length ?? 0) > 0 && (
            <div className="border-border bg-surface mt-4 rounded-xl border p-5">
              <p className="text-fg text-lg font-bold">최근 업로드</p>
              <ul className="mt-3 space-y-2.5">
                {(ingestUploads ?? []).map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-fg truncate text-[13px] font-semibold">
                        {u.fileName}
                      </p>
                      <p className="text-fg-muted mt-0.5 text-xs">
                        {u.dataset} · 반영 {u.insertedRows.toLocaleString()}행
                        {u.quarantinedRows > 0 &&
                          ` · 격리 ${u.quarantinedRows.toLocaleString()}행`}
                      </p>
                    </div>
                    {u.status === 'rolled_back' ? (
                      <StatusBadge label="롤백됨" tone="neutral" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRollback(u.id, u.fileName)}
                        disabled={rollbackMutation.isPending}
                        className="text-danger shrink-0 text-[13px] font-semibold hover:underline disabled:opacity-50"
                      >
                        롤백
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
