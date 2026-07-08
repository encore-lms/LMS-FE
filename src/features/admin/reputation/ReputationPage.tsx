import { useMemo, useState } from 'react'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { AlertTriangle, ArrowRight, Check, Info, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/Select'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { useCourseConfig, useCourseList } from '../api/settings'
import { usePageHeader } from '@/shared/store'
import { ActionModal, type ActionModalSpec } from '../settings/ActionModal'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import {
  useReputation,
  useReputationPush,
  type ReputationPushInput,
} from './api'
import type {
  EndorsementStatus,
  MentorEvalStatus,
  PushTarget,
  ReputationStudent,
} from './types'

const ENDORSEMENT_META: Record<
  EndorsementStatus,
  { label: string; tone: BadgeTone }
> = {
  collected: { label: '수집됨', tone: 'success' },
  not_collected: { label: '미수집', tone: 'neutral' },
  requesting: { label: '요청 중', tone: 'warning' },
}

const MENTOR_EVAL_META: Record<
  MentorEvalStatus,
  { label: string; tone: BadgeTone }
> = {
  recommended: { label: '평가 완료 · 추천', tone: 'success' },
  not_recommended: { label: '평가 완료 · 추천 안 함', tone: 'success' },
  pending: { label: '평가 대기', tone: 'neutral' },
  not_eligible: { label: 'N시간 미달 · 대상 외', tone: 'neutral' },
  in_progress: { label: '평가 진행 중', tone: 'info' },
}

const PUSH_LABEL: Record<PushTarget, string> = {
  instructor: '강사 푸시',
  mentor: '멘토 푸시',
  peer: '동료 푸시',
}

// 평판 관리 (/admin/reputation) — 운영(MANAGER/ADMIN) 신규.
// Figma 1193:6267. 수강생별 평판 수집 현황(강사 추천서·멘토 평가·동료 5축) + 요청 푸시.
// 내부 사용자 전용 — 외부 토큰 미사용. 푸시·일괄 푸시·상세는 별도 시안 미설계 → 토스트 + TODO.
export default function ReputationPage() {
  usePageHeader(
    '평판 관리',
    '수강생별 평판 수집 현황 · 강사·멘토·동료 요청 푸시 · 내부 사용자 전용',
  )
  const { data, isPending, isError, refetch } = useReputation()
  const push = useReputationPush()
  const toast = useToast()
  const [status, setStatus] = useSearchParamState('status', 'all')
  const [q, setQ] = useSearchParamState('q')
  // 푸시 확인 모달(단건·일괄 공용) + 평판 상세 모달.
  const [pushAction, setPushAction] = useState<{
    spec: ActionModalSpec
    result: string
    payload: ReputationPushInput
  } | null>(null)
  const [detailStudent, setDetailStudent] = useState<ReputationStudent | null>(
    null,
  )

  // 과정·기수 스코프 — 전체가 아닌 기수 단위로 조회(운영 요구). 기본은 전체 기수.
  const { data: courses } = useCourseList()
  const [selCourseId, setSelCourseId] = useState<string | null>(null)
  const courseId = selCourseId ?? courses?.[0]?.courseId ?? null
  const { data: courseConfig } = useCourseConfig(courseId)
  const [cohortFilter, setCohortFilter] = useSearchParamState('cohort', 'all')

  const students = useMemo(() => data?.students ?? [], [data])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = students.filter((s) => {
      if (cohortFilter !== 'all' && s.cohortId !== cohortFilter) return false
      if (status === 'missing' && s.pushTargets.length === 0) return false
      if (status === 'complete' && s.pushTargets.length > 0) return false
      if (needle) {
        const hay = `${s.name} ${s.uuid}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    // 이름 가나다순 고정(운영 요구)
    return [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'ko'))
  }, [students, status, q, cohortFilter])

  if (isPending) {
    return <SkeletonListPage kpis={4} columns={6} />
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="평판 현황을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { summary, pushFlows } = data

  const columns: Column<ReputationStudent>[] = [
    {
      key: 'student',
      header: '수강생',
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={s.name} size={28} />
          <div className="min-w-0">
            <p className="text-fg text-[13px] font-semibold">{s.name}</p>
            <p className="text-fg-subtle font-mono text-[11px]">{s.uuid}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'endorsement',
      header: '강사 추천서',
      cell: (s) => (
        <div className="flex flex-col gap-1">
          <StatusBadge
            label={ENDORSEMENT_META[s.endorsementStatus].label}
            tone={ENDORSEMENT_META[s.endorsementStatus].tone}
          />
          <span className="text-fg-subtle text-[11px]">{s.endorsementBy}</span>
        </div>
      ),
    },
    {
      key: 'mentor',
      header: '멘토 평가·추천',
      cell: (s) => (
        <div className="flex flex-col gap-1">
          <StatusBadge
            label={MENTOR_EVAL_META[s.mentorEvalStatus].label}
            tone={MENTOR_EVAL_META[s.mentorEvalStatus].tone}
          />
          <span className="text-fg-subtle text-[11px]">{s.mentorBy}</span>
        </div>
      ),
    },
    {
      key: 'peer',
      header: '동료 5축 (N/M)',
      className: 'w-40',
      cell: (s) => {
        const full = s.peerCount >= s.peerTotal
        return (
          <div className="flex items-center gap-2">
            <div className="bg-surface-muted h-1.5 w-20 overflow-hidden rounded-full">
              <div
                className={full ? 'bg-success h-full' : 'bg-brand h-full'}
                style={{
                  width: `${Math.round((s.peerCount / s.peerTotal) * 100)}%`,
                }}
              />
            </div>
            <span className="text-fg text-[13px] tabular-nums">
              {s.peerCount} / {s.peerTotal}
            </span>
          </div>
        )
      },
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-56',
      cell: (s) => (
        <div className="flex flex-wrap items-center gap-2">
          {s.pushTargets.length === 0 ? (
            <span className="text-success inline-flex items-center gap-1 text-[13px] font-semibold">
              <Check className="h-3.5 w-3.5" />
              완료
            </span>
          ) : (
            s.pushTargets.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() =>
                  setPushAction({
                    spec: {
                      title: `${PUSH_LABEL[t]} 요청`,
                      subtitle:
                        'LMS 알림으로 평판 입력을 요청합니다. 외부 토큰 URL은 사용하지 않습니다.',
                      rows: [
                        { label: '수강생', value: `${s.name} · ${s.uuid}` },
                        { label: '대상', value: PUSH_LABEL[t] },
                        { label: '채널', value: 'LMS 알림' },
                        { label: '처리', value: '요청 후 상태 = 요청 중' },
                      ],
                      confirmLabel: '푸시',
                    },
                    result: `${s.name} ${PUSH_LABEL[t]} 요청을 보냈습니다.`,
                    payload: { kind: 'single', studentId: s.id, target: t },
                  })
                }
                className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] font-semibold"
              >
                <Send className="h-3 w-3" />
                {PUSH_LABEL[t]}
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => setDetailStudent(s)}
            className="text-brand text-[13px] font-semibold hover:underline"
          >
            상세
          </button>
        </div>
      ),
    },
  ]

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
            ...(courseConfig?.cohorts ?? []).map((c) => ({
              value: c.id,
              label: `${c.cohortNo}기`,
            })),
          ]}
          className="h-11"
        />
      </div>

      {/* 히어로 — 수집 현황 + 일괄 푸시 */}
      <div className="bg-brand text-on-color flex flex-col gap-4 rounded-xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[17px] font-bold">
            수강생별 평판 수집 현황과 요청 푸시 추적
          </p>
          <p className="text-on-color/75 mt-2 text-[13px]">
            {summary.cohortLabel} · {summary.students}명
            <span className="ml-2 inline-flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              누락 수강생 {summary.missingStudents}명
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setPushAction({
              spec: {
                title: '누락 일괄 요청 푸시',
                subtitle: `누락 수강생 ${summary.missingStudents}명에게 평판 입력을 일괄 요청합니다.`,
                rows: [
                  { label: '대상', value: `누락 ${summary.missingStudents}명` },
                  { label: '기수', value: summary.cohortLabel },
                  { label: '채널', value: 'LMS 알림' },
                  { label: '처리', value: '강사·멘토·동료 누락 항목별 발송' },
                ],
                confirmLabel: '일괄 푸시',
              },
              result: `누락 ${summary.missingStudents}명에게 요청 푸시를 보냈습니다.`,
              payload: { kind: 'bulk' },
            })
          }
          className="bg-surface text-brand hover:bg-surface/90 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-4 text-[13px] font-semibold transition-colors"
        >
          <Send className="h-4 w-4" />
          일괄 요청 푸시 — 누락 {summary.missingStudents}명
        </button>
      </div>

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

      {/* 필터 — 상태 + 검색(과정·기수는 페이지 상단 셀렉트에서 선택) */}
      <div className="border-border bg-surface mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
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
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="수강생 검색"
          aria-label="수강생 검색"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface h-9 w-52 rounded-lg border px-3 text-sm outline-none"
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

      {/* 푸시 흐름 — 대상별 진입 화면 */}
      <div className="border-border bg-surface mt-6 rounded-xl border p-5">
        <p className="text-fg text-sm font-bold">
          푸시 흐름 — 대상별 진입 화면
        </p>
        <p className="text-fg-muted mt-1 text-xs">
          LMS 알림으로 처리 · 외부 토큰 URL 미사용 · 외부인 입력 흐름 없음
        </p>
        <ul className="mt-3 flex flex-col">
          {pushFlows.map((f) => (
            <li
              key={f.id}
              className="border-divider flex items-center gap-2 border-t py-2.5 text-[13px] first:border-t-0"
            >
              <span className="text-fg font-medium">{f.label}</span>
              {f.route && (
                <span className="text-fg-subtle font-mono text-[12px]">
                  {f.route}
                </span>
              )}
              <ArrowRight className="text-fg-subtle ml-auto h-4 w-4" />
            </li>
          ))}
        </ul>
      </div>

      {/* 평판 수집 정책 — 하단 콜아웃 */}
      <div className="border-info/30 bg-info-bg/50 mt-6 rounded-xl border p-5">
        <p className="text-info inline-flex items-center gap-1.5 text-base font-bold">
          <Info className="h-4 w-4" />
          평판 수집 정책
        </p>
        <ul className="text-info/90 mt-2 flex flex-col gap-1.5 text-[13px] leading-relaxed">
          <li>
            내부 사용자 전용 — 동료 수강생·강사·멘토·매니저만 입력 (외부 현업
            동료 평판 수집 없음)
          </li>
          <li>
            멘토 평가는 N시간 완료 또는 운영자 조기 종료 팀에 대해서만 수집 대상
          </li>
          <li>푸시는 LMS 알림으로 처리 · 외부 토큰 URL 미사용</li>
        </ul>
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
      <Modal
        open={!!detailStudent}
        onClose={() => setDetailStudent(null)}
        title={detailStudent ? `${detailStudent.name} 평판 상세` : ''}
      >
        {detailStudent && (
          <div className="flex flex-col gap-4">
            <p className="text-fg-subtle font-mono text-xs">
              {detailStudent.uuid}
            </p>
            <div className="border-border rounded-xl border p-4">
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-fg-muted">강사 추천서</dt>
                  <dd className="flex items-center gap-2">
                    <StatusBadge
                      label={
                        ENDORSEMENT_META[detailStudent.endorsementStatus].label
                      }
                      tone={
                        ENDORSEMENT_META[detailStudent.endorsementStatus].tone
                      }
                    />
                    <span className="text-fg-subtle text-xs">
                      {detailStudent.endorsementBy}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-fg-muted">멘토 평가·추천</dt>
                  <dd className="flex items-center gap-2">
                    <StatusBadge
                      label={
                        MENTOR_EVAL_META[detailStudent.mentorEvalStatus].label
                      }
                      tone={
                        MENTOR_EVAL_META[detailStudent.mentorEvalStatus].tone
                      }
                    />
                    <span className="text-fg-subtle text-xs">
                      {detailStudent.mentorBy}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-fg-muted">동료 5축</dt>
                  <dd className="text-fg font-semibold tabular-nums">
                    {detailStudent.peerCount} / {detailStudent.peerTotal}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-fg-muted">누락 푸시 대상</dt>
                  <dd className="text-fg text-right">
                    {detailStudent.pushTargets.length === 0
                      ? '없음 (완료)'
                      : detailStudent.pushTargets
                          .map((t) => PUSH_LABEL[t])
                          .join(' · ')}
                  </dd>
                </div>
              </dl>
            </div>
            <p className="text-fg-subtle text-xs">
              상세 평판 항목·입력 이력은 BE(P0_25) 연동 후 제공됩니다.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
