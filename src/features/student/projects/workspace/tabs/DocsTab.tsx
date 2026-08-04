import { useState } from 'react'
import { Download, FileText, Files } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { inputClass } from '@/components/ui/inputClass'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import { apiClient } from '@/shared/api'
import {
  useAddArtifact,
  useEditArtifact,
  useDeleteArtifact,
  useUploadArtifactFile,
  wsWriteError,
} from '../../../api/projects'
import type { WorkspaceData, WsDoc } from '../../types'
import { Chip, DetailRow, SectionHead } from '../components/ws-shared'
import { card, parseDocMeta } from '../components/ws-style'

export function DocsTab({
  d,
  readOnly = false,
}: {
  d: WorkspaceData
  /** 검토자(매니저·강사) 열람 — 추가·수정·삭제·업로드 미노출(2026-08-04). */
  readOnly?: boolean
}) {
  const toast = useToast()
  const [activeCategory, setActiveCategory] = useState('전체')
  const docs = d.docs
  const [adding, setAdding] = useState(false)
  const addArtifactM = useAddArtifact(d.id)
  const editArtifactM = useEditArtifact(d.id)
  const deleteArtifactM = useDeleteArtifact(d.id)
  const [editing, setEditing] = useState<WsDoc | null>(null)
  const [deleting, setDeleting] = useState<WsDoc | null>(null)
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
        action={readOnly ? undefined : '문서 추가'}
        onAction={readOnly ? undefined : () => setAdding(true)}
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
            <div key={i} className={cn(card, 'flex min-w-0 flex-col gap-2')}>
              {/* 제목·링크는 자유 입력 — 칸 안에서 접고, 끊을 데가 없으면 어디서든 끊는다. */}
              <span className="text-fg text-[14px] font-bold [overflow-wrap:anywhere]">
                {doc.title}
              </span>
              <span className="text-fg-subtle text-[11px] [overflow-wrap:anywhere]">
                {doc.meta}
              </span>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <Chip badge={doc.status} />
                <div className="flex shrink-0 items-center gap-1">
                  {!readOnly && doc.id && (
                    <>
                      <button
                        type="button"
                        aria-label={`${doc.title} 수정`}
                        onClick={() => setEditing(doc)}
                        className="text-fg-subtle hover:text-fg hover:bg-surface-muted rounded px-2 py-1 text-[12px] font-semibold"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        aria-label={`${doc.title} 삭제`}
                        onClick={() => setDeleting(doc)}
                        className="text-danger hover:bg-danger-bg rounded px-2 py-1 text-[12px] font-semibold"
                      >
                        삭제
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenDoc(doc)}
                    className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
                  >
                    열기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {openDoc && (
        <DocDetailModal doc={openDoc} onClose={() => setOpenDoc(null)} />
      )}
      {editing && (
        <AddDocModal
          categories={d.docCategories.filter((category) => category !== '전체')}
          editing={editing}
          onClose={() => setEditing(null)}
          onAdd={(doc, artifactType, url) => {
            editArtifactM.mutate(
              {
                artifactId: editing.id!,
                artifactType,
                title: doc.title,
                url: url || undefined,
              },
              {
                onSuccess: () => {
                  toast.success('문서를 수정했습니다')
                  setEditing(null)
                },
                onError: (e) =>
                  toast.danger(wsWriteError(e, '문서 수정에 실패했어요.')),
              },
            )
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        title="문서 삭제"
        confirmLabel="삭제"
        tone="danger"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting?.id) return
          deleteArtifactM.mutate(
            { artifactId: deleting.id },
            {
              onSuccess: () => {
                toast.success('문서를 삭제했습니다')
                setDeleting(null)
              },
              onError: (e) =>
                toast.danger(wsWriteError(e, '문서 삭제에 실패했어요.')),
            },
          )
        }}
      >
        <p className="text-fg-muted text-[13px]">
          '{deleting?.title ?? ''}' 문서를 삭제할까요? 되돌릴 수 없어요.
        </p>
      </ConfirmDialog>
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
                  onError: (e) =>
                    toast.danger(wsWriteError(e, '파일 첨부에 실패했어요.')),
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
                onError: (e) =>
                  toast.danger(wsWriteError(e, '문서 추가에 실패했어요.')),
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
  editing,
  onClose,
  onAdd,
}: {
  categories: string[]
  /** 주면 수정 모드 — 기존 값으로 채워 시작한다. 파일 교체는 다시 올리는 쪽이라 다루지 않는다. */
  editing?: WsDoc
  onClose: () => void
  onAdd: (
    doc: WsDoc,
    artifactType: string,
    url: string,
    file: File | null,
  ) => void
}) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const [category, setCategory] = useState(
    editing?.category ?? categories[0] ?? '위키',
  )
  const [url, setUrl] = useState(editing?.url ?? '')
  const [file, setFile] = useState<File | null>(null)
  const field = inputClass()
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
      title={editing ? '문서 수정' : '문서 추가'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim() && !file}
            className={buttonClass({ size: 'sm' })}
          >
            {editing ? '저장' : '추가'}
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
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">카테고리</span>
          <Select
            aria-label="카테고리"
            value={category}
            onChange={setCategory}
            options={categories.map((item) => ({ value: item, label: item }))}
            className="h-10 w-full"
          />
        </div>
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
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className={buttonClass({ size: 'sm' })}
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
