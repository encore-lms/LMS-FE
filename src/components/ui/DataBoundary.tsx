import { type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Empty } from './Empty'
import { Button } from './Button'

interface DataBoundaryProps {
  /** 쿼리 로딩 상태 (useQuery의 isPending) */
  isPending: boolean
  /** 쿼리 실패 상태 (useQuery의 isError, 또는 isError || !data) */
  isError: boolean
  /** 재시도 핸들러 (useQuery의 refetch). 없으면 재시도 버튼을 숨긴다. */
  onRetry?: () => void
  loadingText?: string
  errorTitle?: string
  errorDescription?: ReactNode
  /** 로딩/에러 상태 컨테이너에 덧붙일 클래스 (여백 등 조정용) */
  className?: string
  children: ReactNode
}

/**
 * 로딩/에러를 **데이터 영역에만** 한정하는 공통 래퍼.
 *
 * 페이지에서 정적 셸(탭·헤더·필터)은 이 컴포넌트 "밖"에 두고 데이터 의존 본문만 감싸면,
 * 쿼리가 실패해도 셸이 사라지지 않는다(= early-return all-or-nothing 안티패턴 해소).
 * 흰 화면 자체는 전역 RouteErrorBoundary가 막고, 이 래퍼는 "본문만 에러 카드로 대체"를 담당.
 *
 * @example
 * <>
 *   <CourseTabs />                                   // 셸 — 항상 유지
 *   <DataBoundary isPending={q.isPending} isError={q.isError} onRetry={q.refetch}>
 *     <List items={q.data.items} />                  // 데이터 본문만 감쌈
 *   </DataBoundary>
 * </>
 */
export function DataBoundary({
  isPending,
  isError,
  onRetry,
  loadingText = '불러오는 중…',
  errorTitle = '데이터를 불러오지 못했어요',
  errorDescription = '잠시 후 다시 시도해 주세요.',
  className,
  children,
}: DataBoundaryProps) {
  if (isPending) {
    return (
      <div
        className={cn(
          'text-fg-muted flex items-center justify-center py-12 text-sm',
          className,
        )}
      >
        {loadingText}
      </div>
    )
  }
  if (isError) {
    return (
      <div className={className}>
        <Empty
          icon={<AlertTriangle />}
          title={errorTitle}
          description={errorDescription}
          action={onRetry && <Button onClick={onRetry}>다시 시도</Button>}
        />
      </div>
    )
  }
  return <>{children}</>
}
