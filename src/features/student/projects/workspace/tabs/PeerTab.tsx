import { useState } from 'react'
import { Timer } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import {
  MemberEvalCard,
  type EvalCardState,
} from '@/components/evaluation/MemberEvalCard'
import {
  useSavePeerEvalDraft,
  useSaveSelfReview,
  useSubmitPeerEval,
  wsWriteError,
} from '../../../api/projects'
import { statusToPhase, useProjectFlow } from '../useProjectFlow'
import type { WorkspaceData } from '../../types'
import { Chip } from '../components/ws-shared'
import { card } from '../components/ws-style'
import { useMemberNames } from '../components/useMemberNames'

// 상호평가 4축 개편(2026-08-06) — 멘토 평가와 같은 공용 카드(MemberEvalCard)·같은 축 사전.
// 점수는 리커트 1~5 정수(구 0.5 슬라이더 폐기), 코멘트는 상호평가 정책대로 선택 유지.

type Scores4 = (number | null)[]

/** BE 점수(4축, 미입력 0) → UI 점수(미선택 null). 구 V1 복원값도 1~5 정수로 정규화. */
const toUiScores = (scores?: number[] | null): Scores4 =>
  Array.from({ length: 4 }, (_, i) => {
    const v = scores?.[i]
    if (v == null || v < 1) return null
    return Math.min(5, Math.round(v))
  })

const isComplete = (scores: Scores4) => scores.every((s) => s != null)

