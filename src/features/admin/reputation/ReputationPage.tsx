import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { Select } from '@/components/ui/Select'
import { DataTable } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { useCourseConfig, useCourseList } from '../api/settings'
import { useMyCohorts } from '../api/dashboard'
import { usePageHeader } from '@/shared/store'
import { ActionModal } from '../settings/ActionModal'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { useReputation, useReputationPush } from './api'
import { type ReputationPushAction } from './reputationMeta'
import { buildReputationColumns } from './reputationColumns'
import { ReputationHero } from './ReputationHero'
import { ReputationDetailModal } from './ReputationDetailModal'
import type { ReputationStudent } from './types'

// 평판 관리 (/admin/reputation) — 운영(MANAGER/ADMIN) 신규.
// Figma 1193:6267. 수강생별 평판 수집 현황(강사 추천서·멘토 평가·동료 5축) + 요청 푸시.
export default function ReputationPage() {
  usePageHeader(
    '평판 관리',
    '수강생별 평판 수집 현황을 확인하고 강사·멘토·동료에게 평가를 요청합니다',
  )
  const push = useReputationPush()
  const toast = useToast()
  const [status, setStatus] = useSearchParamState('status', 'all')
  const [mentorFilter, setMentorFilter] = useSearchParamState('mentor', 'all')
  const [q, setQ] = useSearchParamState('q')
  // 푸시 확인 모달(단건·일괄 공용) + 평판 상세 모달.
  const [pushAction, setPushAction] = useState<ReputationPushAction | null>(
    null,
  )
  const [detailStudent, setDetailStudent] = useState<ReputationStudent | null>(
    null,
  )

  // 과정·기수 스코프 — 전체가 아닌 기수 단위로 조회(운영 요구).
  const { data: courses } = useCourseList()
  const [selCourseId, setSelCourseId] = useState<string | null>(null)
  const courseId = selCourseId ?? courses?.[0]?.courseId ?? null
  const { data: courseConfig } = useCourseConfig(courseId)
  const [cohortFilter, setCohortFilter] = useSearchParamState('cohort', 'all')

  // 담당 기수 우선(운영 요구) — 옵션 목록에서 담당 기수를 맨 위로 정렬하고,
  // 첫 진입(URL에 cohort 미지정)엔 담당 첫 기수를 기본 선택한다.
  const { data: myCohorts } = useMyCohorts()
  const myCohortIds = useMemo(
    () => new Set((myCohorts ?? []).map((r) => r.cohortId)),
    [myCohorts],
  )
  const cohortOptions = useMemo(() => {
    const cs = courseConfig?.cohorts ?? []
    return [
      ...cs.filter((c) => myCohortIds.has(c.id)),
      ...cs.filter((c) => !myCohortIds.has(c.id)),
    ]
  }, [courseConfig, myCohortIds])
  const initRef = useRef(false)
  const [scopeReady, setScopeReady] = useState(false)
  useEffect(() => {
    if (initRef.current || !myCohorts || !courseConfig) return
    initRef.current = true
    setScopeReady(true)
    if (cohortFilter !== 'all') return // URL로 기수를 지정해 들어온 경우 존중
    const first = cohortOptions.find((c) => myCohortIds.has(c.id))
    if (first) setCohortFilter(first.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 첫 로드 1회만 적용
  }, [myCohorts, courseConfig])

  // 조회 범위 — 기수 선택 시 그 기수, '전체 기수'면 선택 과정의 기수 전체.
  // 서버가 이 범위로 요약(KPI·누락 수)까지 집계하므로 표와 숫자가 항상 같은 모수를 본다.
  const scopeCohortIds = useMemo(() => {
    if (!scopeReady) return undefined
    if (cohortFilter !== 'all') return [cohortFilter]
    return cohortOptions.map((c) => c.id)
  }, [scopeReady, cohortFilter, cohortOptions])

  const { data, isPending, isError, refetch } = useReputation(scopeCohortIds)

  const students = useMemo(() => data?.students ?? [], [data])

  // 멘토 필터 옵션 — 현재 조회 범위에 실제 존재하는 담당 멘토(미배정 '-' 제외) 가나다순.
  const mentorOptions = useMemo(() => {
    const names = new Set<string>()
    for (const s of students) {
      if (s.mentorBy && s.mentorBy !== '-') names.add(s.mentorBy)
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'ko'))
  }, [students])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = students.filter((s) => {
      if (cohortFilter !== 'all' && s.cohortId !== cohortFilter) return false
      if (status === 'missing' && s.pushTargets.length === 0) return false
      if (status === 'complete' && s.pushTargets.length > 0) return false
      if (mentorFilter !== 'all' && s.mentorBy !== mentorFilter) return false
      if (needle) {
        const hay = `${s.name} ${s.uuid}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    // 이름 가나다순 고정(운영 요구)
    return [...list].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', 'ko'),
    )
  }, [students, status, q, cohortFilter, mentorFilter])

  const summary = data?.summary

  const columns = buildReputationColumns({
    endorsementDegraded: data?.endorsementDegraded,
    peerDegraded: data?.peerDegraded,
    onPushAction: setPushAction,
    onDetail: setDetailStudent,
  })

  return (
    <div className="p-8">
      {/* 과정/기수 선택 — 과정·기수·교과목과 동일한 상단 셀렉트 규격 */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Select
          aria-label="과정 선택"
          value={courseId}
          onChange={(v) => {
            setSelCourseId(v)
            setCohortFilter('all')
          }}
          options={(courses ?? []).map((c) => ({
            value: c.courseId,
            label: c.title,
          }))}
          placeholder="등록 과정 없음"
          className="h-11"
        />
        <Select
          aria-label="기수 필터"
          value={cohortFilter}
          onChange={(v) => setCohortFilter(v)}
          options={[
            { value: 'all', label: '전체 기수' },
            ...cohortOptions.map((c) => ({
              value: c.id,
              label: myCohortIds.has(c.id)
                ? `${c.cohortNo}기 (담당)`
                : `${c.cohortNo}기`,
            })),
          ]}
          className="h-11"
        />
      </div>

      {/* 기수가 없는 과정 — 조회 범위가 비어 서버를 부르지 않으므로 스켈레톤 대신 명시적으로 알린다. */}
      {scopeCohortIds?.length === 0 && (
        <Empty
          title="이 과정에 기수가 없어요"
          description="기수를 먼저 만들면 평판 수집 현황을 볼 수 있어요."
        />
      )}

      <DataBoundary
        isPending={isPending && scopeCohortIds?.length !== 0}
        isError={isError || (!data && scopeCohortIds?.length !== 0)}
        onRetry={refetch}
        skeleton={<SkeletonListPage kpis={4} columns={6} className="" />}
        errorTitle="평판 현황을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {summary && (
          <>
            {/* 히어로 — 수집 현황 + 일괄 푸시 */}
            <ReputationHero summary={summary} onPushAction={setPushAction} />

            {/* KPI 4종 */}
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard
                label="수강생"
                value={summary.students}
                hint={summary.cohortLabel}
              />
              <KpiCard
                label="강사 추천서"
                value={summary.endorsements}
                hint={summary.endorsementsHint}
                tone="success"
              />
              <KpiCard
                label="멘토 평가·추천"
                value={summary.mentorEval}
                hint={summary.mentorEvalHint}
                tone="brand"
              />
              <KpiCard
                label="동료 5축"
                value={summary.peerAxes}
                hint={summary.peerAxesHint}
                tone="accent"
              />
            </div>

            {/* 필터 — 상태 + 멘토 + 검색(과정·기수는 페이지 상단 셀렉트에서 선택) */}
            <div className="border-border bg-surface mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  aria-label="상태 필터"
                  value={status}
                  onChange={(v) => setStatus(v)}
                  options={[
                    { value: 'all', label: '상태 전체' },
                    { value: 'missing', label: '누락 있음' },
                    { value: 'complete', label: '완료' },
                  ]}
                  className="h-9"
                />
                <Select
                  aria-label="멘토 필터"
                  value={mentorFilter}
                  onChange={(v) => setMentorFilter(v)}
                  options={[
                    { value: 'all', label: '멘토 전체' },
                    ...mentorOptions.map((m) => ({ value: m, label: m })),
                  ]}
                  className="h-9"
                />
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="수강생 검색"
                aria-label="수강생 검색"
                className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface h-9 w-52 rounded-lg border px-3 text-sm outline-none focus-visible:shadow-none"
              />
            </div>

            {/* 평판 수집 그리드 */}
            <div className="mt-4">
              <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(s) => s.id}
                empty="조건에 맞는 수강생이 없어요"
              />
              <div className="text-fg-subtle mt-3 text-xs">
                총 {summary.students}명 · 누락 있음 {summary.missingStudents}명
              </div>
            </div>

            {/* 푸시 확인 모달 (Figma 푸시 확인 1306:8113 / 결과 1306:8149) */}
            <ActionModal
              spec={pushAction?.spec ?? null}
              onClose={() => setPushAction(null)}
              onConfirm={(memo) => {
                if (!pushAction) return
                const { result, payload } = pushAction
                push.mutate(
                  { ...payload, memo },
                  {
                    onSuccess: () => {
                      setPushAction(null)
                      toast.success(result)
                    },
                    onError: () => {
                      setPushAction(null)
                      toast.danger(
                        '요청 푸시에 실패했어요. 잠시 후 다시 시도해 주세요.',
                      )
                    },
                  },
                )
              }}
              pending={push.isPending}
            />

            {/* 평판 상세 모달 (Figma 평판 상세 1306:8078) — 행 데이터 기반 읽기 전용 */}
            <ReputationDetailModal
              student={detailStudent}
              peerDegraded={data?.peerDegraded}
              onClose={() => setDetailStudent(null)}
            />
          </>
        )}
      </DataBoundary>
    </div>
  )
}
