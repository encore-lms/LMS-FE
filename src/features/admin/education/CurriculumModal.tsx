import { useRef, useState } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useToast } from '@/components/ui/use-toast'
import {
  useCurriculum,
  useUploadCurriculum,
  type CurriculumSummary,
} from '../api/settings'

// 커리큘럼 설정 — 운영자가 올린 엑셀(수업일자·일수·교과목·내용)을 기수 커리큘럼으로 저장한다.
// 반영 결과를 주차별로 보여줘 잘못된 파일을 올렸는지 바로 알 수 있게 한다.
export function CurriculumModal({
  open,
  cohortId,
  cohortLabel,
  onClose,
}: {
  open: boolean
  cohortId: string | null
  cohortLabel: string
  onClose: () => void
}) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { data, isPending, isError, refetch } = useCurriculum(
    open ? cohortId : null,
  )
  const upload = useUploadCurriculum(cohortId)

  const send = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast.danger('.xlsx 파일만 올릴 수 있어요')
      return
    }
    upload.mutate(file, {
      onSuccess: (r) =>
        toast.success(`커리큘럼 ${r.dayCount}일을 반영했어요`),
      // 파싱 실패 메시지는 서버가 이유를 담아 준다(시트·열 이름 안내).
      onError: (e) =>
        toast.danger(e?.message || '커리큘럼을 읽지 못했어요'),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="커리큘럼 설정"
      footer={
        <button
          type="button"
          onClick={onClose}
          className={buttonClass({ size: 'md' })}
        >
          닫기
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-fg-muted -mt-1 text-[12px] leading-5">
          <b>{cohortLabel}</b> 커리큘럼 엑셀을 올리면 수강생 강의 홈의 주차별
          학습에 배우는 내용이 표시돼요. 시트에 <b>수업일자 · 일수 · 교과목 ·
          내용</b> 열이 있어야 하고, 올릴 때마다 이 기수 커리큘럼은 새 파일로
          전부 바뀝니다.
        </p>

        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) send(file)
          }}
          className={[
            'flex cursor-pointer flex-col items-center gap-2 rounded-[14px] border-2 border-dashed px-6 py-8 text-center transition-colors',
            dragging
              ? 'border-brand bg-brand/5'
              : 'border-border hover:border-brand/40',
          ].join(' ')}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) send(file)
              e.target.value = ''
            }}
          />
          <Upload className="text-fg-subtle size-5" />
          <span className="text-fg text-[13px] font-semibold">
            {upload.isPending
              ? '반영 중…'
              : '엑셀 파일을 끌어다 놓거나 클릭해서 선택'}
          </span>
          <span className="text-fg-subtle text-[11px]">.xlsx</span>
        </label>

        <DataBoundary
          isPending={isPending}
          isError={isError}
          onRetry={refetch}
          loadingText="커리큘럼을 불러오는 중…"
          errorTitle="커리큘럼을 불러오지 못했어요"
          skeleton={<div className="bg-surface-muted h-40 rounded-[14px]" />}
        >
          {data && <CurriculumPreview data={data} />}
        </DataBoundary>
      </div>
    </Modal>
  )
}

function CurriculumPreview({ data }: { data: CurriculumSummary }) {
  if (data.dayCount === 0) {
    return (
      <p className="text-fg-subtle text-center text-[13px]">
        아직 반영된 커리큘럼이 없어요.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-surface-muted/60 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[12px] px-4 py-3 text-[12px]">
        <span className="text-fg flex items-center gap-1.5 font-bold">
          <FileSpreadsheet className="text-fg-subtle size-3.5" />
          {data.dayCount}일 · {data.weeks.length}주
        </span>
        {data.startDate && (
          <span className="text-fg-muted">
            {data.startDate} — {data.endDate}
          </span>
        )}
        <span className="text-fg-muted">
          교과목 {data.subjects.length}개
        </span>
      </div>

      <div className="border-border max-h-72 overflow-y-auto rounded-[12px] border">
        {data.weeks.map((w) => (
          <div
            key={w.weekNo}
            className="border-divider flex items-start gap-3 border-b px-4 py-2.5 last:border-b-0"
          >
            <span className="text-fg-subtle w-12 shrink-0 text-[12px] font-bold tabular-nums">
              {w.weekNo}주차
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-fg text-[13px] font-semibold">
                {w.subjects.join(' · ')}
              </span>
              {w.topics.length > 0 && (
                <span className="text-fg-subtle text-[11px]">
                  {w.topics.join(' · ')}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