export function PeerTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const nameOf = useMemberNames()
  const [submitted, setSubmitted] = useState(false)
  // 초기값은 '내가 준 평가'(myEval) — axes 는 팀에서 받은 평균이라 내 입력값이 아니다.
  const [scores, setScores] = useState<Record<string, Scores4>>(() =>
    Object.fromEntries(
      d.peerTargets.map((t) => [t.name, toUiScores(t.myEval?.scores)]),
    ),
  )
  const [comments, setComments] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      d.peerTargets
        .filter((t) => t.myEval?.comment)
        .map((t) => [t.name, t.myEval!.comment!]),
    ),
  )
  const [selfReview, setSelfReview] = useState(d.selfReview ?? '')
  const phase = useProjectFlow((s) => s.phases[d.id]) ?? statusToPhase(d.status)
  const submitPeerM = useSubmitPeerEval(d.id)
  const saveSelfM = useSaveSelfReview(d.id)
  // 임시저장은 자기 수행 내용만이 아니라 점수·코멘트까지 함께 보관한다.
  const saveDraftM = useSavePeerEvalDraft(d.id)

  const targets = d.peerTargets.filter((t) => t.memberId)
  // 아직 점수를 안 매긴 팀원 — 4축 전부 채워야 평가한 것으로 본다(코멘트는 선택).
  const unscored = targets
    .filter((t) => !isComplete(scores[t.name]))
    .map((t) => t.name)
  // 카드 상태 — 멘토 평가와 동일한 순차 시각 상태(자유 편집 허용, 순서 강제 없음).
  const firstIncomplete = d.peerTargets.findIndex(
    (t) => t.memberId && !isComplete(scores[t.name]),
  )
  const cardStateOf = (index: number): EvalCardState => {
    const t = d.peerTargets[index]
    if (isComplete(scores[t.name])) return 'done'
    return index === firstIncomplete ? 'active' : 'waiting'
  }

  const submitAll = () => {
    if (targets.length === 0) {
      toast.danger('평가할 팀원이 없어요.')
      return
    }
    // 빈 축을 0 점으로 채워 보내면 '안 매긴 것'과 '저점'을 구분할 수 없다. 제출 전에 막는다(BE도 422).
    if (unscored.length > 0) {
      toast.danger(
        `점수를 매기지 않은 팀원이 있어요 — ${unscored.join(', ')} (4개 축 모두 필요)`,
      )
      return
    }
    Promise.all([
      saveSelfM.mutateAsync({ content: selfReview }),
      ...targets.map((t) =>
        submitPeerM.mutateAsync({
          targetMemberId: t.memberId!,
          scores: scores[t.name].map((s) => s ?? 0),
          comment: comments[t.name] ?? '',
        }),
      ),
    ])
      .then(() => {
        setSubmitted(true)
        toast.success('상호평가를 제출했습니다')
      })
      .catch((e) =>
        toast.danger(wsWriteError(e, '상호평가 제출에 실패했어요.')),
      )
  }
  const setScore = (name: string, axisIndex: number, value: number) =>
    setScores((prev) => ({
      ...prev,
      [name]: prev[name].map((s, i) => (i === axisIndex ? value : s)),
    }))

  // 열리지 않은 경우 폼을 아예 그리지 않는다 — 그리면 다 입력하고 제출에서만 실패해 입력이 날아간다.
  //  · 완료 확정 전(진행 중) (§17)
  //  · 매니저·강사가 동료 평가를 개시하지 않음(서버가 제출을 막는 실제 조건)
  if (phase === 'active' || !d.peerEvalEnabled) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-fg text-[16px] font-bold">프로젝트 상호평가</h2>
        <section
          className={cn(
            card,
            'flex flex-col items-center gap-2 py-12 text-center',
          )}
        >
          <Timer className="text-fg-subtle size-8" aria-hidden="true" />
          <span className="text-fg text-[14px] font-bold">
            아직 상호평가가 열리지 않았어요
          </span>
          <span className="text-fg-muted max-w-md text-[12px] leading-5">
            프로젝트가 끝난 뒤 매니저·강사가 상호평가를 시작하면 팀원을 평가할
            수 있어요.
          </span>
        </section>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-fg text-[16px] font-bold">프로젝트 상호평가</h2>
        <span className="text-fg-subtle text-[12px]">
          완료된 프로젝트의 팀원을 평가합니다. 평가 정보와 코멘트는 팀원에게
          공개되지 않습니다.
        </span>
      </div>
      <section className={cn(card, 'flex items-center justify-between gap-4')}>
        <div className="flex flex-col gap-1">
          <span className="text-fg text-[14px] font-bold">
            필수 제출 · 마감 {d.peerDue}
          </span>
          <span className="text-fg-muted text-[12px]">
            PM 포함 모든 멤버가 자기 자신을 제외한 팀원을 4축(기술/기술기여 ·
            소통·협업·팀워크 · 문제해결 · 책임감)으로 평가합니다. 마감 전까지
            수정 가능하며, 최종본이 증명서에 반영됩니다.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Chip
            badge={
              submitted
                ? { label: '제출 완료', tone: 'success' }
                : d.peerMyStatus
            }
          />
          <Chip badge={d.peerTeamStatus} />
        </div>
      </section>
      <section className={cn(card, 'flex flex-col gap-2')}>
        <div className="flex flex-col gap-1">
          <span className="text-fg text-[14px] font-bold">본인 수행 내용</span>
          <span className="text-fg-muted text-[12px]">
            이번 프로젝트에서 본인이 맡은 업무와 기여를 정리해 주세요. 임시
            저장·제출 시 함께 저장됩니다.
          </span>
        </div>
        <textarea
          value={selfReview}
          onChange={(e) => setSelfReview(e.target.value)}
          placeholder="예: 로그인·회원가입 API 구현, 팀 일정 관리, 발표 자료 제작 등"
          aria-label="본인 수행 내용"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-24 resize-none rounded-lg border px-3 py-2 text-[12px] focus:outline-none"
        />
      </section>
      {d.peerTargets.map((t, index) => (
        <MemberEvalCard
          key={t.memberId ?? t.name}
          person={{
            id: t.memberId ?? t.name,
            name: nameOf(t.memberId, t.name),
            roleLabel: t.role,
          }}
          index={index}
          scores={scores[t.name]}
          comment={comments[t.name] ?? ''}
          state={cardStateOf(index)}
          readOnly={!t.memberId}
          commentRequired={false}
          commentPlaceholder="선택 코멘트: 프로젝트에서 드러난 협업/기여 근거를 적어주세요."
          onScore={(axisIndex, value) => setScore(t.name, axisIndex, value)}
          onComment={(comment) =>
            setComments((prev) => ({ ...prev, [t.name]: comment }))
          }
        />
      ))}
      <div className="border-border flex items-center justify-between border-t pt-4">
        <span className="text-fg-subtle text-[11px]">
          제출 후에도 마감 전까지 수정할 수 있습니다. 미제출 시 본인 증명서의
          프로젝트 협업 근거가 제한됩니다.
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              saveDraftM
                .mutateAsync({
                  selfReview,
                  evaluations: targets.map((t) => ({
                    targetMemberId: t.memberId!,
                    scores: scores[t.name].map((s) => s ?? 0),
                    comment: comments[t.name] ?? '',
                  })),
                })
                .then(() => toast.info('상호평가를 임시 저장했습니다'))
                .catch((e) =>
                  toast.danger(wsWriteError(e, '임시 저장에 실패했어요.')),
                )
            }
            disabled={saveDraftM.isPending}
            className="border-border text-fg rounded-lg border px-4 py-2.5 text-[13px] font-semibold"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={submitAll}
            disabled={submitPeerM.isPending || unscored.length > 0}
            title={
              unscored.length > 0
                ? `${unscored.join(', ')} 님의 점수가 남았어요`
                : undefined
            }
            className={cn(
              buttonClass({ size: 'md' }),
              unscored.length > 0 && 'cursor-not-allowed opacity-50',
            )}
          >
            {submitPeerM.isPending ? '제출 중…' : '제출'}
          </button>
        </div>
      </div>
    </div>
  )
}
