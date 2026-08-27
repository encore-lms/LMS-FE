import { useState } from 'react'
import { Download, ExternalLink, FileText, Files } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { URL_FORMAT_MESSAGE, isHttpUrl } from '@/shared/lib/url'
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
        <DocDetailModal
          doc={openDoc}
          readOnly={readOnly}
          onClose={() => setOpenDoc(null)}
        />
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
  const [urlError, setUrlError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const field = inputClass()
  const submit = () => {
    if (!title.trim() && !file) return
    // 파일이 없을 때 링크는 실제 주소여야 한다(파일 첨부 시 링크는 무시).
    if (!file && url.trim() && !isHttpUrl(url)) {
      setUrlError(URL_FORMAT_MESSAGE)
      return
    }
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
            onChange={(e) => {
              setUrl(e.target.value)
              setUrlError(null)
            }}
            placeholder="https://github.com/... (선택)"
            aria-invalid={!!urlError}
            className={field}
            disabled={!!file}
          />
          {urlError && !file && (
            <span className="text-danger text-[11px]">{urlError}</span>
          )}
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

/**
 * 문서 상세 — 형식·정보·카테고리 + 실제 산출물로 가는 길.
 *
 * <p>예전에는 링크로 등록한 산출물에도 '다운로드'가 문서 메타로 만든 데모 txt 를 내려줬다.
 * 정작 등록된 링크는 화면 어디에도 없어, 열어도 산출물에 닿을 수 없었다.
 * 링크는 링크로 열고, 파일은 파일을 내려받고, 둘 다 없으면 아무 버튼도 두지 않는다.</p>
 */
function DocDetailModal({
  doc,
  readOnly,
  onClose,
}: {
  doc: WsDoc
  /** 검토자(매니저·강사) 열람 — 파일 본문은 수강생 소유 API라 내려받을 수 없다. */
  readOnly: boolean
  onClose: () => void
}) {
  const toast = useToast()
  // 링크 산출물의 meta 는 URL 그 자체다 — 그대로 쪼개면 '형식: https://…' 처럼 읽힌다.
  // 주소는 아래 링크 행이 맡고, 여기서는 무엇인지만 말한다.
  const parsed = parseDocMeta(doc.meta)
  const type = doc.url ? '링크' : parsed.type
  const detail = doc.url ? '' : parsed.detail
  const handleDownload = async () => {
    if (!doc.downloadUrl) return
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
          {doc.url && (
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonClass({ size: 'sm' })}
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              링크 열기
            </a>
          )}
          {doc.downloadUrl && (
            // 검토자는 눌러도 403이다(파일 본문이 /student 소유 API) — 눌러 보고 실패하는 대신 미리 막는다.
            <button
              type="button"
              onClick={handleDownload}
              disabled={readOnly}
              title={
                readOnly
                  ? '파일 본문은 수강생 화면에서만 내려받을 수 있어요.'
                  : undefined
              }
              className={cn(
                buttonClass({ size: 'sm' }),
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <Download className="size-4" aria-hidden="true" />
              다운로드
            </button>
          )}
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

        {doc.url ? (
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer noopener"
            className="border-border text-brand hover:bg-surface-muted flex items-center gap-2 rounded-xl border border-dashed px-4 py-4 text-[12px] [overflow-wrap:anywhere]"
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
            {doc.url}
          </a>
        ) : (
          <div className="border-border text-fg-subtle flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed py-8 text-center">
            <Files className="size-7" aria-hidden="true" />
            <span className="text-[12px]">
              {doc.downloadUrl
                ? `${type} 파일 — 내려받아 확인해요`
                : '등록된 링크나 파일이 없어요'}
            </span>
          </div>
        )}
      </div>
    </Modal>
  )
}
