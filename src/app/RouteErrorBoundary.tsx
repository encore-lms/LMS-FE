import { useEffect } from 'react'
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from 'react-router-dom'
import { AlertTriangle, Compass } from 'lucide-react'
import { Empty } from '@/components/ui/Empty'
import { Button } from '@/components/ui/Button'
import { isChunkLoadError, reloadForStaleChunk } from './staleChunk'

// 라우트 하위 페이지가 렌더 중 throw하면(가드 누락·런타임 오류·청크 로드 실패 등) 트리 전체가
// 언마운트되어 흰 화면이 된다. router.tsx의 errorElement로 이 컴포넌트를 물려 흰 화면을 막는다.
// 셸(사이드바·헤더) 안쪽 Outlet 위치에 렌더되도록 배선해, 에러 시에도 셸은 유지되고 본문만 대체된다.
export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  const stale = isChunkLoadError(error)

  useEffect(() => {
    // 기본 오류 오버레이를 대체하므로, 개발자가 스택을 볼 수 있도록 콘솔에는 남긴다.
    console.error('[RouteErrorBoundary]', error)
    // 재배포로 옛 청크가 사라진 경우 최신 빌드로 1회 자동 새로고침해 복구한다.
    if (stale) reloadForStaleChunk()
  }, [error, stale])

  // 없는 주소는 오류가 아니다 — '다시 시도'하라고 하면 새로고침하면 될 것처럼 읽힌다.
  // (옮겨 가거나 걷어낸 화면의 옛 주소를 북마크로 들고 오는 경우가 대부분이다.)
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="p-8">
        <Empty
          icon={<Compass />}
          title="찾을 수 없는 주소예요"
          description="주소가 바뀌었거나 없어진 화면일 수 있어요. 메뉴에서 다시 찾아 주세요."
          action={<Button onClick={() => navigate('/')}>홈으로</Button>}
        />
      </div>
    )
  }

  if (stale) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="새 버전이 배포됐어요"
          description="최신 화면으로 자동 새로고침 중이에요. 안 되면 아래 버튼을 눌러주세요."
          action={
            <Button onClick={() => window.location.reload()}>새로고침</Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="p-8">
      <Empty
        icon={<AlertTriangle />}
        title="화면을 표시하지 못했어요"
        description="일시적인 오류일 수 있어요. 다시 시도하거나 잠시 후 접속해 주세요."
        action={
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()}>다시 시도</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>
              홈으로
            </Button>
          </div>
        }
      />
    </div>
  )
}
