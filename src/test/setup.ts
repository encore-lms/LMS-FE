import '@testing-library/jest-dom/vitest'

// ProseMirror(위지윅 편집기)는 커서를 화면에 맞춰 스크롤하려고 좌표를 묻는데,
// jsdom 에는 그 API 가 없어 편집할 때마다 예외가 난다. 레이아웃이 없는 환경이라
// 좌표는 의미가 없으므로 빈 값을 돌려주고 넘어간다.
const EMPTY_RECT = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  toJSON: () => ({}),
} as DOMRect

const emptyRectList = () =>
  Object.assign([] as DOMRect[], {
    item: () => null,
  }) as unknown as DOMRectList

if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = emptyRectList
  Range.prototype.getBoundingClientRect = () => EMPTY_RECT
}
if (!Element.prototype.getClientRects) {
  Element.prototype.getClientRects = emptyRectList
}
// 마우스로 편집기를 클릭하면 좌표로 위치를 되묻는다 — 같은 이유로 비워 둔다.
if (!document.elementFromPoint) {
  document.elementFromPoint = () => null
}
