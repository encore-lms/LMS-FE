import { apiClient } from './client'

// 본문 편집기 지원 API — 파일 올리기, 링크 미리보기.
// 올린 파일은 글에 매이지 않는다(글을 저장하기 전에 본문에 넣기 때문). 본문에는 `upload:{id}`
// 논리 참조가 담기고, 읽는 화면이 자기 역할에 맞는 경로로 바꿔 부른다.

export interface UploadedFile {
  id: string
  fileName: string
  contentType: string | null
  fileSize: number
  image: boolean
  /** `upload:{id}` — 본문 마크다운에 그대로 넣는 값. */
  url: string
}

export interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  favicon: string | null
  siteName: string | null
}

export async function uploadEditorFile(file: File): Promise<UploadedFile> {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.postForm<UploadedFile>(
    '/instructor/editor/uploads',
    form,
  )
  return res.data
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const res = await apiClient.get<LinkPreview>(
    '/instructor/editor/link-preview',
    { url },
  )
  return res.data
}
