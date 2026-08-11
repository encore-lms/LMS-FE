import { useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { Paperclip } from 'lucide-react'
import { buttonClass } from '@/components/ui/buttonClass'
import type { AssignmentDraft } from '../types'

// 과제 제출 폼 — 본문(textarea)·제출 URL(input)·첨부 자산(파일 업로드·링크 추가) + 목록으로/제출 저장.
// 카드 박스 없이 문서처럼 흐르고, 입력은 muted 채움 필드를 쓴다(2026-08-11 참조 이미지 정본).
// 채움 필드 공통 — 테두리 없이 배경으로 구분하고, 포커스에서만 teal 테두리 1겹.
const filled =
  'bg-surface-muted text-fg placeholder:text-fg-subtle w-full rounded-xl border border-transparent outline-none focus:border-brand'
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
    <section className="flex flex-col gap-6">
      <h3 className="text-fg text-[20px] font-bold">제출 내용</h3>

      <div className="flex flex-col gap-2">
        <label className="text-fg text-[13px] font-semibold">본문</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="구현 범위, 실행 방법, 설계 의도를 작성합니다."
          className={`${filled} min-h-[220px] p-4 text-[14px] leading-6`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-fg text-[13px] font-semibold">제출 URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/..."
          className={`${filled} h-12 px-4 text-[14px]`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <label className="text-fg text-[13px] font-semibold">
            첨부/링크 자산
          </label>
          <p className="text-fg-muted text-[12px]">
            파일, GitHub PR, 배포 링크를 추가할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
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
            className="bg-surface-muted text-fg hover:bg-divider inline-flex h-12 shrink-0 items-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold transition-colors"
          >
            <Paperclip aria-hidden className="size-4" /> 파일 첨부
          </button>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={onLinkKey}
            placeholder="GitHub PR · 배포 링크 URL"
            className={`${filled} h-12 min-w-0 flex-1 px-4 text-[13px]`}
          />
          <button
            type="button"
            onClick={addLink}
            disabled={!link.trim()}
            className="bg-surface-muted text-fg hover:bg-divider h-12 shrink-0 rounded-xl px-4 text-[13px] font-semibold transition-colors disabled:opacity-40"
          >
            링크 추가
          </button>
        </div>
        {assets.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {assets.map((a) => (
              <span
                key={a}
                className="bg-surface-muted inline-flex max-w-full items-center gap-1.5 rounded-lg py-1 pr-1.5 pl-2.5 text-[12px]"
              >
                <span className="text-fg max-w-[220px] truncate">{a}</span>
                <button
                  type="button"
                  onClick={() => removeAsset(a)}
                  aria-label={`${a} 제거`}
                  className="text-fg-subtle hover:bg-divider hover:text-danger flex size-4 shrink-0 items-center justify-center rounded leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          className="bg-surface-muted text-fg hover:bg-divider h-11 rounded-xl px-5 text-[14px] font-semibold transition-colors"
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
