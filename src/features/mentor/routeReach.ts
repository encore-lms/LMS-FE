import { mentorRoutes } from './routes'

/** 라우트 트리에 실제로 있는 경로들 — '/mentor/…' 형태로 펼친다. */
const KNOWN = (mentorRoutes[0].children ?? []).map((r) =>
  r.index ? '/mentor' : `/mentor/${r.path}`,
)

/**
 * 이 주소로 실제로 갈 수 있는지 — 쿼리·동적 조각을 걷어내고 라우트와 대조한다.
 *
 * <p>화면을 걷어낼 때 링크를 함께 훑지 않으면, 버튼이 '찾을 수 없는 주소'로 떨어진다.
 * 예약·일지·평가를 팀 탭으로 옮기며 실제로 그렇게 됐다(2026-08-04). 테스트가 이 함수로
 * 링크를 대조해 같은 일을 막는다.</p>
 */
export function reachable(to: string): boolean {
  const path = to.split('?')[0].split('#')[0]
  return KNOWN.some((known) =>
    new RegExp(
      '^' + known.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/') + '$',
    ).test(path),
  )
}
