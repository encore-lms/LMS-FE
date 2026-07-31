import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { inputClass } from '@/components/ui/inputClass'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import {
  useAddMetric,
  useEditMetric,
  useDeleteMetric,
  wsWriteError,
} from '../../../api/projects'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { WorkspaceData } from '../../types'
import { SectionHead } from '../components/ws-shared'
import { card } from '../components/ws-style'

export function OutcomesTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const metrics = d.metrics
  const [adding, setAdding] = useState(false)
  const addMetricM = useAddMetric(d.id)
  const editMetricM = useEditMetric(d.id)
  const deleteMetricM = useDeleteMetric(d.id)
  type Metric = WorkspaceData['metrics'][number]
  const [editing, setEditing] = useState<Metric | null>(null)
  const [deleting, setDeleting] = useState<Metric | null>(null)
  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="성과 지표"
        action="지표 추가"
        onAction={() => setAdding(true)}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {metrics.map((m) => (
          <section
            key={m.id ?? m.label}
            className={cn(card, 'group flex flex-col gap-3')}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-fg text-[14px] font-bold">{m.label}</span>
              {m.id && (
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    aria-label={`${m.label} 수정`}
                    onClick={() => setEditing(m)}
                    className="text-fg-subtle hover:text-fg hover:bg-surface-muted rounded px-1.5 py-0.5 text-[11px] font-semibold"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    aria-label={`${m.label} 삭제`}
                    onClick={() => setDeleting(m)}
                    className="text-danger hover:bg-danger-bg rounded px-1.5 py-0.5 text-[11px] font-semibold"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-end gap-6">
              <div className="flex flex-col">
                <span className="text-fg-subtle text-[11px]">Before</span>
                <span className="text-fg-muted text-[20px] font-bold">
                  {m.before}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-fg-subtle text-[11px]">After</span>
                <span className="text-brand text-[20px] font-bold">
                  {m.after}
                </span>
              </div>
            </div>
            <span
              className={cn(
                'w-fit rounded px-1.5 py-0.5 text-[11px] font-bold',
                m.good
                  ? 'bg-success-bg text-success'
                  : 'bg-danger-bg text-danger',
              )}
            >
              {m.delta}
            </span>
          </section>
        ))}
      </div>
      {editing && (
        <AddMetricModal
          editing={editing}
          onClose={() => setEditing(null)}
          onAdd={(metric) => {
            editMetricM.mutate(
              {
                metricId: editing.id!,
                label: metric.label,
                beforeValue: metric.before,
                afterValue: metric.after,
                changeLabel: metric.delta,
                changeDirection: metric.good ? 'IMPROVED' : 'DEGRADED',
              },
              {
                onSuccess: () => {
                  toast.success('지표를 수정했습니다')
                  setEditing(null)
                },
                onError: (e) =>
                  toast.danger(wsWriteError(e, '지표 수정에 실패했어요.')),
              },
            )
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        title="지표 삭제"
        confirmLabel="삭제"
        tone="danger"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting?.id) return
          deleteMetricM.mutate(
            { metricId: deleting.id },
            {
              onSuccess: () => {
                toast.success('지표를 삭제했습니다')
                setDeleting(null)
              },
              onError: (e) =>
                toast.danger(wsWriteError(e, '지표 삭제에 실패했어요.')),
            },
          )
        }}
      >
        <p className="text-fg-muted text-[13px]">
          '{deleting?.label ?? ''}' 지표를 삭제할까요? 되돌릴 수 없어요.
        </p>
      </ConfirmDialog>
      {adding && (
        <AddMetricModal
          onClose={() => setAdding(false)}
          onAdd={(metric) => {
            addMetricM.mutate(
              {
                label: metric.label,
                beforeValue: metric.before,
                afterValue: metric.after,
                changeLabel: metric.delta,
                changeDirection: metric.good ? 'IMPROVED' : 'DEGRADED',
              },
              {
                onSuccess: () => {
                  toast.success('지표를 추가했습니다')
                  setAdding(false)
                },
                onError: (e) =>
                  toast.danger(wsWriteError(e, '지표 추가에 실패했어요.')),
              },
            )
          }}
        />
      )}
    </div>
  )
}

function AddMetricModal({
  editing,
  onClose,
  onAdd,
}: {
  /** 주면 수정 모드 — 기존 값으로 채워 시작한다. */
  editing?: WorkspaceData['metrics'][number]
  onClose: () => void
  onAdd: (metric: WorkspaceData['metrics'][number]) => void
}) {
  const [label, setLabel] = useState(editing?.label ?? '')
  const [before, setBefore] = useState(editing?.before ?? '')
  const [after, setAfter] = useState(editing?.after ?? '')
  const [delta, setDelta] = useState(editing?.delta ?? '')
  const field = inputClass()
  const submit = () => {
    if (!label.trim() || !before.trim() || !after.trim() || !delta.trim())
      return
    onAdd({
      label: label.trim(),
      before: before.trim(),
      after: after.trim(),
      delta: delta.trim(),
      good: !delta.trim().startsWith('-'),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? '지표 수정' : '지표 추가'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={
              !label.trim() || !before.trim() || !after.trim() || !delta.trim()
            }
            className={buttonClass({ size: 'sm' })}
          >
            추가
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-fg text-[12px] font-bold">지표명</span>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="지표명"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">Before</span>
          <input
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            placeholder="Before"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">After</span>
          <input
            value={after}
            onChange={(e) => setAfter(e.target.value)}
            placeholder="After"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-fg text-[12px] font-bold">증감</span>
          <input
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="+12%"
            className={field}
          />
        </label>
      </div>
    </Modal>
  )
}
