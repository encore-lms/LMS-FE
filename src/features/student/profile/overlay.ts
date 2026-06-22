// 프로필 로컬 오버레이 — BE 미연결 MVP. 온보딩/프로필 편집에서 저장한 부분 입력을
// localStorage 에 보존하고, 프로필 mock(GET)이 기본 프로필 위에 덮어쓴다.
// → 온보딩에서 적은 스킬·외부 URL 이 페이지 이동·새로고침 후에도 프로필에 실제 반영된다.
import type { ProfileUpdatePayload } from './types'

const KEY = 'lms-profile-overlay'

/** 프로필 위에 덮어쓸 편집 가능 필드(부분). */
export type ProfileOverlay = Partial<ProfileUpdatePayload>

/** 저장된 오버레이 읽기 — 없거나 비가용 시 빈 객체. */
export function readProfileOverlay(): ProfileOverlay {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ProfileOverlay) : {}
  } catch {
    return {}
  }
}

/** 기존 오버레이에 patch 를 머지해 저장. */
export function mergeProfileOverlay(patch: ProfileOverlay): void {
  try {
    const next = { ...readProfileOverlay(), ...patch }
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* localStorage 비가용 환경 무시 */
  }
}
