import type { WorkspaceData } from '../types'

/**
 * 팀 구성 변경 가드 — 서버(assertTeamChangeable)와 같은 기준으로 미리 막고 이유를 보여준다.
 *
 * · PM 아님: 팀원 누구나 남을 넣고 뺄 수 있으면 PM이 모르는 사이 팀이 바뀐다.
 * · 상호평가 진행 중: 대상이 바뀌면 이미 낸 평가가 갈 곳을 잃는다.
 * · 종료된 프로젝트: 하지도 않은 협업이 증명서 근거가 된다(초대만 막고 정리는 허용).
 *
 * 값이 있으면 그게 곧 막힌 이유, null 이면 열려 있다.
 */
export function teamGuard(d: WorkspaceData): {
  invite: string | null
  remove: string | null
} {
  const notPm = d.isOwner !== true
  const peerOpen = d.peerEvalEnabled
  const closed = d.status === 'completed' || d.status === 'certified'
  const frozen = '상호평가가 진행 중이라 팀원을 바꿀 수 없어요'
  return {
    invite: notPm
      ? 'PM만 팀원을 초대할 수 있어요'
      : peerOpen
        ? frozen
        : closed
          ? '종료된 프로젝트에는 팀원을 초대할 수 없어요'
          : null,
    remove: notPm ? 'PM만 팀원을 삭제할 수 있어요' : peerOpen ? frozen : null,
  }
}
