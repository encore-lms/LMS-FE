import { useEffect, useRef, useState } from 'react'
import type { UploadedFileMeta } from '../types'

// 폼 첨부 파일 상태 — 실제 File 을 선택받아 미리보기/제거를 지원한다.
// 새로 고른 파일은 file 을 들고 있어야 제출 시 서버로 올릴 수 있다
// (예전에는 메타만 남겨서 화면에만 보이고 저장되지 않았다).
export interface UploadItem extends UploadedFileMeta {
  previewUrl?: string // 이미지 미리보기(blob URL) — 새로 선택한 파일만
  file?: File // 새로 고른 파일 원본 — 기존 첨부(서버 저장분)는 없음
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

let seq = 0

export function useFileUpload(initial: UploadedFileMeta[] = []) {
  const [files, setFiles] = useState<UploadItem[]>(initial)
  // 생성한 blob URL을 모아 언마운트 때 일괄 해제(메모리 누수 방지).
  const urls = useRef<string[]>([])

  useEffect(() => {
    return () => urls.current.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  const add = (list: FileList | null) => {
    if (!list || list.length === 0) return
    const items: UploadItem[] = Array.from(list).map((f) => {
      const isImage = f.type.startsWith('image/')
      const previewUrl = isImage ? URL.createObjectURL(f) : undefined
      if (previewUrl) urls.current.push(previewUrl)
      return {
        id: `f${++seq}`,
        name: f.name,
        size: formatSize(f.size),
        previewUrl,
        file: f,
      }
    })
    setFiles((prev) => [...prev, ...items])
  }

  const remove = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((x) => x.id === id)
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
        urls.current = urls.current.filter((u) => u !== target.previewUrl)
      }
      return prev.filter((x) => x.id !== id)
    })
  }

  const replace = (list: FileList | null) => {
    // 단일 파일 교체(자격증) — 기존 blob 해제 후 새 파일로.
    urls.current.forEach((u) => URL.revokeObjectURL(u))
    urls.current = []
    setFiles([])
    add(list)
  }

  return { files, add, remove, replace, setFiles }
}
