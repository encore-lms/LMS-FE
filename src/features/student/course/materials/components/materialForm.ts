import type { MaterialFileType } from '../../types'

// 공유·수정 모달이 함께 쓰는 폼 조각 — 두 화면의 배지·크기 표기가 갈리지 않게 한 곳에 둔다.

/** 첨부 파일명 확장자 → 자료 형식(MaterialFileType). 목록 배지/아이콘과 맞춘다. */
export function fileTypeFromName(name: string): MaterialFileType {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'PDF'
  if (ext === 'zip') return 'ZIP'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'IMG'
  return 'DOC'
}

/** 확장자 → 파일 형식 배지(라벨·색) */
const EXT_BADGE: Record<string, { label: string; cls: string }> = {
  pdf: { label: 'PDF', cls: 'bg-danger-bg text-danger' },
  doc: { label: 'DOC', cls: 'bg-info-bg text-info' },
  docx: { label: 'DOC', cls: 'bg-info-bg text-info' },
  ppt: { label: 'PPT', cls: 'bg-accent-bg text-accent-strong' },
  pptx: { label: 'PPT', cls: 'bg-accent-bg text-accent-strong' },
  zip: { label: 'ZIP', cls: 'bg-warning-bg text-warning' },
  png: { label: 'IMG', cls: 'bg-success-bg text-success' },
  jpg: { label: 'IMG', cls: 'bg-success-bg text-success' },
  jpeg: { label: 'IMG', cls: 'bg-success-bg text-success' },
  gif: { label: 'IMG', cls: 'bg-success-bg text-success' },
  webp: { label: 'IMG', cls: 'bg-success-bg text-success' },
}

export const badgeFor = (name: string) =>
  EXT_BADGE[name.split('.').pop()?.toLowerCase() ?? ''] ?? {
    label: 'FILE',
    cls: 'bg-surface-muted text-fg-muted',
  }

export const fmtSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

/** 업로드 안내 문구 — 두 모달이 같은 제약을 안내해야 한다. */
export const UPLOAD_HINT = 'PDF, DOC, PPT, ZIP, 이미지, TXT/LOG/MD · 파일당 20MB'
