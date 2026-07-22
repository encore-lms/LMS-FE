import { useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { buttonClass } from '@/components/ui/buttonClass'
import type { AssignmentDraft } from '../types'

// 과제 제출 폼 — 본문(textarea)·제출 URL(input)·첨부 자산(파일 업로드·링크 추가) + 목록으로/제출 저장.
export function SubmissionForm({
  draft,
  isSaving,
  onSave,
  onBack,
}: {
  draft: AssignmentDraft | null
  isSaving?: boolean
  onSave: (draft: AssignmentDraft) => void
  onBack: () => void
}) {
  const [body, setBody] = useState(draft?.body ?? '')
  const [url, setUrl] = useState(draft?.url ?? '')
  const [assets, setAssets] = useState<string[]>(draft?.assets ?? [])
  const [link, setLink] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const addAssets = (items: string[]) =>
    setAssets((prev) => [
      ...prev,
      ...items.filter((i) => i && !prev.includes(i)),
    ])
  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    addAssets(Array.from(e.target.files ?? []).map((f) => f.name))
    e.target.value = '' // 같은 파일 재선택 허용
  }
  const addLink = () => {
    if (link.trim()) addAssets([link.trim()])
    setLink('')
  }
  const onLinkKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addLink()
    }
  }
  const removeAsset = (a: string) =>
    setAssets((prev) => prev.filter((x) => x !== a))
  const canSubmit =
    body.trim().length > 0 || url.trim().length > 0 || assets.length > 0

  return (
    <section className="border-border bg-surface flex flex-col gap-5 rounded-lg border p-6">
      <h3 className="text-fg text-[18px] font-bold">제출 내용</h3>

      <div className="flex flex-col gap-2">
        <label className="text-fg text-[13px] font-semibold">본문</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="구현 범위, 실행 방법, 설계 의도를 작성합니다."
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-[150px] w-full rounded-[10px] border p-3.5 text-[13px] leading-5 outline-none focus-visible:shadow-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-fg text-[13px] font-semibold">제출 URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/..."
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none focus-visible:shadow-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-fg text-[13px] font-semibold">
          첨부/링크 자산
        </label>
        <div className="border-border bg-surface-muted/40 flex flex-col gap-3 rounded-[10px] border border-dashed p-4">
          <p className="text-fg-muted text-[13px]">
            파일, GitHub PR, 배포 링크를 추가할 수 있습니다.
          </p>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={onFiles}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="border-border text-fg-muted hover:bg-surface inline-flex shrink-0 items-center gap-1 rounded-lg border bg-white px-3 py-2 text-[12px] font-semibold"
            >
              <span className="text-[13px] leading-none">↑</span> 파일 첨부
            </button>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={onLinkKey}
              placeholder="GitHub PR · 배포 링크 URL"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-9 min-w-0 flex-1 rounded-lg border px-3 text-[12px] outline-none focus-visible:shadow-none"
            />
            <button
              type="button"
              onClick={addLink}
              disabled={!link.trim()}
              className={buttonClass({ size: 'sm', className: 'shrink-0' })}
            >
              링크 추가
            </button>
          </div>
          {assets.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {assets.map((a) => (
                <span
                  key={a}
                  className="border-border bg-surface inline-flex max-w-full items-center gap-1.5 rounded-lg border py-1 pr-1.5 pl-2.5 text-[12px]"
                >
                  <span className="text-fg max-w-[220px] truncate">{a}</span>
                  <button
                    type="button"
                    onClick={() => removeAsset(a)}
                    aria-label={`${a} 제거`}
                    className="text-fg-subtle hover:bg-surface-muted hover:text-danger flex size-4 shrink-0 items-center justify-center rounded leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
        >
          목록으로
        </button>
        <button
          type="button"
          onClick={() => onSave({ body, url, assets })}
          disabled={!canSubmit || isSaving}
          className={buttonClass({ size: 'md' })}
        >
          {isSaving ? '저장 중…' : '제출 저장'}
        </button>
      </div>
    </section>
  )
}
