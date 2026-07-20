import { Button } from '@/components/ui/Button'

// 응시 집중 모드 오버레이 2종 — 시작 게이트(인트로)와 전체화면 이탈 시 재진입 오버레이.

/**
 * 시작 게이트 — 전체화면은 브라우저 정책상 사용자 클릭에서만 진입 가능해,
 * 응시 전 유의사항을 안내하고 "시작하기" 클릭으로 전체화면+응시를 시작한다.
 * 카운트다운 초(countdownSeconds)는 페이지 상수에서 받아 안내 문구가 실제 동작과 어긋나지 않게 한다.
 */
export function ExamIntro({
  title,
  total,
  timeLimitMinutes,
  countdownSeconds,
  onStart,
}: {
  title: string
  total: number
  timeLimitMinutes: number
  countdownSeconds: number
  onStart: () => void
}) {
  const rules = [
    '전체화면(집중 모드)으로 진행돼요. ESC 등으로 화면을 벗어나면 "이탈"로 기록돼요.',
    '한 문제씩 풀고 다음으로 넘어가며, 모든 문제를 풀어야 제출할 수 있어요.',
    `이탈하면 ${countdownSeconds}초 카운트다운이 뜨고, ${countdownSeconds}초가 지나면 자동으로 문제로 돌아가요. 그 전에도 "문제로 돌아가기" 버튼으로 언제든 복귀할 수 있어요.`,
    '이탈 횟수에 따른 자동 제출은 없지만, 이탈한 동안에도 시험 시간은 계속 흘러요. 탭 전환·새 창·개발자 도구·우클릭은 제한돼요.',
    '제한 시간이 지나면 자동으로 제출돼요.',
  ]
  return (
    <div className="bg-surface flex h-screen flex-col items-center justify-center px-6">
      <div className="bg-surface flex w-[520px] max-w-full flex-col gap-6 rounded-2xl p-9 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
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
 * 정책(이탈 = 전체화면 해제): 한도·자동 제출 없음.
 *  - 이탈하면 secondsLeft(10초) 카운트다운이 표시되고, 0초가 되면 자동으로 닫혀 문제로 돌아간다.
 *  - 그 전에도 "문제로 돌아가기"는 처음부터 활성화되어 카운트다운 도중 언제든 눌러 즉시 복귀할 수 있다.
 *  - 전체화면 재진입은 브라우저 정책상 사용자 클릭에서만 가능 — 버튼 클릭만 전체화면을 다시 걸고,
 *    0초 자동 복귀는 전체화면 없이 이어서 진행된다.
 *
 * secondsLeft: 표시용 남은 초(null = 카운트다운 없음). 버튼 활성/복귀를 막지 않는다.
 */
export function ExamRelockOverlay({
  violations,
  secondsLeft,
  onRelock,
}: {
  violations: number
  secondsLeft: number | null
  onRelock: () => void
}) {
  return (
    <div className="bg-fg/85 fixed inset-0 z-50 flex items-center justify-center px-6 backdrop-blur-lg">
      <div className="bg-surface flex w-[460px] max-w-full flex-col items-center gap-5 rounded-2xl p-9 text-center shadow-[0px_8px_24px_0px_rgba(0,0,0,0.2)]">
        <span className="bg-danger-bg text-danger flex size-14 items-center justify-center rounded-full text-[26px]">
          ⚠️
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-fg text-[19px] font-bold">
            집중 모드가 해제됐어요
          </h2>
          <p className="text-fg-muted text-[13px] leading-[20px]">
            카운트다운이 끝나면 자동으로 문제로 돌아가요. 그 전에도 아래
            버튼으로 언제든 복귀할 수 있어요.
          </p>
        </div>

        {secondsLeft !== null && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-danger text-[44px] leading-none font-bold tabular-nums">
              {secondsLeft}
            </span>
            <span className="text-fg-subtle text-[12px]">초 후 자동 복귀</span>
          </div>
        )}

        <p className="bg-warning-bg text-warning rounded-lg px-3 py-1.5 text-[12px] font-semibold">
          이탈 {violations}회 (기록됨)
        </p>

        <Button className="w-full" onClick={onRelock}>
          문제로 돌아가기
        </Button>
      </div>
    </div>
  )
}
