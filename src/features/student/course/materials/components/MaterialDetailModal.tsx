import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/use-toast'
import { ArticleView } from '@/components/data/ArticleView'
import {
  AttachmentFileCard,
  AttachmentLinkCard,
} from '@/components/data/MaterialAttachment'
import { downloadCourseMaterialFile } from '../../../api/course'
import type { MaterialFileType, MaterialItem } from '../../types'

// 자료 상세 — 목록 행을 클릭하면 열린다.
// 강사·매니저 자료실과 같은 게시글형(ArticleView)으로 통일했다. 같은 자료를 역할마다 다른
// 모양으로 보여주면 "어디서는 용량이 보이고 어디서는 안 보이는" 차이가 생긴다.
const TYPE_BADGE: Record<MaterialFileType, string> = {
  PDF: 'bg-danger-bg text-danger',
  DOC: 'bg-info-bg text-info',
  ZIP: 'bg-warning-bg text-warning',
  LINK: 'bg-accent-bg text-accent-strong',
  IMG: 'bg-success-bg text-success',
  VIDEO: 'bg-accent-bg text-accent-strong',
}

const FILE_EXT: Record<MaterialFileType, string> = {
  PDF: 'pdf',
  DOC: 'docx',
  ZIP: 'zip',
  IMG: 'png',
  VIDEO: 'mp4',
  LINK: '',
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

  const handleDownload = async () => {
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
    if (item.fileUrl) {
      downloadFile(item.fileUrl, `${item.title}.${FILE_EXT[item.fileType]}`)
    }
  }

  const hasFile = !!item.hasFile || (!!item.fileUrl && !item.isExternalLink)

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      footer={
        <>
          {item.ownedByMe && onEdit && (
            <Button
              variant="secondary"
              onClick={() => {
                onEdit(item)
                onClose()
              }}
            >
              수정
            </Button>
          )}
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
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </>
      }
    >
      <ArticleView
        badges={[
          { label: item.fileType, className: TYPE_BADGE[item.fileType] },
        ]}
        title={item.title}
        metaItems={[item.author, item.timeAgo]}
        body={item.body ?? null}
        bodyEmptyText="본문 없이 등록된 자료입니다."
        footer={
          hasFile ? (
            <AttachmentFileCard
              fileName={item.fileName ?? item.title}
              fileSize={item.fileSize}
              onDownload={handleDownload}
            />
          ) : item.isExternalLink && item.fileUrl ? (
            <AttachmentLinkCard url={item.fileUrl} />
          ) : null
        }
      />
    </Modal>
  )
}
