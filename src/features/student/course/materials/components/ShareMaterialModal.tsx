import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { buttonClass } from '@/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import type { MaterialFileType, ShareMaterialInput } from '../../types'

// 첨부 파일명 확장자 → 자료 형식(MaterialFileType). 목록 배지/아이콘과 맞춘다.
function fileTypeFromName(name: string): MaterialFileType {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'PDF'
  if (ext === 'zip') return 'ZIP'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'IMG'
  return 'DOC'
}

// 확장자 → 파일 형식 배지(라벨·색)
const EXT_BADGE: Record<string, { label: string; cls: string }> = {
  pdf: { label: 'PDF', cls: 'bg-danger-bg text-danger' },
  doc: { label: 'DOC', cls: 'bg-info-bg text-info' },
  docx: { label: 'DOC', cls: 'bg-info-bg text-info' },
  ppt: { label: 'PPT', cls: 'bg-accent-bg text-accent-strong' },
  pptx: { label: 'PPT', cls: 'bg-accent-bg text-accent-strong' },
  zip: { label: 'ZIP', cls: 'bg-warning-bg text-warning' },
  png: { label: 'IMG', cls: 'bg-success-bg text-success' },
  jpg: { label: 'IMG', cls: 'bg-success-bg text-success' },
  jpeg: { label: 'IMG', cls: 'bg-success-bg text-success' },
  gif: { label: 'IMG', cls: 'bg-success-bg text-success' },
  webp: { label: 'IMG', cls: 'bg-success-bg text-success' },
}
const badgeFor = (name: string) =>
  EXT_BADGE[name.split('.').pop()?.toLowerCase() ?? ''] ?? {
    label: 'FILE',
    cls: 'bg-surface-muted text-fg-muted',
  }
const fmtSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

interface ShareFile {
  id: string
  name: string
  size: string
}

// 자료 공유 모달 — 공용 Modal 사용. 파일 업로드/링크 공유 탭 + 메타 입력 + 공유하기.
export function ShareMaterialModal({
  open,
  onClose,
  onShared,
}: {
  open: boolean
  onClose: () => void
  onShared: (payload: ShareMaterialInput) => void
}) {
  const [tab, setTab] = useState<'file' | 'link'>('file')
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [files, setFiles] = useState<ShareFile[]>([
    { id: 'seed', name: 'jpa-n-plus-one-note.pdf', size: '1.1 MB' },
  ])
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const idRef = useRef(0)

  // 입력값을 자료 공유 페이로드로 변환해 상위로 올린다(제목 미입력 시 파일명/기본값).
  const handleShare = () => {
    if (tab === 'file') {
      const first = files[0]
      onShared({
        title: title.trim() || first?.name || '제목 없는 자료',
        fileType: first ? fileTypeFromName(first.name) : 'DOC',
        sizeLabel: first?.size,
      })
    } else {
      onShared({
        title: title.trim() || '공유 링크',
        fileType: 'LINK',
        fileUrl: link.trim() || undefined,
      })
    }
    setTitle('')
    setLink('')
  }

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return
    const added = Array.from(list).map((f) => ({
      id: `f${idRef.current++}`,
      name: f.name,
      size: fmtSize(f.size),
    }))
    setFiles((prev) => [...prev, ...added])
  }
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files)
    e.target.value = '' // 같은 파일 재선택 허용
  }
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }
  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id))

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="자료 공유"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleShare}
            className={buttonClass({ size: 'md' })}
          >
            공유하기
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-fg-muted -mt-1 text-[13px]">
          학습 정리 자료나 참고 링크를 같은 기수 수강생에게 공유합니다.
        </p>

        {/* 안내 배너 */}
        <div className="bg-info-bg flex gap-2 rounded-[10px] p-3.5">
          <span className="text-info shrink-0 text-[13px] font-bold">ⓘ</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-info text-[13px] font-semibold">
              학생 공유 자료
            </span>
            <span className="text-fg-muted text-[12px] leading-[18px]">
              학생 공유 자료로 표시됩니다. 공식 강의 자료와 구분되며, 본인이
              올린 자료는 수정·삭제할 수 있습니다.
            </span>
          </div>
        </div>

        {/* 탭 + 학생 공유 배지 */}
        <div className="flex items-center justify-between">
          <div className="bg-surface-muted flex gap-1 rounded-[10px] p-1">
            {(['file', 'link'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-lg px-4 py-2 text-[13px] font-semibold',
                  tab === t ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted',
                )}
              >
                {t === 'file' ? '파일 업로드' : '링크 공유'}
              </button>
            ))}
          </div>
          <span className="border-brand text-brand rounded-full border px-3 py-1 text-[12px] font-semibold">
            학생 공유
          </span>
        </div>

        {/* 제목 */}
        <Field label="제목">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) JPA N+1 문제 정리 노트"
            className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
          />
        </Field>

        {/* 주차/과목 + 카테고리 */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="관련 주차/과목">
            <input
              defaultValue="9주차 · Spring Boot"
              className="border-border text-fg focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
            />
          </Field>
          <Field label="카테고리">
            <input
              defaultValue="학생 공유"
              className="border-border text-fg focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
            />
          </Field>
        </div>

        {/* 설명 */}
        <Field label="설명">
          <textarea
            rows={3}
            placeholder="자료를 보는 사람이 알면 좋은 맥락을 짧게 적어 주세요."
            className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-[88px] w-full rounded-[10px] border p-3.5 text-[13px] outline-none"
          />
        </Field>

        {/* 파일 / 링크 */}
        {tab === 'file' ? (
          <Field label="첨부 파일">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={onPick}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1.5 rounded-[10px] border border-dashed p-5 text-center transition-colors',
                dragOver
                  ? 'border-brand bg-brand/5'
                  : 'border-border bg-surface-muted/40 hover:bg-surface-muted/70',
              )}
            >
              <span className="bg-brand/10 text-brand mb-0.5 flex size-9 items-center justify-center rounded-full text-base">
                ↑
              </span>
              <span className="text-fg text-[13px] font-medium">
                파일을 드래그하거나 클릭하여 업로드
              </span>
              <span className="text-fg-subtle text-[11px]">
                PDF, DOC, PPT, ZIP, 이미지, TXT/LOG/MD · 파일당 20MB
              </span>
            </div>
            {files.map((f) => {
              const b = badgeFor(f.name)
              return (
                <div
                  key={f.id}
                  className="border-border bg-surface mt-2 flex items-center gap-3 rounded-[10px] border p-3"
                >
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
                      b.cls,
                    )}
                  >
                    {b.label}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-fg truncate text-[13px] font-medium">
                      {f.name}
                    </span>
                    <span className="text-fg-subtle text-[11px]">
                      {f.size} · 업로드 준비 완료
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    className="text-danger shrink-0 text-[12px] font-semibold hover:underline"
                  >
                    삭제
                  </button>
                </div>
              )
            })}
          </Field>
        ) : (
          <Field label="공유 링크">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://github.com/... 또는 블로그 URL"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
            />
          </Field>
        )}
      </div>
    </Modal>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-fg text-[13px] font-semibold">{label}</label>
      {children}
    </div>
  )
}
