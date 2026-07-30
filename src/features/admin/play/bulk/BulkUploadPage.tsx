import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, UploadCloud } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { downloadTypingSampleCsv } from '../sampleCsv'
import { usePlayTypingTexts } from '../api'
import { useBulkCreatePassages } from './api'
import { parseTypingCsv, type ParsedCsv, type ParsedCsvRow } from './csv'

// 검증 항목 집계 행 — 파싱 결과에서 파생(서버 미리보기였던 시절의 표 구조 유지).
interface CheckRow {
  id: string
  item: string
  normal: number
  error: number
}

// 필드 표 한 행 — 필수 열 존재 여부 + 첫 정상 샘플.
interface FieldRow {
  id: string
  field: string
  present: boolean
  sample: string
}

const REQUIRED_FIELDS = [
  'language',
  'level',
  'title',
  'content',
  'sortOrder',
] as const

// 타자 제시문 일괄 업로드 (/admin/play/typing-texts/bulk) — 운영(MANAGER/ADMIN).
// CSV를 클라이언트에서 파싱·1차 검증해 미리보기를 만들고, 정상 행만 서버에 일괄 등록한다.
// 예전에는 서버 미리보기(mock GET) 기반이라 업로드·저장이 전부 '준비 중'이었다.
export default function BulkUploadPage() {
  usePageHeader(
    '타자 제시문 일괄 업로드',
    'CSV 파일로 제시문을 한 번에 등록합니다',
  )
  const toast = useToast()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const bulkCreate = useBulkCreatePassages()
  // 중복 후보 — 기존 목록 제목과 비교(등록은 막지 않고 카운트만).
  const { data: overviewData } = usePlayTypingTexts()

  const rows = useMemo(() => parsed?.rows ?? [], [parsed])
  const normalRows = useMemo(
    () => rows.filter((r) => r.errors.length === 0),
    [rows],
  )
  const errorRows = rows.length - normalRows.length
  const dupCandidates = useMemo(() => {
    const existing = new Set(
      (overviewData?.passages ?? []).map((p) => p.title.trim()),
    )
    return normalRows.filter((r) => existing.has(r.title)).length
  }, [normalRows, overviewData])

  // File.text()는 일부 환경(jsdom 등)에 없어 FileReader로 읽는다.
  const readFileText = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    if (!/\.csv$/i.test(file.name)) {
      toast.danger(
        'CSV 파일만 업로드할 수 있어요. (엑셀은 CSV로 저장 후 업로드)',
      )
      return
    }
    const text = await readFileText(file)
    const result = parseTypingCsv(text)
    setFileName(file.name)
    setParsed(result)
    if (result.headerError) {
      toast.danger(result.headerError)
    } else {
      const normal = result.rows.filter((r) => r.errors.length === 0).length
      toast.success(
        `검증 완료 — 정상 ${normal}행 · 오류 ${result.rows.length - normal}행`,
      )
    }
  }

  const submit = () => {
    if (normalRows.length === 0 || bulkCreate.isPending) return
    bulkCreate.mutate(
      normalRows.map((r) => ({
        title: r.title,
        content: r.content,
        language: r.language,
        level: r.level,
        order: r.order,
        active: true,
      })),
      {
        onSuccess: (result) => {
          toast.success(`제시문 ${result.created}건을 등록했습니다.`)
          navigate('/admin/play/typing-texts')
        },
        onError: () =>
          toast.danger('등록에 실패했어요. 잠시 후 다시 시도해 주세요.'),
      },
    )
  }

  // 필드 표 — 필수 열 존재 여부 + 첫 정상 샘플 값.
  const fieldRows: FieldRow[] = REQUIRED_FIELDS.map((field) => {
    const present = parsed
      ? parsed.headers.includes(field.toLowerCase())
      : false
    const sampleRow = normalRows[0]
    const sample = sampleRow
      ? field === 'sortOrder'
        ? String(sampleRow.order)
        : String(sampleRow[field as 'title' | 'content' | 'language' | 'level'])
      : '-'
    return { id: field, field, present, sample }
  })

  // 검증 항목 집계 — 행 오류 사유별 카운트.
  const checkRows: CheckRow[] = useMemo(() => {
    const count = (pred: (r: ParsedCsvRow) => boolean) =>
      rows.filter(pred).length
    return [
      {
        id: 'required',
        item: '필수값·길이(title·content)',
        error: count((r) =>
          r.errors.some((e) => e.includes('필수') || e.includes('초과')),
        ),
      },
      {
        id: 'language',
        item: '언어 라벨(Python·한글·영문)',
        error: count((r) => r.errors.some((e) => e.startsWith('language'))),
      },
      {
        id: 'level',
        item: '난이도 라벨(쉬움·보통·어려움)',
        error: count((r) => r.errors.some((e) => e.startsWith('level'))),
      },
      {
        id: 'order',
        item: '정렬 순서(정수)',
        error: count((r) => r.errors.some((e) => e.startsWith('sortOrder'))),
      },
    ].map((c) => ({ ...c, normal: rows.length - c.error }))
  }, [rows])

  const fieldColumns: Column<FieldRow>[] = [
    {
      key: 'field',
      header: '필드',
      cell: (r) => (
        <span className="text-fg font-mono text-[13px] font-semibold">
          {r.field}
        </span>
      ),
    },
    {
      key: 'sample',
      header: '샘플 값',
      cell: (r) => (
        <span className="text-fg-muted block max-w-[420px] truncate text-[13px]">
          {r.sample}
        </span>
      ),
    },
    {
      key: 'validation',
      header: '검증',
      className: 'w-24',
      cell: (r) =>
        parsed ? (
          <StatusBadge
            label={r.present ? '정상' : '열 누락'}
            tone={r.present ? 'success' : 'danger'}
          />
        ) : (
          <span className="text-fg-subtle text-[12px]">대기</span>
        ),
    },
  ]

  const checkColumns: Column<CheckRow>[] = [
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
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={r.error > 0 ? '수정 필요' : '통과'}
          tone={r.error > 0 ? 'danger' : 'success'}
        />
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 브레드크럼 */}
      <Link
        to="/admin/play/typing-texts"
        className="text-fg-muted hover:text-fg inline-flex items-center gap-1 text-[13px]"
      >
        <ChevronLeft className="h-4 w-4" />
        PLAY 타자 관리
        <span className="text-fg-subtle">› 일괄 업로드</span>
      </Link>

      {/* 액션 툴바 */}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
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
          disabled={normalRows.length === 0 || bulkCreate.isPending}
          onClick={submit}
          className="bg-brand hover:bg-brand/90 text-on-color h-9 rounded-lg px-4 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {bulkCreate.isPending
            ? '등록 중…'
            : `정상 행 ${normalRows.length}건 등록`}
        </button>
      </div>

      {/* 검증 결과 배너 */}
      {parsed && !parsed.headerError && (
        <div className="border-success/30 bg-success-bg mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border p-4">
          <p className="text-success inline-flex items-center gap-1.5 text-sm font-bold">
            <CheckCircle2 className="h-4 w-4" />
            검증 완료
          </p>
          <p className="text-success/90 text-[13px]">
            정상 {normalRows.length.toLocaleString()}행 · 오류 {errorRows}행 ·
            중복 후보 {dupCandidates}건 · 예상 반영{' '}
            {normalRows.length.toLocaleString()}행
          </p>
        </div>
      )}
      {parsed?.headerError && (
        <div className="border-danger/30 bg-danger-bg mt-4 rounded-xl border p-4">
          <p className="text-danger text-sm font-bold">{parsed.headerError}</p>
        </div>
      )}

      {/* KPI 5종 */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="업로드 파일"
          value={fileName ? 1 : 0}
          hint={fileName || 'CSV 대기'}
        />
        <KpiCard
          label="정상 행"
          value={normalRows.length}
          hint="등록 가능"
          tone="success"
        />
        <KpiCard
          label="오류 행"
          value={errorRows}
          hint={errorRows > 0 ? '등록 제외' : '없음'}
          tone={errorRows > 0 ? 'danger' : 'default'}
        />
        <KpiCard
          label="중복 후보"
          value={dupCandidates}
          hint="기존 제목과 동일"
          tone={dupCandidates > 0 ? 'warning' : 'default'}
        />
        <KpiCard label="예상 반영" value={normalRows.length} hint="활성 등록" />
      </div>

      {/* 메인 — 파일 업로드 카드(좌) + 필드 표(우) */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-[360px] lg:shrink-0">
          <div className="border-border bg-surface rounded-xl border p-5">
            <p className="text-fg text-lg font-bold">파일 업로드</p>
            <p className="text-fg mt-4 text-[13px]">
              {fileName || '선택된 파일 없음'}
            </p>
            <p className="text-fg-muted mt-1.5 text-xs">
              UTF-8 · 콤마 구분 · 헤더 포함 CSV
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              aria-label="CSV 파일 선택"
              className="hidden"
              onChange={(e) => {
                void onPickFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="border-border bg-surface-muted/50 text-fg-muted hover:bg-surface-muted mt-4 flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-[13px] transition-colors"
            >
              <UploadCloud className="text-fg-subtle h-5 w-5" />
              CSV 파일을 선택하거나 교체
            </button>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <DataTable
            columns={fieldColumns}
            rows={fieldRows}
            rowKey={(r) => r.id}
            empty="검증할 필드가 없어요"
          />
        </div>
      </div>

      {/* 오류 행 상세 — 어떤 행이 왜 제외되는지 즉시 보이게 */}
      {errorRows > 0 && (
        <div className="border-danger/30 bg-surface mt-6 rounded-xl border p-5">
          <p className="text-danger text-sm font-bold">
            오류 행 {errorRows}건 — 등록에서 제외됩니다
          </p>
          <ul className="text-fg-muted mt-2 flex flex-col gap-1 text-[13px]">
            {rows
              .filter((r) => r.errors.length > 0)
              .slice(0, 10)
              .map((r) => (
                <li key={r.rowNo}>
                  {r.rowNo}행 · {r.title || '(제목 없음)'} —{' '}
                  {r.errors.join(' · ')}
                </li>
              ))}
            {errorRows > 10 && (
              <li className="text-fg-subtle">… 외 {errorRows - 10}건</li>
            )}
          </ul>
        </div>
      )}

      {/* 일괄 업로드 처리 기준 — 안내 콜아웃 */}
      <div className="border-info/30 bg-info-bg/50 mt-6 rounded-xl border p-5">
        <p className="text-info text-base font-bold">일괄 업로드 처리 기준</p>
        <p className="text-info/90 mt-2 text-[13px] leading-relaxed">
          필수 열은 language, level, title, content, sortOrder입니다. 오류 행은
          등록하지 않고 제외하며, 기존 제시문과 제목이 같은 행은 중복 후보로
          표시됩니다(등록은 허용). 등록된 행은 모두 활성 상태로 시작합니다.
        </p>
      </div>

      {/* 검증 항목 표 */}
      <div className="mt-6">
        <DataTable
          columns={checkColumns}
          rows={checkRows}
          rowKey={(r) => r.id}
          empty="파일을 선택하면 검증 결과가 표시돼요"
        />
      </div>
    </div>
  )
}
