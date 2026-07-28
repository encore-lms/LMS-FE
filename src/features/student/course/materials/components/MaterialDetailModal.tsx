import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { downloadCourseMaterialFile } from '../../../api/course'
import type {
  MaterialCategory,
  MaterialFileType,
  MaterialItem,
} from '../../types'
import { FileTypeIcon } from './FileTypeIcon'

// 자료 상세 — 목록 행을 클릭하면 열린다.
// 예전에는 목록 행에 다운로드·링크 열기·미리보기·삭제가 늘어서 있어 자료가 무엇인지 보기도 전에
// 버튼부터 골라야 했다. 이제 내용을 먼저 보고 여기서 처리한다.
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

/** 바이트 수를 사람이 읽는 단위로 — 서버는 fileSize(바이트)만 준다. */
function formatSize(bytes?: number | null) {
  if (bytes == null || bytes <= 0) return null
  if (bytes < 1024) return `${bytes}B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)}KB`
  const mb = kb / 1024
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)}MB`
}

/** 메타 한 줄 — 값이 없으면 아예 그리지 않는다(빈 '-'만 늘어놓지 않게). */
function Meta({
  label,
  value,
  breakAll,
}: {
  label: string
  value?: string | null
  /** 파일명·URL처럼 중간에서 끊어야 하는 값 */
  breakAll?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex gap-4">
      <dt className="text-fg-subtle w-[72px] shrink-0 text-[12px] leading-5">
        {label}
      </dt>
      <dd
        className={cn(
          'text-fg min-w-0 flex-1 text-[13px] leading-5',
          breakAll ? 'break-all' : 'break-words',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

export function MaterialDetailModal({
  item,
  onClose,
  onDelete,
  onEdit,
}: {
  item: MaterialItem | null
  onClose: () => void
  /** 본인이 올린 자료에만 삭제 노출 */
  onDelete?: (item: MaterialItem) => void
  /** 본인이 올린 자료에만 수정 노출 */
  onEdit?: (item: MaterialItem) => void
}) {
  const toast = useToast()
  if (!item) return null

  const hasFile = !!item.hasFile || !!item.fileUrl
  const sizeLabel = item.sizeLabel ?? formatSize(item.fileSize)
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
      <div className="flex flex-col gap-4">
        {/* 헤드 — 무엇을 받는 자료인지 한눈에. 구분선 대신 muted 배경으로 묶는다(flat 규약). */}
        <div className="bg-surface-muted flex items-start gap-3.5 rounded-xl px-4 py-4">
          <FileTypeIcon fileType={item.fileType} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-fg text-[15px] leading-[22px] font-bold break-words">
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
              <span className="text-fg-muted rounded-[4px] bg-white px-1.5 py-px text-[10px] font-bold">
                {CATEGORY_LABEL[item.category]}
              </span>
              {sizeLabel && (
                <span className="text-fg-subtle text-[11px]">{sizeLabel}</span>
              )}
            </div>
          </div>
        </div>

        {item.body && (
          <p className="text-fg-muted text-[13px] leading-[21px] whitespace-pre-wrap">
            {item.body}
          </p>
        )}

        {/* 메타 — 가로 구분선 없이 라벨/값 정렬만으로 읽히게 한다(표처럼 보이지 않도록). */}
        <dl className="flex flex-col gap-2.5">
          <Meta label="공유한 사람" value={item.author} />
          <Meta label="올린 시각" value={item.timeAgo} />
          <Meta label="주차·과목" value={item.week} />
          <Meta label="파일명" value={item.fileName} breakAll />
          <Meta
            label="링크"
            value={item.isExternalLink ? item.fileUrl : null}
            breakAll
          />
        </dl>

        <div className="flex items-center justify-end gap-1 pt-1">
          {item.ownedByMe && onEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit(item)
                onClose()
              }}
              className="text-fg-muted hover:text-fg px-3 py-2 text-[13px] font-medium transition-colors"
            >
              수정
            </button>
          )}
          {item.ownedByMe && onDelete && (
            // 삭제는 되돌릴 수 없어 눈에 덜 띄게 둔다 — 주 동작은 다운로드다.
            <button
              type="button"
              onClick={() => {
                onDelete(item)
                onClose()
              }}
              className="text-fg-subtle hover:text-danger px-3 py-2 text-[13px] font-medium transition-colors"
            >
              삭제
            </button>
          )}
          <Button onClick={handleDownloadOrOpen} disabled={!hasFile}>
            {item.isExternalLink ? '링크 열기' : '다운로드'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
