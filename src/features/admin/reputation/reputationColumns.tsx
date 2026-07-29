// 평판 수집 그리드 컬럼 정의 — ReputationPage에서 분리, degraded 플래그·핸들러는 옵션으로 주입.
import { Check, Send } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { type Column } from '@/components/data/DataTable'
import {
  AXIS_LABELS,
  AXIS_SHORT,
  ENDORSEMENT_META,
  MENTOR_EVAL_META,
  PUSH_LABEL,
  PUSH_SHORT,
  type ReputationPushAction,
} from './reputationMeta'
import type { ReputationStudent } from './types'

export function buildReputationColumns({
  endorsementDegraded,
  peerDegraded,
  onPushAction,
  onDetail,
}: {
  endorsementDegraded: boolean | undefined
  peerDegraded: boolean | undefined
  onPushAction: (action: ReputationPushAction) => void
  onDetail: (s: ReputationStudent) => void
}): Column<ReputationStudent>[] {
  return [
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
      className: 'w-36',
      // items-start 필수 — flex-col 기본 stretch 라 배지가 컬럼 너비만큼 늘어난다.
      cell: (s) =>
        // 조회 실패 시 전원 '미수집'으로 보이는 오해를 막는다.
        endorsementDegraded ? (
          <span
            className="text-warning text-[12px]"
            title="강사 추천서 현황을 일시적으로 불러오지 못했습니다."
          >
            조회 실패
          </span>
        ) : (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge
              label={ENDORSEMENT_META[s.endorsementStatus].label}
              tone={ENDORSEMENT_META[s.endorsementStatus].tone}
            />
            {/* 값 없을 때의 '-' 는 노이즈라 숨긴다 */}
            {s.endorsementBy && s.endorsementBy !== '-' && (
              <span className="text-fg-subtle text-[11px]">
                {s.endorsementBy}
              </span>
            )}
          </div>
        ),
    },
    {
      key: 'mentor',
      header: '멘토 평가·추천',
      cell: (s) => (
        <div className="flex flex-col items-start gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge
              label={MENTOR_EVAL_META[s.mentorEvalStatus].label}
              tone={MENTOR_EVAL_META[s.mentorEvalStatus].tone}
            />
            {s.mentorBy && s.mentorBy !== '-' && (
              <span className="text-fg-subtle text-[11px]">{s.mentorBy}</span>
            )}
          </div>
          {/* 멘토 5축 점수 — 제출 완료 시 인라인 표시(상세를 안 열어도 바로 보이도록) */}
          {s.mentorScores.length > 0 && (
            <div className="border-border flex items-center overflow-hidden rounded-md border">
              {s.mentorScores.map((v, i) => (
                <span
                  key={AXIS_LABELS[i]}
                  className="border-border flex items-center gap-1 border-r px-1.5 py-0.5 text-[10px] last:border-r-0"
                  title={AXIS_LABELS[i]}
                >
                  <span className="text-fg-subtle">{AXIS_SHORT[i]}</span>
                  <span className="text-fg font-semibold tabular-nums">
                    {v}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'peer',
      header: '동료 5축',
      className: 'w-32',
      cell: (s) => {
        // 조회 실패(learning 미응답)와 '대상 없음(개시된 프로젝트 없음)'을 구분해 표시한다.
        if (peerDegraded) {
          return (
            <span
              className="text-warning text-[12px]"
              title="동료 평가 현황을 일시적으로 불러오지 못했습니다."
            >
              조회 실패
            </span>
          )
        }
        if (s.peerTotal === 0) {
          return <span className="text-fg-subtle text-[12px]">대상 없음</span>
        }
        const full = s.peerCount >= s.peerTotal
        const pct = (s.peerCount / s.peerTotal) * 100
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="text-fg text-[13px] font-semibold tabular-nums">
              {s.peerCount}
              <span className="text-fg-subtle font-normal">
                {' '}
                / {s.peerTotal}
              </span>
            </span>
            <div className="bg-surface-muted h-1 w-16 overflow-hidden rounded-full">
              <div
                className={full ? 'bg-success h-full' : 'bg-brand h-full'}
                style={{ width: `${Math.round(pct)}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-52',
      // 한 줄 유지 — 푸시 버튼은 대상만 짧게(툴팁에 전체 라벨), 상세는 끝에 고정.
      cell: (s) => (
        <div className="flex items-center gap-1.5">
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
                // 화면엔 '강사'로 축약(한 줄 유지)하되, 접근성 이름·툴팁은 전체 라벨을 준다.
                aria-label={`${PUSH_LABEL[t]} 요청`}
                title={`${PUSH_LABEL[t]} 요청`}
                onClick={() =>
                  onPushAction({
                    spec: {
                      title: `${PUSH_LABEL[t]} 요청`,
                      subtitle: 'LMS 알림으로 평판 입력을 요청합니다.',
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
                className="border-border text-fg-muted hover:bg-surface-muted hover:text-fg inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[12px] font-medium whitespace-nowrap"
              >
                <Send className="h-3 w-3" />
                {PUSH_SHORT[t]}
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => onDetail(s)}
            className="text-brand ml-auto shrink-0 text-[13px] font-semibold whitespace-nowrap hover:underline"
          >
            상세
          </button>
        </div>
      ),
    },
  ]
}
