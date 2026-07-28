import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { downloadCourseMaterialFile } from '../../../api/course'
import type { MaterialCategory, MaterialFileType, MaterialItem } from '../../types'
import { FileTypeIcon } from './FileTypeIcon'

// 자료 상세 — 목록 행을 클릭하면 열린다.
// 예전에는 목록 행에 다운로드·링크 열기·미리보기·삭제가 늘어서 있어 무엇을 보고 받는지
// 판단하기 전에 버튼부터 골라야 했다. 이제 내용을 먼저 보고 여기서 처리한다.
const TYPE_PILL: Record<MaterialFileType, string> = {
  PDF: 'bg-danger-bg text-danger',
  DOC: 'bg-info-bg text-info',
  ZIP: 'bg-warning-bg text-warning',
  LINK: 'bg-accent-bg text-accent-strong',
  IMG: 'bg-success-bg text-success',
  VIDEO: 'bg-accent-bg text-accent-strong',
}

const CATEGORY_LABEL: Record<MaterialCategory, string> = {
  lecture: '강의 자료',
  practice: '실습',
  reference: '참고',
  shared: '학생 공유',
}

const FILE_EXT: Record<MaterialFileType, string> = {
  PDF: 'pdf',
  DOC: 'docx',
  ZIP: 'zip',
  IMG: 'png',
  VIDEO: 'mp4',
  LINK: '',
}

function openInNewTab(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function downloadFile(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** 메타 한 줄 — 값이 없으면 아예 그리지 않는다(빈 '-'만 늘어놓지 않게). */
function Meta({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2">
      <span className="text-fg-subtle w-24 shrink-0 text-[12px]">{label}</span>
      <span className="text-fg min-w-0 flex-1 text-[13px] break-all">
        {value}
      </span>
    </div>
  )
}

export function MaterialDetailModal({
  item,
  onClose,
  onDelete,
}: {
  item: MaterialItem | null
  onClose: () => void
  /** 본인이 올린 자료에만 삭제 노출 */
  onDelete?: (item: MaterialItem) => void
}) {
  const toast = useToast()
  if (!item) return null

  const hasFile = !!item.hasFile || !!item.fileUrl
  const handleDownloadOrOpen = async () => {
    if (item.hasFile) {
      try {
        await downloadCourseMaterialFile(
          item.id,
          item.fileName ?? `${item.title}.${FILE_EXT[item.fileType] || 'dat'}`,
        )
      } catch {
        toast.danger('파일 다운로드에 실패했어요')
      }
      return
    }
    if (!item.fileUrl) return
    if (item.isExternalLink) {
      openInNewTab(item.fileUrl)
    } else {
      downloadFile(item.fileUrl, `${item.title}.${FILE_EXT[item.fileType]}`)
    }
  }

  return (
    <Modal open onClose={onClose} title="자료 상세" size="md">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3.5">
          <FileTypeIcon fileType={item.fileType} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="text-fg text-[15px] font-semibold break-words">
              {item.title}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'rounded-[4px] px-1.5 py-px text-[10px] font-bold tracking-[0.04em]',
                  TYPE_PILL[item.fileType],
                )}
              >
                {item.fileType}
              </span>
              <span className="bg-surface-muted text-fg-muted rounded-[4px] px-1.5 py-px text-[10px] font-bold">
                {CATEGORY_LABEL[item.category]}
              </span>
            </div>
          </div>
        </div>

        {item.body && (
          <div className="bg-surface-muted rounded-xl px-4 py-3.5">
            <p className="text-fg text-[13px] leading-relaxed whitespace-pre-wrap">
              {item.body}
            </p>
          </div>
        )}

        <div className="divide-divide flex flex-col divide-y">
          <Meta label="공유한 사람" value={item.author} />
          <Meta label="올린 시각" value={item.timeAgo} />
          <Meta label="파일명" value={item.fileName} />
          <Meta label="용량" value={item.sizeLabel} />
          <Meta
            label="링크"
            value={item.isExternalLink ? item.fileUrl : null}
          />
        </div>

        <div className="flex justify-end gap-2">
          {item.ownedByMe && onDelete && (
            <Button
              variant="secondary"
              onClick={() => {
                onDelete(item)
                onClose()
              }}
            >
              삭제
            </Button>
          )}
          <Button onClick={handleDownloadOrOpen} disabled={!hasFile}>
            {item.isExternalLink ? '링크 열기' : '다운로드'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
