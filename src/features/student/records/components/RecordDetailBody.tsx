import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import {
  downloadRecordAttachment,
  fetchRecordAttachment,
  useCertRecord,
  useStudyRecord,
} from '../../api/records'
import type { RecordCategory, UploadedFileMeta } from '../types'

// 상세 모달의 본문 — 목록 카드에는 없는 값(시간·활동 내역·증빙·자격증 종류)을 상세 API 로 가져온다.
// 예전에는 카드 데이터만 렌더해서 제목·날짜 말고는 아무것도 보이지 않았다.

const CERT_LABEL: Record<string, string> = {
  PCCE: 'PCCE · Python 기초',
  PCCP: 'PCCP · Python 중급',
  PCSQL: 'PCSQL · SQL 개발자',
}

function isImage(f: UploadedFileMeta) {
  return (
    f.contentType?.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name)
  )
}

/** 이미지 증빙은 미리보기로 띄운다 — 합격 화면 캡처가 대부분이라 파일명만으론 확인이 안 된다. */
function AttachmentThumb({ file }: { file: UploadedFileMeta }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!isImage(file)) return
    let revoked = false
    let objectUrl: string | null = null
    fetchRecordAttachment(file.id)
      .then((blob) => {
        if (revoked) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {})
    return () => {
      revoked = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  if (!url) return null
  return (
    <img
      src={url}
      alt={file.name}
      className="border-divider max-h-40 rounded-[10px] border object-contain"
    />
  )
}

function Attachments({ files }: { files: UploadedFileMeta[] }) {
  if (files.length === 0) {
    return <span className="text-fg-subtle text-[13px]">첨부한 증빙이 없어요</span>
  }
  return (
    <div className="flex flex-col gap-2">
      {files.map((f) => (
        <div key={f.id} className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() =>
              downloadRecordAttachment(f.id, f.name).catch(() => {})
            }
            className="bg-surface-muted hover:bg-surface-muted/70 flex items-center gap-2 rounded-[10px] px-3 py-2 text-left transition-colors"
          >
            <FileText className="text-fg-subtle h-4 w-4 shrink-0" />
            <span className="text-fg min-w-0 flex-1 truncate text-[13px] font-semibold">
              {f.name}
            </span>
            {f.size && (
              <span className="text-fg-subtle text-[12px]">{f.size}</span>
            )}
            <Download className="text-fg-subtle h-4 w-4 shrink-0" />
          </button>
          <AttachmentThumb file={f} />
        </div>
      ))}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-fg-subtle w-20 shrink-0">{label}</dt>
      <dd className="text-fg min-w-0 flex-1">{children}</dd>
    </div>
  )
}

export function RecordDetailBody({
  recordId,
  category,
}: {
  recordId: string
  category: RecordCategory
}) {
  const study = useStudyRecord(recordId, category === 'study')
  const cert = useCertRecord(recordId, category === 'cert')
  const q = category === 'study' ? study : cert

  if (q.isPending) {
    return (
      <div className="flex flex-col gap-2">
        <div className="bg-surface-muted h-4 w-32 animate-pulse rounded" />
        <div className="bg-surface-muted h-4 w-56 animate-pulse rounded" />
        <div className="bg-surface-muted h-16 w-full animate-pulse rounded" />
      </div>
    )
  }
  if (q.isError || !q.data) return null

  if (category === 'study' && study.data) {
    const d = study.data
    return (
      <>
        <Row label="일정">
          {d.date}
          {d.startTime && ` · ${d.startTime}${d.endTime ? `~${d.endTime}` : ''}`}
        </Row>
        <Row label="활동 내역">
          {d.body?.trim() ? (
            <span className="whitespace-pre-wrap">{d.body}</span>
          ) : (
            <span className="text-fg-subtle">작성한 내용이 없어요</span>
          )}
        </Row>
        <Row label="증빙 자료">
          <Attachments files={d.files ?? []} />
        </Row>
      </>
    )
  }

  if (category === 'cert' && cert.data) {
    const d = cert.data
    return (
      <>
        <Row label="자격증 종류">
          {d.certType === 'OTHER'
            ? (d.otherCertName ?? '기타')
            : (CERT_LABEL[d.certType] ?? d.certType)}
        </Row>
        <Row label="증빙 파일">
          <Attachments files={d.files ?? []} />
        </Row>
      </>
    )
  }
  return null
}
