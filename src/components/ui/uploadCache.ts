import { fetchEditorUpload, type UploadScope } from '@/shared/api'

/**
 * 받아 둔 그림을 세션 동안 들고 있는다.
 *
 * <p>예전에는 이 컴포넌트가 사라질 때 사본을 놓아 줬다(revokeObjectURL). 그런데 같은 글
 * 아래 댓글창에 한 글자만 쳐도 본문이 다시 그려지면서 그림이 잠깐 사라졌다가 다시 받아지는
 * 일이 생겼다 — 글을 쓰는 내내 그림이 깜빡인다. 주소를 캐시에 남겨 두면 다시 그려도 그 자리에
 * 그대로 있다. 같은 파일을 두 번 내려받지도 않는다.</p>
 */
const 그림캐시 = new Map<string, string>()
const 받는중 = new Map<string, Promise<string>>()

export function uploadObjectUrl(
  id: string,
  scope: UploadScope,
): Promise<string> {
  const key = `${scope}:${id}`
  const hit = 그림캐시.get(key)
  if (hit) return Promise.resolve(hit)
  const going = 받는중.get(key)
  if (going) return going
  // 같은 그림이 한 글에 여러 번 나와도 요청은 한 번이다.
  const p = fetchEditorUpload(id, scope)
    .then((blob) => {
      const url = URL.createObjectURL(blob)
      그림캐시.set(key, url)
      받는중.delete(key)
      return url
    })
    .catch((e) => {
      받는중.delete(key)
      throw e
    })
  받는중.set(key, p)
  return p
}

/**
 * 들고 있던 사본을 모두 놓는다 — 로그아웃처럼 보는 사람이 바뀔 때.
 *
 * <p>계정이 바뀌었는데 앞사람이 보던 그림이 그대로 그려지면 안 된다.</p>
 */
export function clearUploadCache() {
  for (const url of 그림캐시.values()) URL.revokeObjectURL(url)
  그림캐시.clear()
  받는중.clear()
}

/** 이미 받아 둔 그림 주소(없으면 undefined) — 다시 그릴 때 빈 자리 없이 잇는다. */
export function cachedUploadUrl(
  id: string,
  scope: UploadScope,
): string | undefined {
  return 그림캐시.get(`${scope}:${id}`)
}
