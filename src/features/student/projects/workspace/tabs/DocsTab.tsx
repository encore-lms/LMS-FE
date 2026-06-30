import { useState } from 'react'
import { Download, FileText, Files } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { apiClient } from '@/shared/api'
import { useAddArtifact, useUploadArtifactFile } from '../../../api/projects'
import type { WorkspaceData, WsDoc } from '../../types'
import { Chip, DetailRow, SectionHead } from '../components/ws-shared'
import { card, parseDocMeta } from '../components/ws-style'

export function DocsTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const [activeCategory, setActiveCategory] = useState('전체')
  const docs = d.docs
  const [adding, setAdding] = useState(false)
  const addArtifactM = useAddArtifact(d.id)
  const uploadFileM = useUploadArtifactFile(d.id)
  const [openDoc, setOpenDoc] = useState<WsDoc | null>(null)
  const visibleDocs =
    activeCategory === '전체'
      ? docs
      : docs.filter((doc) => doc.category === activeCategory)
  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="문서·파일·위키"
        action="문서 추가"
        onAction={() => setAdding(true)}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-col gap-1.5 lg:w-[180px]')}>
          {d.docCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={cn(
                'rounded-lg px-3 py-2 text-left text-[12px] font-semibold',
                c === activeCategory
                  ? 'bg-brand/10 text-brand'
                  : 'text-fg-muted hover:bg-surface-muted',
              )}
            >
              {c}
            </button>
          ))}
        </section>
        <div className="grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2">
          {visibleDocs.map((doc, i) => (
            <div key={i} className={cn(card, 'flex flex-col gap-2')}>
              <span className="text-fg text-[14px] font-bold">{doc.title}</span>
              <span className="text-fg-subtle text-[11px]">{doc.meta}</span>
              <div className="mt-auto flex items-center justify-between pt-1">
                <Chip badge={doc.status} />
                <button
                  type="button"
                  onClick={() => setOpenDoc(doc)}
                  className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
                >
                  열기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {openDoc && (
        <DocDetailModal doc={openDoc} onClose={() => setOpenDoc(null)} />
      )}
      {adding && (
        <AddDocModal
          categories={d.docCategories.filter((category) => category !== '전체')}
          onClose={() => setAdding(false)}
          onAdd={(doc, artifactType, url, file) => {
            if (file) {
              uploadFileM.mutate(
                { title: doc.title, file },
                {
                  onSuccess: () => {
                    toast.success('파일을 첨부했습니다')
                    setAdding(false)
                  },
                  onError: () => toast.danger('파일 첨부에 실패했어요.'),
                },
              )
              return
            }
            addArtifactM.mutate(
              { artifactType, title: doc.title, url },
              {
                onSuccess: () => {
                  toast.success('문서를 추가했습니다')
                  setAdding(false)
                },
                onError: () => toast.danger('문서 추가에 실패했어요.'),
              },
            )
          }}
        />
      )}
    </div>
  )
}

// 화면 카테고리 → BE artifactType(§50)
const CATEGORY_TO_TYPE: Record<string, string> = {
  'API 명세': 'GITHUB',
  '설계 문서': 'DOCUMENT',
  '발표 자료': 'PRESENTATION',
  '첨부 파일': 'FILE',
  위키: 'LINK',
}
function AddDocModal({
  categories,
  onClose,
  onAdd,
}: {
  categories: string[]
  onClose: () => void
  onAdd: (
    doc: WsDoc,
    artifactType: string,
    url: string,
    file: File | null,
  ) => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[0] ?? '위키')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'
  const submit = () => {
    if (!title.trim() && !file) return
    onAdd(
      {
        title: (title.trim() || file?.name) ?? '',
        meta: `${category} · 방금`,
        status: { label: '초안', tone: 'info' },
        category,
      },
      file ? 'FILE' : (CATEGORY_TO_TYPE[category] ?? 'LINK'),
      url.trim(),
      file,
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="문서 추가"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim() && !file}
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            추가
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">제목</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="문서 제목"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">카테고리</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={field}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">링크 URL</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/... (선택)"
            className={field}
            disabled={!!file}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">
            파일 첨부 (선택)
          </span>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-fg-muted text-[12px]"
          />
          {file && (
            <span className="text-fg-subtle text-[11px]">
              {file.name} · 파일 첨부 시 링크는 무시됩니다
            </span>
          )}
        </label>
      </div>
    </Modal>
  )
}

// 문서 상세 — 형식·정보·카테고리·상태 + 미리보기 영역.
// 다운로드: 백엔드 바이너리 대신 문서 메타로 생성한 데모 파일을 실제로 내려받는다(모든 프로젝트 동일).
function DocDetailModal({ doc, onClose }: { doc: WsDoc; onClose: () => void }) {
  const toast = useToast()
  const { type, detail } = parseDocMeta(doc.meta)
  const handleDownload = async () => {
    // 파일 산출물(downloadUrl)이면 실제 업로드 파일을 blob으로 내려받는다.
    if (doc.downloadUrl) {
      try {
        const blob = await apiClient.getBlob(doc.downloadUrl)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.title
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        toast.success(`${doc.title} 다운로드를 시작했어요`)
        onClose()
      } catch {
        toast.danger('파일을 내려받지 못했어요.')
      }
      return
    }
    const content =
      `# ${doc.title}\n\n` +
      `카테고리: ${doc.category}\n` +
      `형식: ${type}\n` +
      `정보: ${detail || '-'}\n` +
      `상태: ${doc.status.label}\n\n` +
      `(데모 파일입니다. 실제 산출물 바이너리는 백엔드 연동 시 제공됩니다.)\n`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title.replace(/[\\/:*?"<>|]/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success(`${doc.title} 다운로드를 시작했어요`)
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="문서 상세"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="bg-brand flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold text-white"
          >
            <Download className="size-4" aria-hidden="true" />
            다운로드
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="bg-brand/10 text-brand flex size-14 shrink-0 items-center justify-center rounded-2xl">
            <FileText className="size-7" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-fg text-[15px] font-bold">{doc.title}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="bg-surface-muted text-fg-muted rounded-md px-2 py-0.5 text-[11px] font-semibold">
                {doc.category}
              </span>
              <Chip badge={doc.status} />
            </div>
          </div>
        </div>

        <div className="border-divider divide-divider flex flex-col divide-y rounded-xl border">
          <DetailRow label="형식" value={type} />
          <DetailRow label="정보" value={detail || '-'} />
          <DetailRow label="카테고리" value={doc.category} />
          <DetailRow label="상태" value={doc.status.label} />
        </div>

        <div className="border-border text-fg-subtle flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed py-8 text-center">
          <Files className="size-7" aria-hidden="true" />
          <span className="text-[12px]">{type} 미리보기 영역</span>
        </div>
      </div>
    </Modal>
  )
}
