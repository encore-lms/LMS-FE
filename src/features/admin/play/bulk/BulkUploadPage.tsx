import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  UploadCloud,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { downloadTypingSampleCsv } from '../sampleCsv'
import { usePlayBulkPreview } from './api'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import type {
  BulkFieldRow,
  BulkValidationRow,
  FieldAction,
  FieldValidation,
  ValidationHandling,
} from './types'

const VALIDATION_META: Record<
  FieldValidation,
  { label: string; tone: BadgeTone }
> = {
  normal: { label: '정상', tone: 'success' },
  length_check: { label: '길이 확인', tone: 'warning' },
  dup_candidate: { label: '중복 후보', tone: 'danger' },
}

const ACTION_LABEL: Record<FieldAction, string> = {
  pin: '고정',
  review: '검토',
  edit: '수정',
}

const HANDLING_META: Record<
  ValidationHandling,
  { label: string; tone: BadgeTone }
> = {
  pass: { label: '통과', tone: 'success' },
  fix_needed: { label: '수정 필요', tone: 'danger' },
  ops_check: { label: '운영 확인', tone: 'info' },
  map_needed: { label: '매핑 필요', tone: 'danger' },
}

// 타자 제시문 일괄 업로드 (/admin/play/typing-texts/bulk) — 운영(MANAGER/ADMIN) 신규.
// Figma 1546:11329. CSV/XLSX 업로드 → 필수 열·본문 길이·제목 중복·난이도 검증 후 등록.
// PLAY 타자 관리 '일괄 업로드' 버튼에서 진입. 업로드·검증 실행은 토스트 + TODO(P0_15).
export default function BulkUploadPage() {
  usePageHeader(
    '타자 제시문 일괄 업로드',
    'CSV/XLSX 업로드 → 필수 열·본문 길이·제목 중복·난이도 검증',
  )
  const { data, isPending, isError, refetch } = usePlayBulkPreview()
  const toast = useToast()
  // 검증 실행 상태 전이 — 실행 후 결과 배너 노출(매핑 규칙 적용·오류 재집계는 BE TODO).
  const [validated, setValidated] = useState(false)

  if (isPending) {
    return <SkeletonListPage columns={4} />
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="업로드 미리보기를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { file, summary, fields, validations } = data

  const fieldColumns: Column<BulkFieldRow>[] = [
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
        <span className="text-fg-muted text-[13px]">{r.sample}</span>
      ),
    },
    {
      key: 'validation',
      header: '검증',
      className: 'w-24',
      cell: (r) => (
        <StatusBadge
          label={VALIDATION_META[r.validation].label}
          tone={VALIDATION_META[r.validation].tone}
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
          // TODO: 필드 고정/검토/수정(P0_15)
          onClick={() =>
            toast.info(
              `${r.field} ${ACTION_LABEL[r.action]}은(는) 준비 중입니다.`,
            )
          }
          className="text-brand text-[13px] font-semibold hover:underline"
        >
          {ACTION_LABEL[r.action]}
        </button>
      ),
    },
  ]

  const validationColumns: Column<BulkValidationRow>[] = [
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
          label={HANDLING_META[r.handling].label}
          tone={HANDLING_META[r.handling].tone}
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
          // TODO: 검증 실행 mutation(매핑 규칙 적용·오류 재집계, P0_15) — 현재는 mock 결과 재노출
          onClick={() => {
            setValidated(true)
            toast.success(
              `검증 완료 — 정상 ${summary.normalRows.toLocaleString()}행 · 오류 ${summary.errorRows}행`,
            )
          }}
          className="bg-brand hover:bg-brand/90 text-on-color h-9 rounded-lg px-4 text-[13px] font-semibold transition-colors"
        >
          {validated ? '재검증' : '검증 실행'}
        </button>
      </div>

      {/* 검증 결과 배너 (Figma 검증 결과 1557:11207) */}
      {validated && (
        <div className="border-success/30 bg-success-bg mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border p-4">
          <p className="text-success inline-flex items-center gap-1.5 text-sm font-bold">
            <CheckCircle2 className="h-4 w-4" />
            검증 완료
          </p>
          <p className="text-success/90 text-[13px]">
            정상 {summary.normalRows.toLocaleString()}행 · 오류{' '}
            {summary.errorRows}행 · 중복 후보 {summary.dupCandidates}건 · 예상
            반영 {summary.estimated.toLocaleString()}행
          </p>
        </div>
      )}

      {/* KPI 5종 */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="업로드 파일"
          value={summary.uploadFiles}
          hint={summary.uploadFilesHint}
        />
        <KpiCard
          label="정상 행"
          value={summary.normalRows}
          hint={summary.normalHint}
          tone="success"
        />
        <KpiCard
          label="오류 행"
          value={summary.errorRows}
          hint={summary.errorHint}
          tone={summary.errorRows > 0 ? 'danger' : 'default'}
        />
        <KpiCard
          label="중복 후보"
          value={summary.dupCandidates}
          hint={summary.dupHint}
          tone={summary.dupCandidates > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          label="예상 반영"
          value={summary.estimated}
          hint={summary.estimatedHint}
        />
      </div>

      {/* 메인 — 파일 업로드 카드(좌) + 필드 표(우) */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-[360px] lg:shrink-0">
          <div className="border-border bg-surface rounded-xl border p-5">
            <p className="text-fg text-lg font-bold">파일 업로드</p>
            <p className="text-fg mt-4 text-[13px]">{file.fileName}</p>
            <p className="text-fg-muted mt-1.5 text-xs">{file.detail}</p>
            <button
              type="button"
              // TODO: 파일 선택·교체(드래그앤드롭, P0_15)
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
            columns={fieldColumns}
            rows={fields}
            rowKey={(r) => r.id}
            empty="검증할 필드가 없어요"
          />
        </div>
      </div>

      {/* 일괄 업로드 처리 기준 — 안내 콜아웃 */}
      <div className="border-info/30 bg-info-bg/50 mt-6 rounded-xl border p-5">
        <p className="text-info text-base font-bold">일괄 업로드 처리 기준</p>
        <p className="text-info/90 mt-2 text-[13px] leading-relaxed">
          필수 열은 language, level, title, content, sortOrder입니다. 오류 행은
          등록하지 않고 미리보기에서 제외하며, 중복 후보는 기존 GameContent와
          비교해 운영자가 덮어쓰기 여부를 결정합니다.
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
