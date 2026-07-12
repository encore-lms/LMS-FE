import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api'

export interface PeerMember {
  userId: string
  name: string
}
interface PeerListResponse {
  items: PeerMember[]
}

export const peersKeys = { all: ['student', 'peers'] as const }

// 같은 기수 동료 명단(auth /users/peers, BE #64) — 본인 제외 STUDENT 실명.
// 프로젝트 멤버·상호평가 등에서 userId→이름 매핑에 재사용.
export function usePeers() {
  return useQuery({
    queryKey: peersKeys.all,
    queryFn: () =>
      apiClient.get<PeerListResponse>('/users/peers').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
