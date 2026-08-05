import { useState } from 'react'
import { Check, Users } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { SearchInput } from '@/components/ui/SearchInput'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import {
  MemberEvalCard,
  type EvalCardState,
} from '@/components/evaluation/MemberEvalCard'
import { useSaveStaffStudentEval, useStaffStudentEvals } from './api'
import type { StaffStudentEvalSheet } from './types'

// 수강생 평가 탭(2026-08-06 신설) — 강사·매니저가 담당 기수 전체 수강생을
// 멘토·상호평가와 같은 공용 4축 카드로 평가한다. 강사 허브도 이 pane 을 그대로 소비(과정 홈 선례).
// 기수 규모(20~30명)라 멘토식 일괄 제출 대신 수강생별 개별 저장(재저장=덮어쓰기), 코멘트 선택.

type Scores4 = (number | null)[]

const toUiScores = (scores?: number[] | null): Scores4 =>
  Array.from({ length: 4 }, (_, i) => {
    const v = scores?.[i]
    return v != null && v >= 1 && v <= 5 ? v : null
  })

const isComplete = (scores: Scores4) => scores.every((s) => s != null)

export function StudentEvalPane({ cohortId }: { cohortId: string }) {
  const { data, isPending, isError, refetch } = useStaffStudentEvals(cohortId)
  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="수강생 평가를 불러오는 중…"
      errorTitle="수강생 평가를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
    >
      {data &&
        (data.students.length === 0 ? (
          <Empty
            icon={<Users className="h-6 w-6" />}
            title="평가할 수강생이 없어요"
            description="이 기수에 배정된 수강생이 없습니다."
          />
        ) : (
          // 기수 전환 시 입력 상태를 새로 초기화한다(시트 데이터 기준).
          <EvalSheet key={cohortId} cohortId={cohortId} sheet={data} />
        ))}
    </DataBoundary>
  )
}

function EvalSheet({
  cohortId,
  sheet,
}: {
  cohortId: string
  sheet: StaffStudentEvalSheet
}) {
  const toast = useToast()
  const saveM = useSaveStaffStudentEval(cohortId)
  const [query, setQuery] = useState('')
  // 입력 상태 — 서버 저장분으로 초기화(평가자 본인 시트), 이후 로컬 편집.
  const [scores, setScores] = useState<Record<string, Scores4>>(() =>
    Object.fromEntries(
      sheet.students.map((s) => [s.studentId, toUiScores(s.scores)]),
    ),
  )
  const [comments, setComments] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      sheet.students.map((s) => [s.studentId, s.comment ?? '']),
    ),
  )
  // 저장 라벨 — 서버 응답의 updatedAtLabel 을 학생별로 갱신(초기값은 시트).
  const [savedAt, setSavedAt] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(
      sheet.students.map((s) => [s.studentId, s.updatedAtLabel]),
    ),
  )
  const [savingId, setSavingId] = useState<string | null>(null)

  const doneCount = sheet.students.filter((s) =>
    isComplete(scores[s.studentId]),
  ).length

  const q = query.trim().toLowerCase()
  const visible = sheet.students.filter(
    (s) => !q || s.name.toLowerCase().includes(q),
  )

  // 카드 상태 — 저장 여부 기준(멘토·상호평가의 순차 상태와 달리 개별 저장이라 저장됨/미저장만 가른다).
  const stateOf = (studentId: string): EvalCardState =>
    savedAt[studentId] ? 'done' : 'active'

  const save = (studentId: string, name: string) => {
    const s = scores[studentId]
    if (!isComplete(s)) return
    setSavingId(studentId)
    saveM.mutate(
      {
        studentId,
        scores: s.map((v) => v ?? 0),
        comment: comments[studentId] ?? '',
      },
      {
        onSuccess: (entry) => {
          setSavedAt((prev) => ({
            ...prev,
            [studentId]: entry.updatedAtLabel,
          }))
          toast.success(`${name} 님 평가를 저장했습니다`)
        },
        onError: () =>
          toast.danger('평가 저장에 실패했어요. 잠시 후 다시 시도해 주세요.'),
        onSettled: () => setSavingId(null),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 진행 헤더 — 저장 기준 카운트 + 검색 */}
      <section className="bg-surface border-border flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[14px] font-bold">
            수강생 평가 · 4축(기술/기술기여 · 소통·협업·팀워크 · 문제해결 ·
            책임감)
          </span>
          <span className="text-fg-muted text-[12px]">
            수강생별로 4축 점수를 매기고 저장하세요(코멘트 선택). 재저장하면
            마지막 저장본이 유효합니다. 평가는 강사·매니저 각자 따로 저장됩니다.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-brand/10 text-brand flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold">
            <Check className="h-3.5 w-3.5" />
            저장 {Object.values(savedAt).filter(Boolean).length} /{' '}
            {sheet.studentCount}명
          </span>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="수강생 이름 검색"
            ariaLabel="수강생 검색"
          />
        </div>
      </section>

      {visible.length === 0 ? (
        <Empty
          icon={<Users className="h-6 w-6" />}
          title="검색 결과가 없어요"
          description="다른 이름으로 검색해 보세요."
        />
      ) : (
        visible.map((s, index) => {
          const complete = isComplete(scores[s.studentId])
          const saving = savingId === s.studentId
          return (
            <MemberEvalCard
              key={s.studentId}
              person={{ id: s.studentId, name: s.name, roleLabel: '수강생' }}
              index={index}
              scores={scores[s.studentId]}
              comment={comments[s.studentId] ?? ''}
              state={stateOf(s.studentId)}
              commentRequired={false}
              commentPlaceholder="선택 코멘트: 수업·과제에서 관찰한 강점과 근거를 적어주세요."
              onScore={(axisIndex, value) =>
                setScores((prev) => ({
                  ...prev,
                  [s.studentId]: prev[s.studentId].map((v, i) =>
                    i === axisIndex ? value : v,
                  ),
                }))
              }
              onComment={(comment) =>
                setComments((prev) => ({ ...prev, [s.studentId]: comment }))
              }
              footer={
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-fg-subtle text-[11px]">
                    {savedAt[s.studentId]
                      ? `저장됨 · ${savedAt[s.studentId]}`
                      : '아직 저장 전'}
                  </span>
                  <button
                    type="button"
                    onClick={() => save(s.studentId, s.name)}
                    disabled={!complete || saving}
                    title={
                      complete ? undefined : '4개 축 점수를 모두 입력해 주세요'
                    }
                    className={cn(
                      'rounded-[10px] px-4 py-2 text-[13px] font-bold',
                      complete && !saving
                        ? 'bg-brand text-on-color hover:bg-brand/90'
                        : 'bg-surface-muted text-fg-subtle cursor-not-allowed',
                    )}
                  >
                    {saving
                      ? '저장 중…'
                      : savedAt[s.studentId]
                        ? '재저장'
                        : '저장'}
                  </button>
                </div>
              }
            />
          )
        })
      )}
      {/* 하단 진행 요약 — 긴 목록 끝에서도 진행 상황이 보인다. */}
      <div className="text-fg-subtle pb-2 text-center text-[12px]">
        입력 완료 {doneCount} / {sheet.studentCount}명 · 저장{' '}
        {Object.values(savedAt).filter(Boolean).length} / {sheet.studentCount}명
      </div>
    </div>
  )
}
