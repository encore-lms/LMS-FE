import { useRef, type ChangeEvent } from 'react'

// Step 3 — 증빙 첨부(권장). UI + mock 단계: 실제 업로드는 BE 보류라 파일명만 수집해 페이로드 메타로 전달.
export function EvidenceUploadStep({
  files,
  onChange,
}: {
  files: File[]
  onChange: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    // 파일명만 들고 있으면 서버에 바이트가 가지 않는다 — 실제 File 을 보관한다.
    const picked = Array.from(e.target.files ?? [])
    if (picked.length) onChange([...files, ...picked])
    e.target.value = '' // 같은 파일 재선택 허용
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-fg-muted text-sm">
        공가 사용 또는 운영 확인이 필요한 경우 증빙 파일을 첨부하세요.
        JPG·PNG·PDF·HEIC 지원.
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="border-border text-fg-subtle hover:border-fg-subtle rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm transition-colors"
      >
        파일을 끌어 놓거나 클릭해 첨부하세요. 모바일은 촬영/캡처 업로드를 우선
        지원합니다.
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.pdf,.heic"
        className="hidden"
        onChange={onPick}
      />
      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="bg-surface-muted text-fg flex items-center justify-between rounded-md px-3 py-2 text-sm"
            >
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="text-fg-subtle hover:text-danger ml-2 shrink-0 text-xs"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
