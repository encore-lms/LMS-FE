import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type {
  QuestionType,
  QuizAnswerChangeItem,
  QuizAnswerRow,
  QuizAnswerRowStatus,
} from '@/shared/types'
import {
  useAnswerImpact,
  useQuizAnswers,
  useSaveAnswerChanges,
} from '../api/quizzes'

// 행 상태 4분기 — Figma 배지 원문(정상/확인 필요/검토/비활성 후보).
const STATUS_META: Record<
  QuizAnswerRowStatus,
  { label: string; tone: BadgeTone }
> = {
  normal: { label: '정상', tone: 'success' },
  needs_check: { label: '확인 필요', tone: 'warning' },
  review: { label: '검토', tone: 'info' },
  deactivate_candidate: { label: '비활성 후보', tone: 'danger' },
}

// 유형 라벨 — 공유 QuestionType 기준(강사 meta.ts 미의존: 운영 작업은 instructor 폴더 무접촉).
const TYPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: '객관식',
  short_answer: '단답형',
  fill_blank: '빈칸',
  essay: '서술형',
}

// 영향 범위 4종 — Figma 패널 원문(영향 계산 전 정적 안내, 계산 후엔 응답 값).
const AFFECTED_AREAS = [
  '학생 결과 화면 점수/피드백',
  '퀴즈 제출 현황 평균 점수',
  '마일리지 지급 후보',
  '증명서 학습 평가 요약',
]

// 필 공통 — 검토 상세 선례와 동일 토큰.
const pill =
  'rounded-md border border-border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'

/**
 * 변경안 직렬화 — 영향 계산 GET 파라미터 + 신선도 판정 공용.
 * 사유(reason)는 영향 계산과 무관해 제외 — 사유만 입력해도 계산 결과는 유효 유지.
 */
function serializeAnswerChanges(changes: QuizAnswerChangeItem[]): string {
  return JSON.stringify(
    [...changes]
      .sort((a, b) => a.questionId.localeCompare(b.questionId))
      .map(({ questionId, afterAnswerKey, maxPoints }) => ({
        questionId,
        afterAnswerKey,
        maxPoints,
      })),
  )
}

// 우측 패널 변경안 편집기 — 행 선택 시 key={questionId}로 리셋(인라인 편집 대신 패널 집중형).
function ChangeEditor({
  row,
  pending,
  busy,
  onApply,
  onCancel,
}: {
  row: QuizAnswerRow
  pending?: QuizAnswerChangeItem
  busy: boolean
  onApply: (item: QuizAnswerChangeItem) => void
  onCancel: () => void
}) {
  const [afterKey, setAfterKey] = useState(
    pending?.afterAnswerKey ?? row.proposedAnswerKey ?? row.currentAnswerKey,
  )
  const [maxPoints, setMaxPoints] = useState(
    String(pending?.maxPoints ?? row.maxPoints),
  )
  const [reason, setReason] = useState(pending?.reason ?? '')
  const points = Number(maxPoints)
  const valid =
    afterKey.trim().length > 0 &&
    reason.trim().length > 0 &&
    Number.isInteger(points) &&
    points > 0

  return (
    <div className="mt-6 flex flex-col gap-4">
      <p className="text-fg text-xs font-semibold">
        문항 {row.questionNo} 변경안 ({TYPE_LABEL[row.type]} · 현재 정답{' '}
        {row.currentAnswerKey})
      </p>
      <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-3">
        <input
          value={afterKey}
          onChange={(e) => setAfterKey(e.target.value)}
          aria-label="변경안"
          placeholder="변경 정답 입력"
          className="border-border bg-surface-muted focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-md border px-3 py-2 text-sm outline-none"
        />
        <input
          value={maxPoints}
          onChange={(e) => setMaxPoints(e.target.value)}
          type="number"
          min={1}
          aria-label="배점"
          className="border-border bg-surface-muted focus:border-brand text-fg w-full rounded-md border px-3 py-2 text-sm outline-none"
        />
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        aria-label="변경 사유"
        placeholder="변경 사유 입력"
        className="border-border bg-surface-muted focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-md border p-3 text-sm outline-none"
      />
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className={cn(pill, 'bg-surface-muted text-fg-muted hover:text-fg')}
        >
          취소
        </button>
        {/* 사유 미입력 시 저장 불가(P0-ADM-QUIZ-006) — 일괄 목록 반영도 동일 차단 */}
        <button
          type="button"
          disabled={!valid || busy}
          onClick={() =>
            onApply({
              questionId: row.questionId,
              afterAnswerKey: afterKey.trim(),
              maxPoints: points,
              reason: reason.trim(),
            })
          }
          className={cn(pill, 'bg-brand text-on-color hover:bg-brand/90 px-4')}
        >
          저장
        </button>
      </div>
    </div>
  )
}

