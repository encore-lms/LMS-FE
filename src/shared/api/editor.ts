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

/** 본문 안 업로드를 읽는 사람의 역할로 받는다. */
export type UploadScope = 'student' | 'staff'

/** 본문에 담긴 `upload:{id}` → 역할별 실제 경로. */
export function uploadPath(id: string, scope: UploadScope): string {
  const prefix = scope === 'staff' ? '/instructor' : '/student'
  return `${prefix}/editor/uploads/${encodeURIComponent(id)}/file`
}

/**
 * 올린 파일을 내려받는다.
 *
 * <p>주소를 그대로 &lt;a download&gt;·&lt;img src&gt; 에 걸 수 없다 — 이 경로는 로그인을
 * 요구하는데 브라우저가 스스로 부르는 요청에는 토큰이 붙지 않아 401 이 된다. 여기서 받아
 * 온 blob 을 화면이 쓴다.</p>
 */
export async function fetchEditorUpload(
  id: string,
  scope: UploadScope,
): Promise<Blob> {
  return apiClient.getBlob(uploadPath(id, scope))
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const res = await apiClient.get<LinkPreview>(
    '/instructor/editor/link-preview',
    { url },
  )
  return res.data
}
