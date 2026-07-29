// 멘토 mock — 학생(멘티) 상세 read model 빌더(M3, 배정 팀 팀원 한정).
import type { MenteeDetailData } from '../types'
import { EVALUATION_AXIS_LABELS, mentorDb } from './db'
import {
  dowOf,
  round1,
  roundOf,
  sortByPerformedAtDesc,
  submittedLogs,
  timeLabelOf,
} from './shared'

/**
 * GET /mentor/v1/mentees/{studentProfileId} — 팀 상세에서만 진입하는 보조 상세.
 * 노출 경계(05-26 §결론): 멘토 본인이 작성한 평가·코멘트·추천 + 일지 참석 이력만.
 * 미배정 팀 학생이면 null(403) — HRD-Net 출결·마이 프로필·타 멘토 평가 미노출.
 */
export function buildMenteeDetail(studentId: string): MenteeDetailData | null {
  for (const team of mentorDb.teams) {
    const idx = team.members.findIndex((m) => m.studentId === studentId)
    if (idx < 0) continue
    const member = team.members[idx]

    // 학번 — mock 파생(기수 코드 + 순번). BE 프로필 계약 확정 시 대체 TODO.
    const cohortCode = team.cohortLabel.replace(/[^A-Za-z]/g, '').toUpperCase()
    const cohortNum = (team.cohortLabel.match(/\d+/)?.[0] ?? '0').padStart(
      2,
      '0',
    )
    const studentNo = `${cohortCode}${cohortNum}-${String(idx + 1).padStart(3, '0')}`

    const evalEntry = mentorDb.evaluations.find((e) => e.teamId === team.teamId)
    const byStudent = evalEntry?.byStudent[studentId]
    const evaluation =
      evalEntry && byStudent
        ? {
            writtenAtLabel: evalEntry.writtenAtLabel,
            average: round1(
              byStudent.axes.reduce((sum, s) => sum + s, 0) /
                byStudent.axes.length,
            ),
            axes: byStudent.axes.map((score, i) => ({
              label: EVALUATION_AXIS_LABELS[i],
              score,
              max: 5,
            })),
            comment: byStudent.comment,
          }
        : null

    const rec = mentorDb.recommendations.find((r) => r.teamId === team.teamId)
    const recommendation =
      rec && rec.studentId === studentId
        ? {
            recommended: true,
            submittedAtLabel: rec.submittedAtLabel,
            reason: rec.reason,
          }
        : null

    // 참석 이력 — 제출 일지(초안 제외)의 참석 멘티 정보에서 추출(§5), 최신순.
    const history = sortByPerformedAtDesc(submittedLogs(team)).map((log) => ({
      logId: log.logId,
      round: roundOf(team, log),
      datetimeLabel: `${log.performedAt.slice(0, 10)}(${dowOf(log.performedAt)}) ${timeLabelOf(log.performedAt)}`,
      placeLabel: log.locationLabel,
      recognizedLabel:
        log.recognizedHours != null ? `${log.recognizedHours}h` : '-',
      attended: !log.attendedIds || log.attendedIds.includes(studentId),
      logStatus: log.status,
    }))

    return {
      student: {
        studentId,
        name: member.name,
        tagLabel: member.tagLabel,
        cohortLabel: team.cohortLabel,
        teamId: team.teamId,
        teamName: team.teamName,
        mentorName: mentorDb.mentorName,
        studentNo,
      },
      permissionScopeLabel: '배정 팀 팀원 한정 조회',
      evaluation,
      recommendation,
      attendance: {
        attended: history.filter((h) => h.attended).length,
        total: history.length,
        history,
      },
    }
  }
  return null
}
