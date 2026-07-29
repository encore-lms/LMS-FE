// 세션 메모리 이미지 저장소 — 에디터가 붙인 이미지를 짧은 `attachment:id` 로 참조하고,
// 렌더(미리보기·상세)에서 base64 dataURL 로 해석한다. 거대한 base64 가 textarea 본문에
// 그대로 노출돼 "이미지 대신 텍스트"처럼 보이는 문제를 막는다.
// 프로토타입: 모듈 메모리라 새로고침 시 소멸(이미지 사라짐) — QnA mock 데이터와 동일 정책.
// 실서비스에선 BE 업로드 후 실제 URL(`![](https://.../x.png)`)로 대체된다.
const store = new Map<string, string>()
let seq = 0

/** 이미지 dataURL 을 저장하고 짧은 참조 id 를 돌려준다. */
export function putImage(dataUrl: string): string {
  const id = `img${++seq}`
  store.set(id, dataUrl)
  return id
}

/** attachment id → dataURL (없으면 undefined). */
export function getImage(id: string): string | undefined {
  return store.get(id)
}
