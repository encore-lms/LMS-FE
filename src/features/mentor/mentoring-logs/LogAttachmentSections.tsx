// 일지 작성 — 작성 산출물·활동 기록 첨부 섹션(업로드 계약 미확정: 파일명 표시 전용, LogComposeForm 분리).
import type { Dispatch, SetStateAction } from 'react'
import { Plus, Upload } from 'lucide-react'
import type {
  MentoringLogDetailData,
  MentoringLogFieldSnapshot,
} from '../types'
import { RequiredChip } from './LogChips'

export function LogArtifactsSection({
  filesField,
  artifactNames,
  setArtifactNames,
}: {
  filesField: MentoringLogFieldSnapshot
  artifactNames: string[]
  setArtifactNames: Dispatch<SetStateAction<string[]>>
}) {
  return (
    <section className="bg-surface flex flex-col gap-2.5 rounded-2xl p-5 shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]">
      <div className="flex items-center gap-2">
        <span className="bg-surface-muted text-fg-muted flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-[11px] font-bold">
          {filesField.order}
        </span>
        <span className="text-fg text-sm font-bold">{filesField.name}</span>
        <RequiredChip required={false} />
      </div>
      <p className="text-fg-subtle text-[11px]">{filesField.description}</p>
      <label className="border-border hover:bg-surface-muted flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-[10px] border border-dashed px-4 py-3.5">
        <span className="flex items-center gap-3">
          <span className="bg-surface-muted text-fg-muted flex h-10 w-10 items-center justify-center rounded-lg">
            <Upload className="h-4 w-4" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-fg text-[13px] font-semibold">
              파일·문서를 끌어 놓거나 클릭해 업로드
            </span>
            <span className="text-fg-subtle text-[11px]">
              PDF · DOC · PPT · MD · 이미지 (최대 50MB · 5개)
            </span>
          </span>
        </span>
        <span className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-xs font-medium">
          파일 선택
        </span>
        <input
          type="file"
          multiple
          aria-label="작성 산출물 파일 선택"
          className="hidden"
          onChange={(e) => {
            const names = [...(e.target.files ?? [])].map((f) => f.name)
            setArtifactNames((prev) => [...prev, ...names].slice(0, 5))
          }}
        />
      </label>
      {artifactNames.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {artifactNames.map((name) => (
            <li
              key={name}
              className="bg-surface-muted text-fg-muted rounded px-2 py-0.5 text-[11px] font-medium"
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function LogPhotosSection({
  photosField,
  detail,
  photoNames,
  setPhotoNames,
}: {
  photosField: MentoringLogFieldSnapshot
  detail: MentoringLogDetailData | null
  photoNames: string[]
  setPhotoNames: Dispatch<SetStateAction<string[]>>
}) {
  return (
    <section className="bg-surface flex flex-col gap-2.5 rounded-2xl p-5 shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]">
      <div className="flex items-center gap-2">
        <span className="bg-surface-muted text-fg-muted flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-[11px] font-bold">
          {photosField.order}
        </span>
        <span className="text-fg text-sm font-bold">{photosField.name}</span>
        <RequiredChip required={false} />
        {(detail?.photos.length ?? 0) > 0 && (
          <span className="text-fg-subtle ml-auto text-[11px]">
            {detail!.photos.length}장 · 타임스탬프 확인됨
          </span>
        )}
      </div>
      <p className="text-fg-subtle text-[11px]">{photosField.description}</p>
      <div className="flex flex-wrap gap-3">
        {(detail?.photos ?? []).map((photo) => (
          <div
            key={`${photo.kind}-${photo.timeLabel}`}
            className="bg-brand-deep flex h-[120px] w-[200px] flex-col justify-end rounded-xl p-2.5"
          >
            <span className="text-on-color/70 text-[9px] font-bold tracking-[0.72px]">
              TIME STAMP
            </span>
            <span className="text-on-color/80 text-[10px]">
              {photo.dateLabel}
            </span>
            <span className="text-on-color text-[13px] font-bold">
              {photo.timeLabel} ({photo.kind === 'start' ? '시작' : '종료'})
            </span>
          </div>
        ))}
        <label className="border-border hover:bg-surface-muted flex h-[120px] w-[200px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed">
          <span className="bg-surface-muted text-fg-muted flex h-10 w-10 items-center justify-center rounded-lg">
            <Plus className="h-4 w-4" />
          </span>
          <span className="text-fg text-xs font-semibold">사진 추가</span>
          <span className="text-fg-subtle text-[10px]">타임스탬프 권장</span>
          <input
            type="file"
            accept="image/*"
            multiple
            aria-label="활동 기록 사진 추가"
            className="hidden"
            onChange={(e) => {
              const names = [...(e.target.files ?? [])].map((f) => f.name)
              setPhotoNames((prev) => [...prev, ...names])
            }}
          />
        </label>
      </div>
      {photoNames.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {photoNames.map((name) => (
            <li
              key={name}
              className="bg-surface-muted text-fg-muted rounded px-2 py-0.5 text-[11px] font-medium"
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
