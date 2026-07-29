import { usePeers } from '../../../api/peers'
import { useAuth } from '@/shared/store/auth'

// 프로젝트 멤버 userId → 실명. /users/peers(같은 기수 동료) + 로그인 본인으로 매핑.
// 매칭 실패 시 fallback 라벨(BE의 '팀장'/'팀원 N')을 그대로 쓴다.
export function useMemberNames() {
  const { data } = usePeers()
  const { user } = useAuth()
  const byId = new Map<string, string>()
  for (const p of data?.items ?? []) byId.set(p.userId, p.name)
  if (user) byId.set(user.id, user.name)
  return (userId: string | undefined, fallback: string) =>
    (userId && byId.get(userId)) || fallback
}
