import { Link, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useMentoringLogDetail, useMentoringLogTargets } from '../api/logs'
import { MENTOR_FLOW_CAPTION } from '../constants'
import { LogComposeForm } from './LogComposeForm'

// 멘토링 일지 작성/수정 (/mentor/mentoring-logs/new) — Figma 2553:4166.
// 모드: 신규(?teamId= 프리셋) / 이어 작성(?logId= 초안) / 수정·재제출(?logId= 수정 요청).
// 제출된 유효 일지는 진입 차단 — 제출 즉시 자동 유효 + 임의 수정·삭제 불가(05-31 확정).
export default function LogComposePage() {
  usePageHeader('멘토링 일지 작성/수정', MENTOR_FLOW_CAPTION)
  const [searchParams] = useSearchParams()
  const logId = searchParams.get('logId') ?? ''
  const presetTeamId = searchParams.get('teamId') ?? ''
  // 팀 상세에서 왔으면 그 주소로 돌려보낸다 — 사이드바에서 사라진 목록으로 내보내지 않는다.
  // 우리 화면 안 경로만 받는다(바깥 주소로 튕겨 보내지 못하게).
  const fromParam = searchParams.get('from') ?? ''
  const backTo = fromParam.startsWith('/mentor/') ? fromParam : undefined
  const targetsQuery = useMentoringLogTargets()
  const detailQuery = useMentoringLogDetail(logId)

  const detail = logId ? (detailQuery.data ?? null) : null
  // 사이드바에서 사라진 옛 목록(/mentor/mentoring-logs)으로 내보내면 404 다(2026-08-06 QA).
  // 진입 경로 → 그 일지가 속한 팀의 일지 탭 → 팀 목록 순으로 돌려보낸다.
  const backTeamId = detail?.teamId ?? presetTeamId
  const listTo =
    backTo ??
    (backTeamId ? `/mentor/teams/${backTeamId}?tab=logs` : '/mentor/teams')

  return (
    <DataBoundary
      isPending={targetsQuery.isPending || (!!logId && detailQuery.isPending)}
      isError={
        targetsQuery.isError ||
        !targetsQuery.data ||
        (!!logId && (detailQuery.isError || !detailQuery.data))
      }
      onRetry={() => targetsQuery.refetch()}
      loadingText="작성 정보를 불러오는 중…"
      errorTitle="작성 정보를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {targetsQuery.data &&
        (detail && detail.status === 'valid' ? (
          <div className="p-8">
            <Empty
              icon={<Lock />}
              title="제출된 일지는 수정할 수 없어요"
              description="제출하면 매니저 승인 대기 상태가 됩니다. 운영자 수정 요청이 있을 때만 전체 수정 후 재제출할 수 있어요."
              action={
                <Link
                  to={listTo}
                  className="border-border text-fg hover:bg-surface-muted flex h-14 items-center rounded-[11px] border bg-white px-5 text-[15px] font-bold"
                >
                  일지 목록으로
                </Link>
              }
            />
          </div>
        ) : (
          <LogComposeForm
            targets={targetsQuery.data.targets}
            detail={detail}
            presetTeamId={presetTeamId}
            backTo={backTo}
          />
        ))}
    </DataBoundary>
  )
}
