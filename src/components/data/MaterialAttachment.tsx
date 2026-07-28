import { Download, ExternalLink } from 'lucide-react'

// 자료 첨부/링크 카드 — 강사·매니저·수강생 상세가 함께 쓴다.
// 세 화면이 각자 그리면 "파일명만 보이는 곳"과 "용량까지 보이는 곳"이 갈린다.

/** 바이트 → 사람이 읽는 단위. 서버는 크기를 바이트로만 준다. */
export function formatFileSize(bytes?: number | null) {
  if (bytes == null || bytes <= 0) return null
  if (bytes < 1024) return `${bytes}B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)}KB`
  const mb = kb / 1024
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)}MB`
}

const CARD =
  'border-border hover:border-brand hover:bg-info-bg/40 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors'
const ICON =
  'bg-info-bg text-info flex size-10 shrink-0 items-center justify-center rounded-lg'

/** 첨부 파일 — 클릭하면 내려받는다. */
export function AttachmentFileCard({
  fileName,
  fileSize,
  onDownload,
}: {
  fileName: string
  fileSize?: number | null
  onDownload: () => void
}) {
  const size = formatFileSize(fileSize)
  return (
    <button type="button" onClick={onDownload} className={CARD}>
      <span className={ICON}>
        <Download className="h-5 w-5" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-fg truncate text-sm font-semibold">
          {fileName}
        </span>
        <span className="text-fg-subtle text-xs">
          {size ? `${size} · ` : ''}클릭하여 다운로드
        </span>
      </span>
    </button>
  )
}

/** 외부 링크 — 주소를 함께 보여줘야 어디로 가는지 알 수 있다. */
export function AttachmentLinkCard({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className={CARD}>
      <span className={ICON}>
        <ExternalLink className="h-5 w-5" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-fg text-sm font-semibold">링크 열기</span>
        <span className="text-info truncate text-xs">{url}</span>
      </span>
    </a>
  )
}
