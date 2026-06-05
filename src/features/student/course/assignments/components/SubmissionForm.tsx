import { useState } from 'react'
import type { AssignmentDraft } from '../types'

// 과제 제출 폼 — 본문(textarea)·제출 URL(input)·첨부 자산(드롭존) + 목록으로/제출 저장.
export function SubmissionForm({
  draft,
  onSave,
  onBack,
}: {
  draft: AssignmentDraft | null
  onSave: () => void
  onBack: () => void
}) {
  const [body, setBody] = useState(draft?.body ?? '')
  const [url, setUrl] = useState(draft?.url ?? '')
  const assets = draft?.assets ?? []

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
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-[150px] w-full rounded-[10px] border p-3.5 text-[13px] leading-5 outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-fg text-[13px] font-semibold">제출 URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/..."
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-fg text-[13px] font-semibold">
          첨부/링크 자산
        </label>
        <div className="border-border bg-surface-muted/40 flex flex-col gap-1.5 rounded-[10px] border p-4">
          <p className="text-fg-muted text-[13px]">
            파일, GitHub PR, 배포 링크를 추가할 수 있습니다.
          </p>
          {assets.length > 0 && (
            <p className="text-fg text-[12px] font-medium">
              {assets.join(' · ')}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onBack}
          className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
        >
          목록으로
        </button>
        <button
          type="button"
          onClick={onSave}
          className="bg-brand h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white"
        >
          제출 저장
        </button>
      </div>
    </section>
  )
}
