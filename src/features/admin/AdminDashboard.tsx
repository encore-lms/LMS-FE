import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { usePageHeader } from '@/shared/store'
import {
  useHrdLiveSummaries,
  useMyCohorts,
  useOperatorDashboard,
} from './api/dashboard'
import { DashboardInsight } from './dashboard/DashboardInsight'
import { QuickLinks } from './dashboard/QuickLinks'
import type { CohortBoard } from './dashboard/types'
import { AllCohortsView } from './dashboard/AllCohortsView'
import { CohortDeepDive } from './dashboard/CohortDeepDive'
import { DashboardSkeleton } from './dashboard/dashboardParts'

// 운영 대시보드(관제탑형) — 담당 기수 스코프 실데이터(P0 staging 집계).
// 기본 화면은 담당 기수 전체 비교, 칩/행 클릭으로 기수 딥다이브 전환.
// 담당 기수가 1개면 스위처를 숨기고 바로 딥다이브로 시작한다.

export default function AdminDashboard() {
  usePageHeader('운영 대시보드', '담당 기수의 운영 현황을 한눈에 확인합니다')
  const myCohorts = useMyCohorts()
  const dashboard = useOperatorDashboard(myCohorts.data)
  const hrdLive = useHrdLiveSummaries(myCohorts.data, dashboard.data?.cohorts)
  // 상세 모달로 띄울 기수 id. null이면 전체 비교 화면.
  const [selected, setSelected] = useState<string | null>(null)

  // 소스 우선순위 — 인입큐(staging) 데이터가 있으면 staging, 없으면 HRD-Net 라이브 집계로 채운다.
  const boards = useMemo<CohortBoard[]>(() => {
    const base = dashboard.data?.cohorts ?? []
    return base.map((b) => {
      if (b.hasData) return { ...b, source: 'staging' as const }
      const live = hrdLive.data?.[b.cohortId]
      if (!live) return b
      return {
        ...b,
        hasData: true,
        source: 'hrd-live' as const,
        students: live.students,
        attendance: {
          todayPresent: live.todayPresent,
          todayTotal: live.todayTotal,
          avgRate: live.avgRate,
          weekly: live.weekly,
          todayAbsentees: live.todayAbsentees,
        },
        assessment: null,
        weeklyCheck: null,
        issues: live.issues,
        issueDays: live.issueDays,
        pending: null,
      }
    })
  }, [dashboard.data, hrdLive.data])
  const single = boards.length === 1
  // 담당 1개면 딥다이브를 그대로 노출, 여러 개면 전체 비교 + 기수 클릭 시 상세 모달.
  const modalBoard = single
    ? null
    : (boards.find((b) => b.cohortId === selected) ?? null)

  // HRD 라이브로 채워야 하는 기수(staging 미인입·개강 전 아님)가 있는데 아직 안 오면 대기.
  // staging 기수만 먼저 렌더되고 HRD 기수가 뒤늦게 '뚝' 나타나는 끊김을 막는다.
  const needsHrd = (dashboard.data?.cohorts ?? []).some(
    (b) => !b.hasData && b.status !== 'upcoming',
  )
  const hrdNotReady = needsHrd && hrdLive.data == null && !hrdLive.isError

  // 담당 미배정은 useMyCohorts가 전체 기수로 폴백하므로 여기 도달 = 시스템에 기수 자체가 없음.
  const noCohorts =
    !myCohorts.isPending &&
    !myCohorts.isError &&
    (myCohorts.data?.length ?? 0) === 0
  const dash = dashboard.data

  return (
    <DataBoundary
      isPending={
        myCohorts.isPending ||
        (!!myCohorts.data?.length && dashboard.isPending) ||
        (!!dash && hrdNotReady) ||
        (!noCohorts && !myCohorts.isError && !dashboard.isError && !dash)
      }
      isError={myCohorts.isError || dashboard.isError}
      onRetry={() =>
        myCohorts.isError ? myCohorts.refetch() : dashboard.refetch()
      }
      skeleton={<DashboardSkeleton />}
      errorTitle="대시보드를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {noCohorts ? (
        <div className="p-8">
          <Empty
            icon={<Users />}
            title="등록된 과정·기수가 없어요"
            description="설정 > 과정 관리에서 과정과 기수를 등록하면 운영 현황이 여기에 표시됩니다."
          />
        </div>
      ) : (
        dash && (
          <div className="p-8">
            {/* 날짜·기수 칩 헤더 행은 제거(운영 요구) — 기수 상세는 비교 표 행 클릭으로 진입. */}
            <div>
              {single ? (
                // 담당 1기수도 상단 '오늘 인사이트'를 동일하게 제공(전 매니저 첫인상 통일),
                // 그 아래 해당 기수 상세를 이어서 보여준다.
                <div className="flex flex-col gap-6">
                  <DashboardInsight
                    boards={boards}
                    quarantineCount={dash.quarantineCount}
                    today={dash.today}
                    upcoming={dash.upcoming}
                  />
                  <QuickLinks />
                  <CohortDeepDive
                    board={boards[0]}
                    hrdPending={hrdLive.isPending && hrdLive.isFetching}
                  />
                </div>
              ) : (
                <AllCohortsView
                  boards={boards}
                  quarantineCount={dash.quarantineCount}
                  today={dash.today}
                  upcoming={dash.upcoming}
                  onSelect={(id) => setSelected(id)}
                />
              )}
            </div>

            {/* 기수 상세 모달 — 비교 표/칩에서 기수 클릭 시 */}
            <Modal
              open={!!modalBoard}
              onClose={() => setSelected(null)}
              size="lg"
              title={
                modalBoard
                  ? `${modalBoard.courseName} ${modalBoard.cohortLabel}`
                  : undefined
              }
            >
              {modalBoard && (
                <CohortDeepDive
                  board={modalBoard}
                  hrdPending={hrdLive.isPending && hrdLive.isFetching}
                  hideHeader
                />
              )}
            </Modal>
          </div>
        )
      )}
    </DataBoundary>
  )
}
