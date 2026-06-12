import { describe, expect, it } from 'vitest'
import {
  buildDashboardData,
  buildMentoringRequestDetail,
  buildMentoringRequestsData,
  mentorDb,
  respondToMentoringRequest,
  updateConfirmedDetails,
} from '../mockDb'

// 상태형 mock 검증 — 멘토 응답 3종(확정/거절/조정 제안)이 예약 목록과 M1 대시보드·팀 요약
// 상태에 실반영되는지. 모듈 상태를 공유하므로 it 순차 실행 전제(요청별로 분리해 간섭 최소화).

const statusOf = (requestId: string) =>
  buildMentoringRequestDetail(requestId)?.status

describe('mentoring requests mockDb', () => {
  it('초기 목록 — 진행 중 3건(요청 대기 2 + 조정 제안 1) + 확정 2 + 거절·취소 4 + 완료(유효 일지 파생)', () => {
    const { requests } = buildMentoringRequestsData()
    const count = (s: string) => requests.filter((r) => r.status === s).length
    expect(count('requested')).toBe(2)
    expect(count('counter_proposed')).toBe(1)
    expect(count('confirmed')).toBe(2)
    expect(count('rejected') + count('canceled')).toBe(4)
    // 완료 = 팀별 유효 일지 14건 파생(수정 요청 1건 제외) — 일지 제출 = 예약 COMPLETED 계약
    expect(count('completed')).toBe(14)
    // 조정 제안 카드 — 제안 슬롯 + 수강생 공개 응답 메모 보존
    const dm = requests.find((r) => r.requestId === 'req_dm_6')
    expect(dm?.proposal?.dateTimeLabel).toBe('6/3(화) 19:00 ~ 21:00')
    expect(dm?.mentorResponseNote).toContain('다음 날로 옮겨드립니다')
  })

  it('confirm — 요청 대기 → 확정, 대시보드 예정 멘토링·팀 요약에 즉시 반영된다', () => {
    const before = buildDashboardData()
    expect(before.upcoming.confirmedCount).toBe(2)

    const result = respondToMentoringRequest('req_ts_4', 'confirm')
    expect(result.ok).toBe(true)
    expect(statusOf('req_ts_4')).toBe('confirmed')
    // 확정 = 희망 일정 그대로
    const detail = buildMentoringRequestDetail('req_ts_4')
    expect(detail?.confirmed?.dateTimeLabel).toBe('5/30(금) 19:00 ~ 21:00')

    // M1 대시보드 — 트러블슈팅 팀 확정 세션 추가(상태 공유)
    const after = buildDashboardData()
    expect(after.upcoming.confirmedCount).toBe(3)
    expect(
      after.upcoming.sessions.some((s) => s.reservationId === 'req_ts_4'),
    ).toBe(true)
    const ts = mentorDb.teams.find((t) => t.teamId === 'team_ts')
    expect(ts?.reservationSummary.confirmed).toBe(1)
    expect(ts?.nextConfirmed?.requesterName).toBe('이재현')
  })

  it('counter-propose — 조정 제안 저장·제안 수정, 필수 필드 누락은 422', () => {
    // 필수 필드(일정+예상 시간+장소) 누락 → 422 MENTOR_RESERVATION_REQUIRED_FIELD_MISSING
    const invalid = respondToMentoringRequest('req_rec_6', 'counter-propose', {
      dateTimeLabel: '6/1(월) 19:00 ~ 20:30',
    })
    expect(invalid.ok).toBe(false)
    if (!invalid.ok) {
      expect(invalid.status).toBe(422)
      expect(invalid.code).toBe('MENTOR_RESERVATION_REQUIRED_FIELD_MISSING')
    }
    expect(statusOf('req_rec_6')).toBe('requested')

    const result = respondToMentoringRequest('req_rec_6', 'counter-propose', {
      dateTimeLabel: '6/1(월) 19:00 ~ 20:30',
      placeType: 'online',
      placeDetail: 'Zoom',
      expectedMinutes: 90,
      mentorResponseNote: '당일 오후는 일정이 겹쳐 저녁으로 제안드립니다.',
    })
    expect(result.ok).toBe(true)
    const detail = buildMentoringRequestDetail('req_rec_6')
    expect(detail?.status).toBe('counter_proposed')
    expect(detail?.proposal?.dateTimeLabel).toBe('6/1(월) 19:00 ~ 20:30')
    expect(detail?.mentorResponseNote).toContain('저녁으로 제안드립니다')
    // 희망 일정 원문은 보존
    expect(detail?.desired.dateTimeLabel).toBe('5/29(목) 14:00 ~ 16:00')
  })

  it('cancel(제안 취소) — 조정 제안 → 요청 대기 복귀(mock 한정 가정)', () => {
    const result = respondToMentoringRequest('req_rec_6', 'cancel')
    expect(result.ok).toBe(true)
    const detail = buildMentoringRequestDetail('req_rec_6')
    expect(detail?.status).toBe('requested')
    expect(detail?.proposal).toBeNull()
  })

  it('reject — 요청 대기 → 거절(응답 메모 선택), 진행 중 목록에서 빠진다', () => {
    const result = respondToMentoringRequest('req_rec_6', 'reject', {
      mentorResponseNote: '해당 주는 일정이 가득 차서 다음 주로 요청해주세요.',
    })
    expect(result.ok).toBe(true)
    const detail = buildMentoringRequestDetail('req_rec_6')
    expect(detail?.status).toBe('rejected')
    expect(detail?.mentorResponseNote).toContain('다음 주로 요청해주세요')

    // 목록 갱신 — 진행 중(요청 대기·조정 제안)은 데이터마트 팀 1건만 남는다
    const { requests } = buildMentoringRequestsData()
    const open = requests.filter(
      (r) => r.status === 'requested' || r.status === 'counter_proposed',
    )
    expect(open.map((r) => r.requestId)).toEqual(['req_dm_6'])
  })

  it('상태 전이 guard — 종결 건 재응답 409, 미존재 404', () => {
    const resolved = respondToMentoringRequest('req_rec_6', 'confirm')
    expect(resolved.ok).toBe(false)
    if (!resolved.ok) expect(resolved.status).toBe(409)

    const missing = respondToMentoringRequest('req_unknown', 'confirm')
    expect(missing.ok).toBe(false)
    if (!missing.ok) {
      expect(missing.status).toBe(404)
      expect(missing.code).toBe('MENTOR_RESERVATION_NOT_FOUND')
    }
  })

  it('confirmed-details PATCH — 확정 일정·장소 변경이 대시보드 nextConfirmed에 반영된다', () => {
    // 확정 상태가 아니면 409
    const notConfirmed = updateConfirmedDetails('req_dm_6', {
      dateTimeLabel: '6/5(금) 19:00 ~ 21:00',
      placeType: 'online',
      placeDetail: 'Zoom',
      expectedMinutes: 120,
    })
    expect(notConfirmed.ok).toBe(false)

    const result = updateConfirmedDetails('res_dm_5', {
      dateTimeLabel: '5/29(목) 19:00 ~ 20:30',
      placeType: 'offline',
      placeDetail: '강의장 C',
      expectedMinutes: 90,
    })
    expect(result.ok).toBe(true)
    const detail = buildMentoringRequestDetail('res_dm_5')
    expect(detail?.confirmed?.placeDetail).toBe('강의장 C')
    expect(detail?.confirmed?.expectedMinutes).toBe(90)

    const dm = mentorDb.teams.find((t) => t.teamId === 'team_dm')
    expect(dm?.nextConfirmed?.locationDetailLabel).toBe('강의장 C')
    expect(dm?.nextConfirmed?.expectedMinutes).toBe(90)
  })
})
