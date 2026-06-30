import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import type { WorkspaceData } from '../../types'
import { SectionHead } from '../components/ws-shared'
import { card } from '../components/ws-style'

export function OutcomesTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const [metrics, setMetrics] = useState(d.metrics)
  const [adding, setAdding] = useState(false)
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
      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[14px] font-bold">기술 스택</span>
        <div className="flex flex-wrap gap-2">
          {d.stack.map((s) => (
            <span
              key={s}
              className="bg-surface-muted text-fg-muted rounded-lg px-3 py-1.5 text-[12px] font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </section>
      {adding && (
        <AddMetricModal
          onClose={() => setAdding(false)}
          onAdd={(metric) => {
            setMetrics((prev) => [...prev, metric])
            setAdding(false)
            toast.success('지표를 추가했습니다')
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
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'
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
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={
              !label.trim() || !before.trim() || !after.trim() || !delta.trim()
            }
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
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
