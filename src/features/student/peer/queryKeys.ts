// 동료 평가 쿼리 키 — 기능 로컬.
export const peerKeys = {
  all: ['student', 'peer'] as const,
  hub: () => [...peerKeys.all, 'hub'] as const,
  tag: () => [...peerKeys.all, 'tag'] as const,
  reputation: () => [...peerKeys.all, 'reputation'] as const,
}
