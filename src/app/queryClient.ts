import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

// 앱 전역 단일 QueryClient. 모듈 싱글톤이라 StrictMode 이중 마운트에도 인스턴스가 유지된다.
// (싱글톤이므로 StrictMode의 이중 마운트 부수효과 검증 대상에서 제외됨 — 내부 로직 변경 시 수동 확인 필요)
// 서버 상태 SSOT(FE_초기_세팅_결정 §1.2.5). 화면은 useQuery/useMutation으로만 서버 데이터를 다룬다.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 현재 MSW mock 전용 값. 실제 API 전환 시 데이터 특성별(자주 변함 30s / 안정 5m 등)로 분화 재검토.
      staleTime: 60_000,
      // 5xx(서버 오류)만 1회 재시도 — 4xx(클라이언트 오류)·네트워크 외 오류는 재시도 무의미
      retry: (failureCount, error) =>
        isAxiosError(error) &&
        (error.response?.status ?? 0) >= 500 &&
        failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
})
