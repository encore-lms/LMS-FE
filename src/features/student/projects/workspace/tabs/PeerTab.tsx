import { useState } from 'react'
import { Timer } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import {
  useSaveSelfReview,
  useSubmitPeerEval,
  wsWriteError,
} from '../../../api/projects'
import { statusToPhase, useProjectFlow } from '../useProjectFlow'
import type { WorkspaceData } from '../../types'
import { Chip } from '../components/ws-shared'
import { card } from '../components/ws-style'
import { useMemberNames } from '../components/useMemberNames'

export function PeerTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const nameOf = useMemberNames()
  const [submitted, setSubmitted] = useState(false)
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      d.peerTargets.flatMap((target) =>
        target.axes.map((axis) => [`${target.name}:${axis.key}`, axis.score]),
      ),
    ),
  )
  const [comments, setComments] = useState<Record<string, string>>({})
  const [selfReview, setSelfReview] = useState(d.selfReview ?? '')
  const phase = useProjectFlow((s) => s.phases[d.id]) ?? statusToPhase(d.status)
  const submitPeerM = useSubmitPeerEval(d.id)
  const saveSelfM = useSaveSelfReview(d.id)
  // 축 라벨(BE 한글 key) → 제출 필드 매핑
  const AXIS_KEYS = ['협업', '소통', '책임감', '문제해결', '기술기여']
  const submitAll = () => {
    const targets = d.peerTargets.filter((t) => t.memberId)
    if (targets.length === 0) {
      toast.danger('평가할 팀원이 없어요.')
      return
    }
    Promise.all([
      saveSelfM.mutateAsync({ content: selfReview }),
      ...targets.map((t) =>
        submitPeerM.mutateAsync({
          targetMemberId: t.memberId!,
          collaboration: scores[`${t.name}:협업`] ?? 0,
          communication: scores[`${t.name}:소통`] ?? 0,
          responsibility: scores[`${t.name}:책임감`] ?? 0,
          problemSolving: scores[`${t.name}:문제해결`] ?? 0,
          technicalContribution: scores[`${t.name}:기술기여`] ?? 0,
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
  void AXIS_KEYS
  const setScore = (name: string, key: string, score: number) =>
    setScores((prev) => ({ ...prev, [`${name}:${key}`]: score }))

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
            PM 포함 모든 멤버가 자기 자신을 제외한 팀원을 평가합니다. 마감
            전까지 수정 가능하며, 최종본이 증명서에 반영됩니다.
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
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-24 resize-none rounded-lg border px-3 py-2 text-[12px] focus:outline-none focus-visible:shadow-none"
        />
      </section>
      {d.peerTargets.map((t) => (
        <section key={t.name} className={cn(card, 'flex flex-col gap-3')}>
          <div className="flex items-center gap-2">
            <span className="text-fg text-[14px] font-bold">
              {nameOf(t.memberId, t.name)}
            </span>
            <span className="text-fg-subtle text-[11px]">{t.role}</span>
            <span className="text-fg-subtle ml-auto text-[11px]">
              5개 축은 모두 필수, 코멘트는 선택입니다.
            </span>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {t.axes.map((a) => (
              <div key={a.key} className="flex items-center gap-2">
                <span className="text-fg w-16 shrink-0 text-[12px] font-medium">
                  {a.key}
                </span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={scores[`${t.name}:${a.key}`]}
                  onChange={(e) =>
                    setScore(t.name, a.key, Number(e.target.value))
                  }
                  aria-label={`${t.name} ${a.key} 점수`}
                  className="accent-brand flex-1"
                />
                <span className="text-fg w-7 shrink-0 text-right text-[12px] font-bold">
                  {scores[`${t.name}:${a.key}`].toFixed(1)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-fg-subtle text-[11px]">
                팀원 한줄 코멘트
              </span>
              {t.tags.map((tg, i) => (
                <Chip key={i} badge={tg} />
              ))}
            </div>
            <textarea
              value={comments[t.name] ?? ''}
              onChange={(e) =>
                setComments((prev) => ({ ...prev, [t.name]: e.target.value }))
              }
              placeholder="선택 코멘트: 프로젝트에서 드러난 협업/기여 근거를 적어주세요."
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-10 flex-1 resize-none rounded-lg border px-3 py-2 text-[11px] focus:outline-none focus-visible:shadow-none"
            />
          </div>
        </section>
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
              saveSelfM
                .mutateAsync({ content: selfReview })
                .then(() => toast.info('상호평가를 임시 저장했습니다'))
                .catch((e) =>
                  toast.danger(wsWriteError(e, '임시 저장에 실패했어요.')),
                )
            }
            disabled={saveSelfM.isPending}
            className="border-border text-fg rounded-lg border px-4 py-2.5 text-[13px] font-semibold"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={submitAll}
            disabled={submitPeerM.isPending}
            className={buttonClass({ size: 'md' })}
          >
            {submitPeerM.isPending ? '제출 중…' : '제출'}
          </button>
        </div>
      </div>
    </div>
  )
}
