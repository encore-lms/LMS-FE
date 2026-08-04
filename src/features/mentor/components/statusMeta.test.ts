import { describe, expect, it } from 'vitest'
import { mentorRoutes } from '../routes'
import { teamAction } from './statusMeta'
import { buildTeamsData } from '../mockDb'
import type { MentorTeamAssignment } from '../types'

/** 라우트 트리에 실제로 있는 경로들 — '/mentor/…' 형태로 펼친다. */
const KNOWN = new Set(
  (mentorRoutes[0].children ?? []).map((r) =>
    r.index ? '/mentor' : `/mentor/${r.path}`,
  ),
)

/** 링크가 살아 있는 라우트를 가리키는지 — 쿼리·동적 조각을 걷어내고 대조한다. */
function reachable(to: string) {
  const path = to.split('?')[0]
  for (const known of KNOWN) {
    const pattern = new RegExp(
      '^' + known.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/') + '$',
    )
    if (pattern.test(path)) return true
  }
  return false
}

describe('teamAction', () => {
  // 예약·일지·평가를 팀 탭으로 옮기며 독립 화면을 걷어냈다(2026-08-04). 그때 이 링크들이
  // 옛 주소를 계속 가리켜, 대시보드·팀 목록의 버튼이 전부 '찾을 수 없는 주소'로 떨어졌다.
  const teams = buildTeamsData().teams

  it('모든 상태의 액션이 살아 있는 라우트를 가리킨다', () => {
    const dead: string[] = []
    for (const team of teams as MentorTeamAssignment[]) {
      for (const context of [
        'card',
        'dashboard-table',
        'teams-table',
      ] as const) {
        const to = teamAction(team, context).to
        if (!reachable(to)) dead.push(`${team.status} · ${context} → ${to}`)
      }
    }
    expect(dead).toEqual([])
  })

  it('예약·일지·평가는 팀 안 탭으로 보낸다', () => {
    const of = (status: MentorTeamAssignment['status']) =>
      teamAction({ ...(teams[0] as MentorTeamAssignment), status }, 'card').to
    expect(of('evaluation_needed')).toContain('?tab=evaluation')
    expect(of('change_requested')).toContain('?tab=logs')
    expect(of('in_progress')).toContain('?tab=requests')
  })
})
