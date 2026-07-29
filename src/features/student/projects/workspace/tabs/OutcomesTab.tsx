import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { inputClass } from '@/components/ui/inputClass'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { useAddMetric, wsWriteError } from '../../../api/projects'
import type { WorkspaceData } from '../../types'
import { SectionHead } from '../components/ws-shared'
import { card } from '../components/ws-style'

export function OutcomesTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const metrics = d.metrics
  const [adding, setAdding] = useState(false)
  const addMetricM = useAddMetric(d.id)
  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="성과 지표"
        action="지표 추가"
        onAction={() => setAdding(true)}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {metrics.map((m) => (
          <section key={m.label} className={cn(card, 'flex flex-col gap-3')}>
            <span className="text-fg text-[14px] font-bold">{m.label}</span>
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
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (metric: WorkspaceData['metrics'][number]) => void
}) {
  const [label, setLabel] = useState('')
  const [before, setBefore] = useState('')
  const [after, setAfter] = useState('')
  const [delta, setDelta] = useState('')
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
      title="지표 추가"
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
