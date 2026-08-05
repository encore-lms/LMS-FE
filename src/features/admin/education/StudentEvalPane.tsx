import { useEffect, useState, type ReactNode } from 'react'
import { Check, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { ListToolbar } from '@/components/ui/ListToolbar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { MemberEvalCard } from '@/components/evaluation/MemberEvalCard'
import { useSaveStaffStudentEval, useStaffStudentEvals } from './api'
import type { StaffStudentEvalSheet } from './types'

// 수강생 평가 탭(2026-08-06 신설 → 같은 날 코멘트/추천 병합 개편) — 강사·매니저가 담당 기수
// 전체 수강생을 멘토·상호평가와 같은 공용 4축 카드로 평가한다. 강사 허브도 이 pane 을 소비(과정 홈 선례).
// 기수 규모(20~30명)라 카드 전부 펼침 대신 강사 추천서 화면의 '작성 대기' UI를 가져왔다 —
// 접힌 행 리스트 → 행의 '수강생 평가' 클릭 시 그 아래 4축 카드가 슬라이드로 열린다.
// 저장은 수강생별 개별(재저장=덮어쓰기), 코멘트 선택.
// 강사 전용 추천서 기능은 주입 슬롯(rowExtra·panelExtra)로 강사 feature 가 붙인다
// (교차 feature 임포트 린트 회피 — 기록실 검토 render-prop 선례).

type Scores4 = (number | null)[]

const toUiScores = (scores?: number[] | null): Scores4 =>
  Array.from({ length: 4 }, (_, i) => {
    const v = scores?.[i]
    return v != null && v >= 1 && v <= 5 ? v : null
  })

const isComplete = (scores: Scores4) => scores.every((s) => s != null)

export interface EvalRowStudent {
  id: string
  name: string
}

export function StudentEvalPane({
  cohortId,
  rowExtra,
  panelExtra,
}: {
  cohortId: string
  /** 행 우측 추가 요소(강사: 추천서 상태 배지·보기) — 평가 버튼 왼쪽에 렌더. */
  rowExtra?: (student: EvalRowStudent) => ReactNode
  /** 펼친 패널에서 평가 카드 아래 렌더(강사: 추천서 작성 섹션). */
  panelExtra?: (student: EvalRowStudent) => ReactNode
}) {
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
          <EvalSheet
            key={cohortId}
            cohortId={cohortId}
            sheet={data}
            rowExtra={rowExtra}
            panelExtra={panelExtra}
          />
        ))}
    </DataBoundary>
  )
}

function EvalSheet({
  cohortId,
  sheet,
  rowExtra,
  panelExtra,
}: {
  cohortId: string
  sheet: StaffStudentEvalSheet
  rowExtra?: (student: EvalRowStudent) => ReactNode
  panelExtra?: (student: EvalRowStudent) => ReactNode
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
  // 펼친 행 — 추천서 화면과 같은 '한 번에 하나' 확장.
  const [activeId, setActiveId] = useState<string | null>(null)

  // 열림 트랜지션 — 마운트 직후 0fr → 1fr 로 바꿔 슬라이드다운을 만든다(추천서 화면 관례).
  const [panelOpen, setPanelOpen] = useState(false)
  useEffect(() => {
    if (!activeId) {
      setPanelOpen(false)
      return
    }
    setPanelOpen(false)
    const id = requestAnimationFrame(() => setPanelOpen(true))
    return () => cancelAnimationFrame(id)
  }, [activeId])

  const savedCount = Object.values(savedAt).filter(Boolean).length

  const q = query.trim().toLowerCase()
  const visible = sheet.students.filter(
    (s) => !q || s.name.toLowerCase().includes(q),
  )

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
      {/* 탭 공통 툴바(ListToolbar) — 좌: 안내·저장 카운트 / 우: 검색(2026-08-07 통일, 구 카드형 헤더). */}
      <ListToolbar
        left={
          <>
            <span>
              &lsquo;수강생 평가&rsquo;를 눌러 4축 점수를 매기고 저장하세요
            </span>
            <span className="bg-brand/10 text-brand flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-bold">
              <Check className="h-3.5 w-3.5" />
              저장 {savedCount} / {sheet.studentCount}명
            </span>
          </>
        }
        search={{
          value: query,
          onChange: setQuery,
          placeholder: '수강생 이름 검색',
          ariaLabel: '수강생 검색',
        }}
      />

      {visible.length === 0 ? (
        <Empty
          icon={<Users className="h-6 w-6" />}
          title="검색 결과가 없어요"
          description="다른 이름으로 검색해 보세요."
        />
      ) : (
        <div className="rounded-xl shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
          {visible.map((s, index) => {
            const student: EvalRowStudent = { id: s.studentId, name: s.name }
            const active = activeId === s.studentId
            const complete = isComplete(scores[s.studentId])
            const saving = savingId === s.studentId
            return (
              <div
                key={s.studentId}
                className="border-divider overflow-hidden border-b first:rounded-t-xl last:rounded-b-xl last:border-b-0"
              >
                <div
                  className={cn(
                    'flex items-center gap-3 px-5 py-3 transition-colors',
                    active ? 'bg-surface-muted' : 'bg-surface',
                  )}
                >
                  <Avatar name={s.name} size={36} />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-fg text-sm font-bold">{s.name}</span>
                    <span className="text-fg-subtle text-xs">
                      {savedAt[s.studentId]
                        ? `평가 저장됨 · ${savedAt[s.studentId]}`
                        : '평가 전'}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {savedAt[s.studentId] ? (
                      <StatusBadge label="평가됨" tone="success" />
                    ) : (
                      <StatusBadge label="미평가" tone="warning" />
                    )}
                    {rowExtra?.(student)}
                    <Button
                      type="button"
                      size="sm"
                      variant={active ? 'primary' : 'secondary'}
                      onClick={() => setActiveId(active ? null : s.studentId)}
                    >
                      {active ? '접기' : '수강생 평가'}
                    </Button>
                  </div>
                </div>
                {/* 이 행의 평가 패널 — grid-rows 0fr↔1fr 로 높이를 모르는 채 슬라이드시킨다. */}
                {active && (
                  <div
                    className={cn(
                      'grid transition-[grid-template-rows] duration-300 ease-out',
                      panelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="border-divider bg-surface-muted flex flex-col gap-3 border-t px-4 py-4">
                        <MemberEvalCard
                          person={{
                            id: s.studentId,
                            name: s.name,
                            roleLabel: '수강생',
                          }}
                          index={index}
                          scores={scores[s.studentId]}
                          comment={comments[s.studentId] ?? ''}
                          state={complete ? 'done' : 'active'}
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
                            setComments((prev) => ({
                              ...prev,
                              [s.studentId]: comment,
                            }))
                          }
                          footer={
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-fg-subtle text-[11px]">
                                {savedAt[s.studentId]
                                  ? `저장됨 · ${savedAt[s.studentId]}`
                                  : '저장 전'}
                              </span>
                              <button
                                type="button"
                                onClick={() => save(s.studentId, s.name)}
                                disabled={!complete || saving}
                                title={
                                  complete
                                    ? undefined
                                    : '4개 축 점수를 모두 입력해 주세요'
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
                        {panelExtra?.(student)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
