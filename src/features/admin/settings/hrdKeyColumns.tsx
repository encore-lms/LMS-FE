// HRD API Key 테이블 컬럼 정의(키 목록·이력) — HrdApiKeyPage에서 분리, 핸들러는 옵션으로 주입.
import { ArrowRight } from 'lucide-react'
import { type Column } from '@/components/data/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { HrdApiKey, HrdKeyHistoryRow } from '@/shared/types'
import { ACTION_LABEL, fmtDate, fmtDateTime } from './hrdKeyMeta'

export function buildKeyColumns({
  onTest,
  onToggleActive,
  onDelete,
  isTesting,
  testingId,
  updatePending,
  deletePending,
}: {
  onTest: (k: HrdApiKey) => void
  onToggleActive: (k: HrdApiKey) => void
  onDelete: (k: HrdApiKey) => void
  isTesting: boolean
  testingId: string | null
  updatePending: boolean
  deletePending: boolean
}): Column<HrdApiKey>[] {
  return [
    {
      key: 'name',
      header: '이름',
      cell: (k) => (
        <div>
          <p className="text-fg text-sm font-medium">{k.name}</p>
          {k.description && (
            <p className="text-fg-subtle text-xs">{k.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'masked',
      header: 'Masked Key',
      cell: (k) => (
        <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 font-mono text-xs">
          {k.maskedKey}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: '생성일',
      cell: (k) => (
        <span className="text-fg-muted text-sm">{fmtDate(k.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-20',
      cell: (k) => (
        <StatusBadge
          label={k.active ? '활성' : '비활성'}
          tone={k.active ? 'success' : 'neutral'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (k) => (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onTest(k)}
            disabled={isTesting}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            {testingId === k.id ? '테스트 중…' : '연결 테스트'}
          </button>
          <button
            type="button"
            onClick={() => onToggleActive(k)}
            disabled={updatePending}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            {k.active ? '비활성화' : '활성화'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(k)}
            disabled={deletePending}
            className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      ),
    },
  ]
}

export function buildHistoryColumns({
  onOpenDetail,
}: {
  onOpenDetail: (h: HrdKeyHistoryRow) => void
}): Column<HrdKeyHistoryRow>[] {
  return [
    {
      key: 'at',
      header: '일시',
      className: 'w-28',
      cell: (h) => (
        <span className="text-fg-muted text-sm">{fmtDateTime(h.at)}</span>
      ),
    },
    {
      key: 'action',
      header: '작업',
      className: 'w-28',
      cell: (h) => <StatusBadge label={ACTION_LABEL[h.action]} tone="accent" />,
    },
    {
      key: 'actor',
      header: '담당자',
      className: 'w-24',
      cell: (h) => <span className="text-fg text-sm">{h.actor}</span>,
    },
    {
      key: 'result',
      header: '결과',
      className: 'w-24',
      cell: (h) => (
        <StatusBadge
          label={h.ok ? '성공' : '실패'}
          tone={h.ok ? 'success' : 'danger'}
        />
      ),
    },
    {
      key: 'response',
      header: '응답',
      className: 'w-24',
      cell: (h) => (
        <span className="text-fg-muted text-sm">
          {h.responseMs != null ? `${h.responseMs}ms` : '-'}
        </span>
      ),
    },
    {
      key: 'target',
      header: '대상 키',
      cell: (h) => (
        <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 font-mono text-xs">
          {h.targetKeyMasked}
        </span>
      ),
    },
    {
      key: 'detail',
      header: '',
      align: 'right',
      className: 'w-24',
      cell: (h) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenDetail(h)
          }}
          className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap"
        >
          상세 <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ]
}
