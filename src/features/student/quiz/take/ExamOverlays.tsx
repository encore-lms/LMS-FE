import { Button } from '@/components/ui/Button'

// 응시 집중 모드 오버레이 2종 — 시작 게이트(인트로)와 전체화면 이탈 시 재진입 오버레이.

/**
 * 시작 게이트 — 전체화면은 브라우저 정책상 사용자 클릭에서만 진입 가능해,
 * 응시 전 유의사항을 안내하고 "시작하기" 클릭으로 전체화면+응시를 시작한다.
 * 이탈 정책 숫자(limit·유예초)는 페이지 상수에서 받아 안내 문구가 실제 동작과 어긋나지 않게 한다.
 */
export function ExamIntro({
  title,
  total,
  timeLimitMinutes,
  violationLimit,
  submitSeconds,
  onStart,
}: {
  title: string
  total: number
  timeLimitMinutes: number
  violationLimit: number
  submitSeconds: number
  onStart: () => void
}) {
  const rules = [
    '전체화면(집중 모드)으로 진행돼요. ESC 등으로 화면을 벗어나면 "이탈"로 기록돼요.',
    '한 문제씩 풀고 다음으로 넘어가며, 모든 문제를 풀어야 제출할 수 있어요.',
    `이탈 1~${violationLimit}회: 곧바로 문제로 돌아가 이어 풀 수 있어요(이탈은 기록돼요).`,
    `이탈 ${violationLimit + 1}회째부터: ${submitSeconds}초 뒤 자동 제출되어 시험이 종료돼요.`,
    '이탈한 동안에도 시험 시간은 계속 흘러요. 탭 전환·새 창·개발자 도구·우클릭은 제한돼요.',
    '제한 시간이 지나면 자동으로 제출돼요.',
  ]
  return (
    <div className="bg-surface flex h-screen flex-col items-center justify-center px-6">
      <div className="border-border bg-surface flex w-[520px] max-w-full flex-col gap-6 rounded-2xl border p-9 shadow-[0px_2px_12px_0px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-2">
          <span className="bg-accent-bg text-accent-strong w-fit rounded-full px-3 py-1 text-[12px] font-semibold">
            🔒 집중 모드 응시
          </span>
          <h1 className="text-fg text-[22px] font-bold">{title}</h1>
          <p className="text-fg-subtle text-[13px]">
            총 {total > 0 ? total : '—'}문항 · 제한 시간 {timeLimitMinutes}분
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-fg text-[13px] font-semibold">유의사항</p>
          <ul className="flex flex-col gap-2.5">
            {rules.map((rule) => (
              <li
                key={rule}
                className="text-fg-muted flex items-start gap-2.5 text-[13px] leading-[20px]"
              >
                <span className="bg-brand mt-[7px] size-1.5 shrink-0 rounded-full" />
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-warning-bg text-warning rounded-xl px-4 py-3 text-[12px] leading-[18px]">
          공정한 평가를 위한 조치예요. 시작 후에는 모든 문제를 풀어야 나갈 수
          있으니 준비됐을 때 시작해 주세요.
        </div>

        <Button className="w-full" onClick={onStart}>
          집중 모드로 시작하기
        </Button>
      </div>
    </div>
  )
}

/**
 * 재진입 오버레이 — ESC/F11 등으로 전체화면이 풀리면(응시 active 동안) 화면 전체를 덮어 문제를 가린다.
 *
 * 정책(이탈 = 전체화면 해제):
 *  - 1~limit회(경고): 카운트다운 없이 "문제로 돌아가기"가 바로 활성화 → 즉시 이어서 응시.
 *  - limit 초과(fatal, 4회째~): secondsLeft(5초) 카운트다운 뒤 페이지가 자동 제출(시험 종료).
 *
 * secondsLeft: 남은 유예 초. 경고 케이스는 null(카운트다운 없이 즉시 복귀), fatal 케이스만 0에서 자동 제출.
 */
export function ExamRelockOverlay({
  violations,
  limit,
  secondsLeft,
  fatal,
  onRelock,
}: {
  violations: number
  limit: number
  secondsLeft: number | null
  fatal: boolean
  onRelock: () => void
}) {
  const canReturn = secondsLeft === null || secondsLeft <= 0
  return (
    <div className="bg-fg/85 fixed inset-0 z-50 flex items-center justify-center px-6 backdrop-blur-lg">
      <div className="bg-surface flex w-[460px] max-w-full flex-col items-center gap-5 rounded-2xl p-9 text-center shadow-[0px_8px_24px_0px_rgba(0,0,0,0.2)]">
        <span className="bg-danger-bg text-danger flex size-14 items-center justify-center rounded-full text-[26px]">
          {fatal ? '🚫' : '⚠️'}
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-fg text-[19px] font-bold">
            {fatal ? '이탈 한도를 초과했어요' : '집중 모드가 해제됐어요'}
          </h2>
          <p className="text-fg-muted text-[13px] leading-[20px]">
            {fatal
              ? `이탈이 ${limit}회를 넘어 잠시 후 시험이 자동 제출돼요.`
              : `잠시 후 다시 문제로 돌아가 이어 풀 수 있어요. 단, 이탈이 ${limit}회를 넘으면(${limit + 1}회째) 자동 제출돼요.`}
          </p>
        </div>

        {secondsLeft !== null && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-danger text-[44px] leading-none font-bold tabular-nums">
              {secondsLeft}
            </span>
            <span className="text-fg-subtle text-[12px]">
              {fatal ? '초 후 자동 제출' : '초 후 돌아갈 수 있어요'}
            </span>
          </div>
        )}

        <p className="bg-warning-bg text-warning rounded-lg px-3 py-1.5 text-[12px] font-semibold">
          이탈 {violations}회 (기록됨) · 한도 {limit}회
        </p>

        {!fatal && (
          <Button className="w-full" disabled={!canReturn} onClick={onRelock}>
            {canReturn
              ? '문제로 돌아가기'
              : `문제로 돌아가기 (${secondsLeft}초)`}
          </Button>
        )}
      </div>
    </div>
  )
}
