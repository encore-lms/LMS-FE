import type { Dispatch, SetStateAction } from 'react'
import { FileText, Link2, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { ACCEPT_TYPES, card, type UploadFile } from './caseFormConstants'

interface CaseTagsAttachmentsProps {
  tags: string[]
  tagInput: string
  setTagInput: Dispatch<SetStateAction<string>>
  addTag: (raw: string) => void
  removeTag: (tag: string) => void
  files: UploadFile[]
  addFiles: (list: FileList | null) => void
  removeFile: (id: string) => void
  links: string[]
  removeLink: (url: string) => void
  linkInput: string
  setLinkInput: Dispatch<SetStateAction<string>>
  addLink: () => void
}

export function CaseTagsAttachments({
  tags,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  files,
  addFiles,
  removeFile,
  links,
  removeLink,
  linkInput,
  setLinkInput,
  addLink,
}: CaseTagsAttachmentsProps) {
  return (
    <section className={cn(card, 'flex flex-col gap-3')}>
      <div className="flex items-center justify-between">
        <span className="text-fg text-[15px] font-bold">태그 · 첨부</span>
        <span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-[11px] font-bold">
          태그 {tags.length} / 5
        </span>
      </div>
      <span className="text-fg-subtle text-[11px]">
        태그는 검색·필터에 사용해요. 해결 근거 파일을 함께 첨부하세요.
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="bg-brand flex items-center gap-2 rounded-full py-1 pr-1 pl-3 text-[12px] font-semibold text-white"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              aria-label={`${t} 제거`}
              className="text-brand flex size-4 items-center justify-center rounded-full bg-white"
            >
              <X className="size-2.5" strokeWidth={3} />
            </button>
          </span>
        ))}
        {tags.length < 5 && (
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag(tagInput)
                setTagInput('')
              }
            }}
            placeholder="+ 태그 추가"
            className="text-fg-subtle placeholder:text-fg-subtle focus:text-fg w-24 bg-transparent px-1 py-1 text-[12px] outline-none"
          />
        )}
      </div>
      <div className="bg-surface-muted/40 text-fg-muted rounded-lg px-3 py-2 text-[11px] leading-4">
        허용 형식 — 이미지(PNG·JPG·GIF·WEBP·SVG) · PDF ·
        로그/텍스트(.log·.txt·.md·.json·.yml) · 파일당 최대 10MB
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {files.map((f) => {
          const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name)
          return (
            <span
              key={f.id}
              className="border-border flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5"
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                  isImage
                    ? 'bg-accent-bg text-accent-strong'
                    : 'bg-success-bg text-success',
                )}
              >
                <FileText className="size-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-fg truncate text-[12px] font-semibold">
                  {f.name}
                </span>
                <span className="text-fg-subtle text-[11px]">{f.size}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                aria-label={`${f.name} 제거`}
                className="border-border text-fg-subtle hover:text-fg flex size-6 shrink-0 items-center justify-center rounded-md border"
              >
                <X className="size-3" />
              </button>
            </span>
          )
        })}
        <label className="border-border text-fg-subtle hover:border-brand/50 flex cursor-pointer items-center justify-center gap-1 rounded-[10px] border border-dashed px-3 py-2.5 text-[12px]">
          + 파일 추가
          <input
            type="file"
            multiple
            accept={ACCEPT_TYPES}
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {links.map((url) => (
        <span
          key={url}
          className="border-border flex items-center gap-2 rounded-[10px] border px-3 py-2.5 text-[12px]"
        >
          <Link2 className="text-fg-subtle size-3.5 shrink-0" />
          <span className="text-fg-muted flex-1 truncate">{url}</span>
          <button
            type="button"
            onClick={() => removeLink(url)}
            aria-label="링크 제거"
            className="text-fg-subtle hover:text-fg"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <div className="flex items-center gap-2">
        <div className="border-border focus-within:border-brand flex flex-1 items-center gap-2 rounded-[10px] border px-3 py-2.5">
          <Link2 className="text-fg-subtle size-3.5 shrink-0" />
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addLink()
              }
            }}
            placeholder="https:// 근거 링크를 붙여넣고 Enter"
            className="text-fg placeholder:text-fg-subtle flex-1 bg-transparent text-[12px] outline-none"
          />
        </div>
        <button
          type="button"
          onClick={addLink}
          className="border-border text-fg-muted hover:bg-surface-muted shrink-0 rounded-[10px] border px-3.5 py-2.5 text-[12px] font-semibold"
        >
          링크 추가
        </button>
      </div>
    </section>
  )
}