// 운영 — 정답 관리 (/admin/quizzes/:quizId/answers, Figma 1515:10493, P1)
// 흐름(P0-ADM-QUIZ-006): 변경안 입력 → 저장 전 영향 계산 → 사유 입력 → 변경 저장(자동 재채점+감사 로그).
// 독립 [재채점] 버튼 없음 — 재채점은 변경 저장의 결과로만 실행(P0_18 금지 계약).
export default function AnswersPage() {
  const { quizId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  usePageHeader('정답 관리', '/admin/quizzes/:quizId/answers')

  const { data, isPending, isError, refetch } = useQuizAnswers(quizId)
  const save = useSaveAnswerChanges(quizId)

  // 일괄 변경 목록 — 패널 '저장'으로 로컬 반영, 헤더 '변경 저장'으로 일괄 커밋.
  // null = 미초기화(서버 변경 후보를 1회 가져온다 — 사유는 비워 입력을 강제).
  const [changes, setChanges] = useState<Record<
    string,
    QuizAnswerChangeItem
  > | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // 영향 계산 트리거 — 버튼 클릭 시점의 변경안 직렬화 키(없으면 계산 전).
  const [impactKey, setImpactKey] = useState<string | null>(null)

  useEffect(() => {
    if (!data || changes !== null) return
    const init: Record<string, QuizAnswerChangeItem> = {}
    for (const row of data.rows) {
      if (row.proposedAnswerKey !== null) {
        init[row.questionId] = {
          questionId: row.questionId,
          afterAnswerKey: row.proposedAnswerKey,
          maxPoints: row.maxPoints,
          reason: '',
        }
      }
    }
    setChanges(init)
  }, [data, changes])

  const changeList = useMemo(() => Object.values(changes ?? {}), [changes])
  const currentKey = serializeAnswerChanges(changeList)
  const impact = useAnswerImpact(quizId, impactKey)
  // 변경안이 계산 시점과 동일할 때만 결과 신선 — 변경안을 고치면 저장이 다시 막힌다.
  const impactFresh = impactKey === currentKey && !!impact.data

  if (isPending) {
    return <div className="text-fg-muted p-8">정답 관리를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="정답 관리를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const rows = data.rows
  const selectedRow = rows.find((r) => r.questionId === selectedId) ?? null
  const deactivateCount = rows.filter(
    (r) => r.status === 'deactivate_candidate',
  ).length
  const allReasonsFilled =
    changeList.length > 0 && changeList.every((c) => c.reason.trim().length > 0)
  const canCompute = changeList.length > 0 && !impact.isFetching
  const canSave = impactFresh && allReasonsFilled && !save.isPending

  const pendingFor = (row: QuizAnswerRow) => changes?.[row.questionId]

  const proposalLabel = (row: QuizAnswerRow) => {
    if (row.status === 'deactivate_candidate') return '삭제'
    return (
      pendingFor(row)?.afterAnswerKey ??
      row.proposedAnswerKey ??
      row.currentAnswerKey
    )
  }

  const applyChange = (item: QuizAnswerChangeItem) => {
    setChanges((prev) => ({ ...(prev ?? {}), [item.questionId]: item }))
    toast.info(
      `문항 ${selectedRow?.questionNo ?? ''} 변경안 반영 — 헤더 '변경 저장'으로 일괄 커밋돼요`,
    )
  }

  const saveAll = () => {
    save.mutate(
      { changes: changeList },
      {
        onSuccess: (res) => {
          toast.success(
            `정답/배점 변경 저장 — 영향 제출 ${res.reGradedSubmissionCount}건 자동 재채점, 진행 중 응시 ${res.inProgressAttemptCount}건 제외`,
          )
          // 재조회 데이터로 로컬 변경 목록 재초기화(effect가 changes === null일 때 다시 채움).
          setChanges(null)
          setSelectedId(null)
          setImpactKey(null)
        },
        onError: () =>
          toast.danger('변경 저장에 실패했어요 — 잠시 후 다시 시도해 주세요.'),
      },
    )
  }

  const columns: Column<QuizAnswerRow>[] = [
    {
      key: 'no',
      header: '문항',
      cell: (r) => <span className="text-fg font-bold">{r.questionNo}</span>,
      className: 'w-14',
    },
    {
      key: 'type',
      header: '유형',
      cell: (r) => (
        <span className="text-fg-muted text-xs font-medium">
          {TYPE_LABEL[r.type]}
        </span>
      ),
      className: 'w-24',
    },
    {
      key: 'current',
      header: '현재 정답',
      cell: (r) => (
        <span className="text-fg font-bold">{r.currentAnswerKey}</span>
      ),
    },
    {
      key: 'proposed',
      header: '변경안',
      cell: (r) => (
        <span className="text-fg font-bold">{proposalLabel(r)}</span>
      ),
    },
    {
      key: 'affected',
      header: '영향',
      cell: (r) => (
        <span className="text-fg-muted text-xs font-medium">
          {r.affectedCount > 0 ? `${r.affectedCount}명` : '없음'}
        </span>
      ),
      className: 'w-20',
    },
    {
      key: 'status',
      header: '상태',
      cell: (r) => (
        <StatusBadge
          label={STATUS_META[r.status].label}
          tone={STATUS_META[r.status].tone}
        />
      ),
      className: 'w-28',
    },
  ]

  // 패널 요약 — 계산 후엔 응답 summary, 계산 전엔 선택 행 기준 로컬 미리보기.
  const selectedPending = selectedRow ? pendingFor(selectedRow) : undefined
  const localSummary =
    selectedRow &&
    (selectedRow.status === 'deactivate_candidate'
      ? `문항 ${selectedRow.questionNo}은 비활성(삭제) 후보예요 — ${selectedRow.affectedCount}명 제출에 영향이 있어요.`
      : selectedPending
        ? `문항 ${selectedRow.questionNo} 정답 ${selectedRow.currentAnswerKey} → ${selectedPending.afterAnswerKey} 변경 시 ${selectedRow.affectedCount}명 점수가 변동됩니다.`
        : `문항 ${selectedRow.questionNo}은 변경안이 없어요 — 아래에서 변경안을 입력하세요.`)
  const summary = impactFresh
    ? impact.data?.scoreChangeSummary
    : (localSummary ??
      '문항 행을 선택해 변경안을 편집하고, 저장 전 영향 계산을 실행하세요.')

  return (
    <div className="p-8">
      {/* 액션 바 — 뒤로가기 / 영향 계산(amber) / 변경 저장(brand) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/quizzes')}
          className={cn(pill, 'bg-surface-muted text-fg-muted hover:text-fg')}
        >
          <ArrowLeft className="mr-1 inline h-3 w-3" /> 퀴즈 운영
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canCompute}
            onClick={() => setImpactKey(currentKey)}
            className={cn(
              pill,
              'bg-warning-bg text-warning hover:bg-warning-bg/70',
            )}
          >
            {impact.isFetching ? '영향 계산 중…' : '저장 전 영향 계산'}
          </button>
          {/* 영향 계산 전·사유 미입력 시 비활성(P0-ADM-QUIZ-006 — 운영 원칙 배너 근거) */}
          <button
            type="button"
            disabled={!canSave}
            onClick={saveAll}
            className={cn(
              pill,
              'bg-brand text-on-color hover:bg-brand/90 px-4',
            )}
          >
            변경 저장
          </button>
        </div>
      </div>

      {/* KPI 5종 — 변경 후보는 로컬 일괄 목록 + 비활성 후보 합산 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="대상 문제"
          value={data.kpi.totalQuestions}
          hint={`객관식 ${data.kpi.multipleChoiceCount} · 단답형 ${data.kpi.shortAnswerCount}`}
        />
        <KpiCard
          label="변경 후보"
          value={changeList.length + deactivateCount}
          hint="정답/배점 수정"
        />
        <KpiCard
          label="영향 제출"
          value={data.kpi.affectedSubmissions}
          hint="기존 결과 재계산"
        />
        <KpiCard
          label="지급 후보"
          value={data.kpi.payoutCandidates}
          hint="점수 기준 영향"
        />
        <KpiCard label="감사 로그" value="필수" hint="저장 시 자동 기록" />
      </div>

      {/* 2컬럼 — 좌 정답 테이블 / 우 재채점 영향 패널 */}
      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.questionId}
          onRowClick={(r) => setSelectedId(r.questionId)}
          rowClassName={(r) =>
            r.questionId === selectedId ? 'bg-accent-bg/50' : ''
          }
          empty="대상 문제가 없습니다"
        />

        <section className="border-border bg-surface rounded-xl border p-5">
          <h2 className="text-fg text-lg font-bold">재채점 영향</h2>
          <p className="text-fg-muted mt-3 text-sm leading-relaxed">
            {summary}
          </p>
          {impactFresh && impact.data && (
            <p className="text-fg-subtle mt-2 text-xs">
              진행 중 응시 {impact.data.inProgressAttemptExcluded}건은
              재채점에서 제외돼요 · 지급 후보 {impact.data.payoutCandidateCount}
              건
            </p>
          )}
          {impact.isError && (
            <p className="text-danger mt-2 text-xs">
              영향 계산에 실패했어요 — 다시 실행해 주세요.
            </p>
          )}

          <p className="text-fg mt-5 text-xs font-semibold">영향 범위</p>
          <ul className="text-fg-muted mt-2 flex flex-col gap-1.5 text-sm">
            {(impactFresh && impact.data
              ? impact.data.affectedAreas
              : AFFECTED_AREAS
            ).map((area) => (
              <li key={area}>- {area}</li>
            ))}
          </ul>

          {selectedRow ? (
            selectedRow.status === 'deactivate_candidate' ? (
              // TODO: 문항 비활성(삭제) 처리 — DTO QuizAnswerChangeRequest에 비활성 계약이 없어
              // BE 확정 대기. 변경 저장 대상에서 제외하고 안내만 표시한다.
              <p className="text-fg-muted bg-surface-muted mt-6 rounded-md p-3 text-xs leading-relaxed">
                비활성(삭제) 후보는 BE 비활성 계약 확정 후 지원돼요 — 이번 변경
                저장 대상에서 제외됩니다.
              </p>
            ) : (
              <ChangeEditor
                key={selectedRow.questionId}
                row={selectedRow}
                pending={selectedPending}
                busy={save.isPending}
                onApply={applyChange}
                onCancel={() => setSelectedId(null)}
              />
            )
          ) : (
            <p className="text-fg-subtle mt-6 text-xs">
              문항 행을 선택하면 변경안과 사유를 입력할 수 있어요.
            </p>
          )}
        </section>
      </div>

      {/* 운영 원칙 배너 — Figma 원문. 보더는 Figma amber 틴트(#fde68a)의 토큰 근사(warning/30). */}
      <div className="border-warning/30 bg-warning-bg mt-8 rounded-xl border p-5">
        <p className="text-warning text-sm font-bold">운영 원칙</p>
        <p className="text-warning mt-2 text-sm">
          정답·배점 변경은 저장 전 영향 계산을 먼저 수행하고, 저장 후 재채점
          작업과 감사 로그를 남깁니다.
        </p>
      </div>
    </div>
  )
}
