import type {
  MentorDashboardData,
  MentorNextReservation,
  MentorTeamAssignment,
  MentorTeamDetailData,
  MentorTeamMember,
  MentorTeamMemberRole,
  MentorTeamStatus,
  MentorTeamsData,
  MentorTodoItem,
  MentoringLogStatus,
  MentoringPlaceType,
  MentoringRequestActionPayload,
  MentoringRequestItem,
  MentoringRequestSlot,
  MentoringRequestStatus,
  MentoringRequestsData,
} from './types'
import { MENTORING_PLACE_TYPE_LABEL } from './types'

// 멘토 콘솔 mock 인메모리 상태 — 멘토 PR 시리즈(M1 홈·팀 / M2 예약 / M3·M4 일지 / M5 평가·추천)가
// 공유하는 단일 소유 모듈. 이후 PR의 mutation 핸들러는 이 db를 직접 변경(상태형 mock)하고
// 화면은 invalidateQueries 로 재조회한다. msw 자동 수집 글롭(features/**/mocks.ts)에 걸리지
// 않도록 mocks.ts(핸들러 전용)와 분리했다.
// 데이터: Figma 대표 시안(대시보드 2553:3399 · 내 배정 팀 2553:3554 · 팀 상세 2553:3696) 재현.

export interface MentorMockLog {
  logId: string
  /** 정렬·라벨 파생용 — '2026-05-26T14:00' */
  performedAt: string
  locationLabel: string // '온라인 · Zoom'
  actualMinutes: number
  /** 수정 요청(재제출 전) 등 인정 미확정이면 null */
  recognizedHours: number | null
  status: MentoringLogStatus
  statusNote?: string
  summary: string
}

export interface MentorMockReservation {
  reservationId: string
  /** '2026-05-28T14:00' */
  startsAt: string
  dayOfWeekLabel: string
  locationTypeLabel: string
  locationDetailLabel: string
  expectedMinutes: number
  requesterName: string
  /** 가장 임박한 확정 건에만 — 'D-1' */
  dDayLabel: string | null
}

export interface MentorMockTeam {
  teamId: string
  assignmentId: string
  cohortLabel: string
  teamName: string
  periodLabel: string
  status: MentorTeamStatus
  allocatedHours: number
  accumulatedHours: number
  recognizedHours: number
  members: MentorTeamMember[]
  reservationSummary: {
    inProgress: number
    confirmed: number
    completed: number
  }
  /** 다음 확정(CONFIRMED) 예약 — 없으면 null */
  nextConfirmed: MentorMockReservation | null
  logs: MentorMockLog[]
}

/**
 * 예약 일정 슬롯(mock) — 표기 라벨 + 정렬·대시보드 변환용 메타.
 * dateTimeLabel 이 표기 SSOT(디자인상 자유 텍스트), startsAt/dayOfWeekLabel 은
 * nextConfirmed 변환·정렬용 — BE 확정 시 ISO 단일 표현으로 정규화 TODO.
 */
export interface MentorMockSlot extends MentoringRequestSlot {
  /** '2026-05-29T14:00' — 정렬·대시보드 nextConfirmed 변환용 */
  startsAt: string
  dayOfWeekLabel: string
}

/** 멘토링 예약 요청(mock) — requestId = API reservationId(MentoringReservation). */
export interface MentorMockRequest {
  requestId: string
  teamId: string
  status: MentoringRequestStatus
  requestedAtLabel: string
  /** 처리 마감 D-day — 계산 규칙 BE 확정 대기(Figma 대표값 고정) */
  dDayLabel: string | null
  requesterName: string
  requesterRole: MentorTeamMemberRole
  desired: MentorMockSlot
  proposal: MentorMockSlot | null
  confirmed: MentorMockSlot | null
  mentorResponseNote?: string
  /** 최근 활동 시각 — 목록 정렬·기간 필터 기준 */
  activityAt: string
}

interface MentorMockDb {
  mentorName: string
  teams: MentorMockTeam[]
  /** '해야 할 일' — 집계 규칙 BE 확정 대기라 Figma 대표값 고정(hero 5건 = countLabel 합) */
  todos: MentorTodoItem[]
  /**
   * 멘토링 예약 요청 — Figma 2553:3820 대표 더미 재현.
   * 완료(completed) 행은 별도 저장 없이 유효 일지에서 파생(buildMentoringRequestsData)
   * — 일지 제출 시 예약 COMPLETED 동기화 계약과 정합(M3 일지 PR과 자연 연동).
   * 주의(Figma 더미 드리프트, 기록용): 추천시스템 팀은 진행 중 요청(요청 대기)과 확정 예약이
   * 공존 — '팀당 진행 중 1건'(requested/counter_proposed/confirmed) partial unique 와 모순이나
   * 두 frame(2553:3554/3820) 대표값을 모두 보존한다. 제약 자체는 요청 생성(수강생) 시점
   * 검증이라 멘토 응답 mutation 에서는 상태 전이 guard 만 적용한다.
   */
  requests: MentorMockRequest[]
}

export const mentorDb: MentorMockDb = {
  mentorName: '임수현',
  todos: [
    { type: 'log_write', countLabel: '2건', required: true },
    { type: 'evaluation', countLabel: '1팀', required: true },
    { type: 'recommendation', countLabel: '1팀', required: false },
    { type: 'change_response', countLabel: '1건', required: true },
  ],
  teams: [
    {
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      cohortLabel: 'AI 5기',
      teamName: '추천시스템 팀',
      periodLabel: '2026-04-01 ~ 2026-07-15',
      status: 'in_progress',
      allocatedHours: 12,
      accumulatedHours: 8,
      recognizedHours: 8,
      members: [
        { studentId: 'stu_kim', name: '김수강', role: 'pm' },
        { studentId: 'stu_park', name: '박지호', role: 'member' },
        { studentId: 'stu_choi', name: '최유나', role: 'member' },
        { studentId: 'stu_han', name: '한지우', role: 'member' },
        { studentId: 'stu_song', name: '송하늘', role: 'member' },
      ],
      reservationSummary: { inProgress: 1, confirmed: 1, completed: 3 },
      nextConfirmed: {
        reservationId: 'res_rec_5',
        startsAt: '2026-05-28T14:00',
        dayOfWeekLabel: '수',
        locationTypeLabel: '온라인',
        locationDetailLabel: 'Zoom',
        expectedMinutes: 90,
        requesterName: '김수강',
        dDayLabel: 'D-1',
      },
      logs: [
        {
          logId: 'log_rec_4',
          performedAt: '2026-05-26T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 90,
          recognizedHours: 1.5,
          status: 'valid',
          summary: '추천 모델 v2 평가 지표 검토 + 다음 액션 정리',
        },
        {
          logId: 'log_rec_3',
          performedAt: '2026-05-20T19:00',
          locationLabel: '오프라인 · 강의장 B',
          actualMinutes: 120,
          recognizedHours: 2,
          status: 'valid',
          summary: '콜드 스타트 케이스 디버깅 라이브 + 팀원 1:1 점검',
        },
        {
          logId: 'log_rec_2',
          performedAt: '2026-05-14T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 90,
          recognizedHours: 1.5,
          status: 'valid',
          summary: '임베딩 모델 비교 실험 결과 리뷰',
        },
        {
          logId: 'log_rec_1',
          performedAt: '2026-05-08T19:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 180,
          recognizedHours: 3,
          status: 'valid',
          summary: '초기 PRD 검토 + 데이터 파이프라인 설계 자문',
        },
      ],
    },
    {
      teamId: 'team_dm',
      assignmentId: 'asgn_dm',
      cohortLabel: 'DA 4기',
      teamName: '데이터마트 팀',
      periodLabel: '2026-03-23 ~ 2026-07-10',
      status: 'evaluation_needed',
      allocatedHours: 10,
      accumulatedHours: 10,
      recognizedHours: 10,
      // 팀 상세 시안은 추천시스템 팀만 — 나머지 팀원 구성은 mock 보강 데이터.
      members: [
        { studentId: 'stu_seo', name: '서지민', role: 'pm' },
        { studentId: 'stu_lee_d', name: '이도현', role: 'member' },
        { studentId: 'stu_kim_n', name: '김나윤', role: 'member' },
        { studentId: 'stu_jung', name: '정태호', role: 'member' },
      ],
      reservationSummary: { inProgress: 0, confirmed: 1, completed: 4 },
      nextConfirmed: {
        reservationId: 'res_dm_5',
        startsAt: '2026-05-29T19:00',
        dayOfWeekLabel: '목',
        locationTypeLabel: '오프라인',
        locationDetailLabel: '강의장 B',
        expectedMinutes: 120,
        requesterName: '서지민',
        dDayLabel: null,
      },
      logs: [
        {
          logId: 'log_dm_4',
          performedAt: '2026-05-24T19:00',
          locationLabel: '오프라인 · 강의장 B',
          actualMinutes: 120,
          recognizedHours: 2,
          status: 'valid',
          summary: '집계 마트 성능 점검 + 지표 정의 검토',
        },
        {
          logId: 'log_dm_3',
          performedAt: '2026-05-16T19:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 150,
          recognizedHours: 2.5,
          status: 'valid',
          summary: '대시보드 지표 검증 세션',
        },
        {
          logId: 'log_dm_2',
          performedAt: '2026-05-09T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 120,
          recognizedHours: 2,
          status: 'valid',
          summary: 'ETL 파이프라인 리뷰',
        },
        {
          logId: 'log_dm_1',
          performedAt: '2026-04-30T19:00',
          locationLabel: '오프라인 · 강의장 B',
          actualMinutes: 210,
          recognizedHours: 3.5,
          status: 'valid',
          summary: '데이터 모델링 기초 자문',
        },
      ],
    },
    {
      teamId: 'team_ts',
      assignmentId: 'asgn_ts',
      cohortLabel: 'AI 5기',
      teamName: '트러블슈팅 팀',
      periodLabel: '2026-04-06 ~ 2026-07-15',
      status: 'change_requested',
      allocatedHours: 8,
      // 수정 요청 일지(5/22 60분)는 재제출 전 누적·인정 미반영(기존 유효본 기준, Figma 3.5h).
      accumulatedHours: 3.5,
      recognizedHours: 3.5,
      members: [
        { studentId: 'stu_park_j', name: '박준영', role: 'pm' },
        { studentId: 'stu_kim_h', name: '김하린', role: 'member' },
        { studentId: 'stu_lee_s', name: '이서준', role: 'member' },
        { studentId: 'stu_choi_m', name: '최민재', role: 'member' },
        { studentId: 'stu_yoon', name: '윤지아', role: 'member' },
        { studentId: 'stu_kang', name: '강도윤', role: 'member' },
      ],
      reservationSummary: { inProgress: 0, confirmed: 0, completed: 3 },
      nextConfirmed: null,
      logs: [
        {
          logId: 'log_ts_3',
          performedAt: '2026-05-22T19:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 60,
          recognizedHours: null,
          status: 'change_requested',
          statusNote: '일지 보강 필요',
          summary: '장애 재현 시나리오 점검',
        },
        {
          logId: 'log_ts_2',
          performedAt: '2026-05-15T19:00',
          locationLabel: '오프라인 · 강의장 B',
          actualMinutes: 120,
          recognizedHours: 2,
          status: 'valid',
          summary: '장애 로그 분석 실습',
        },
        {
          logId: 'log_ts_1',
          performedAt: '2026-05-07T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 90,
          recognizedHours: 1.5,
          status: 'valid',
          summary: '트러블슈팅 리포트 양식 점검',
        },
      ],
    },
    {
      teamId: 'team_nlp',
      assignmentId: 'asgn_nlp',
      cohortLabel: 'DA 4기',
      teamName: 'NLP 분석 팀',
      periodLabel: '2026-03-02 ~ 2026-05-15',
      status: 'completed',
      allocatedHours: 10,
      accumulatedHours: 11.5,
      recognizedHours: 10,
      members: [
        { studentId: 'stu_han_y', name: '한예린', role: 'pm' },
        { studentId: 'stu_kim_d', name: '김도윤', role: 'member' },
        { studentId: 'stu_park_s', name: '박시우', role: 'member' },
        { studentId: 'stu_lee_g', name: '이가은', role: 'member' },
        { studentId: 'stu_jo', name: '조윤서', role: 'member' },
      ],
      reservationSummary: { inProgress: 0, confirmed: 0, completed: 4 },
      nextConfirmed: null,
      logs: [
        {
          logId: 'log_nlp_4',
          performedAt: '2026-05-10T19:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 180,
          // 잔여 1.5h까지만 인정 — 초과 1.5h는 기록 보존(초과 멘토링 · 활동 인정 시간 없음).
          recognizedHours: 1.5,
          status: 'valid',
          summary: '최종 발표 리허설 피드백',
        },
        {
          logId: 'log_nlp_3',
          performedAt: '2026-05-02T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 180,
          recognizedHours: 3,
          status: 'valid',
          summary: '토픽 모델링 결과 해석 자문',
        },
        {
          logId: 'log_nlp_2',
          performedAt: '2026-04-25T19:00',
          locationLabel: '오프라인 · 강의장 B',
          actualMinutes: 150,
          recognizedHours: 2.5,
          status: 'valid',
          summary: '형태소 분석 파이프라인 리뷰',
        },
        {
          logId: 'log_nlp_1',
          performedAt: '2026-04-18T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 180,
          recognizedHours: 3,
          status: 'valid',
          summary: '분석 주제 정의 + 코퍼스 수집 전략',
        },
      ],
    },
  ],
  requests: [
    // 진행 중 요청 — Figma 2553:3820 카드 3장(요청 대기 2 · 조정 제안 1) 원문 재현.
    {
      requestId: 'req_rec_6',
      teamId: 'team_rec',
      status: 'requested',
      requestedAtLabel: '2026-05-26 19:42',
      dDayLabel: 'D-2',
      requesterName: '김수강',
      requesterRole: 'pm',
      desired: {
        dateTimeLabel: '5/29(목) 14:00 ~ 16:00',
        startsAt: '2026-05-29T14:00',
        dayOfWeekLabel: '목',
        placeType: 'online',
        placeDetail: 'Zoom',
        expectedMinutes: 90,
        // 목록 카드는 1줄 말줄임, 모달은 전문 노출(같은 메모 — Figma 두 frame 원문 합본).
        memo: '콜드 스타트 사용자 처리 로직과 임베딩 모델 비교 결과 검토 부탁드립니다. Hybrid 모델 실험도 같이 보면 좋겠습니다.',
      },
      proposal: null,
      confirmed: null,
      activityAt: '2026-05-26T19:42',
    },
    {
      requestId: 'req_ts_4',
      teamId: 'team_ts',
      status: 'requested',
      requestedAtLabel: '2026-05-27 10:15',
      dDayLabel: 'D-3',
      requesterName: '이재현',
      requesterRole: 'member',
      desired: {
        dateTimeLabel: '5/30(금) 19:00 ~ 21:00',
        startsAt: '2026-05-30T19:00',
        dayOfWeekLabel: '금',
        placeType: 'offline',
        placeDetail: '강의장 B',
        expectedMinutes: 120,
        memo: '분산 트레이싱 구성 + 장애 재현 시나리오 라이브 디버깅 1회 부탁드립니다.',
      },
      proposal: null,
      confirmed: null,
      activityAt: '2026-05-27T10:15',
    },
    {
      requestId: 'req_dm_6',
      teamId: 'team_dm',
      status: 'counter_proposed',
      requestedAtLabel: '2026-05-28 09:30',
      dDayLabel: 'D-6',
      requesterName: '한승민',
      requesterRole: 'pm',
      desired: {
        dateTimeLabel: '6/2(월) 14:00 ~ 16:00',
        startsAt: '2026-06-02T14:00',
        dayOfWeekLabel: '월',
        placeType: 'online',
        placeDetail: 'Zoom',
        expectedMinutes: 120,
        memo: '테이블 설계 리뷰 및 인덱스 전략 자문. 멘토님 가능한 시간대로 조정해주세요.',
      },
      proposal: {
        dateTimeLabel: '6/3(화) 19:00 ~ 21:00',
        startsAt: '2026-06-03T19:00',
        dayOfWeekLabel: '화',
        placeType: 'online',
        placeDetail: 'Zoom',
        expectedMinutes: 90,
      },
      // 조정 제안 응답 메모(수강생 공개 mentorResponseNote, 2026-06-01 결정) — 모달 더미 원문.
      mentorResponseNote:
        '제안하신 시간과 겹치는 일정이 있어 다음 날로 옮겨드립니다. 90분 안에 핵심만 빠르게 보겠습니다.',
      confirmed: null,
      activityAt: '2026-06-01T10:00',
    },
    // 확정 — M1 대시보드·팀 상세 nextConfirmed(res_rec_5/res_dm_5)와 동일 예약(id 공유, 단일 상태).
    {
      requestId: 'res_rec_5',
      teamId: 'team_rec',
      status: 'confirmed',
      requestedAtLabel: '2026-05-20 11:20',
      dDayLabel: null,
      requesterName: '김수강',
      requesterRole: 'pm',
      desired: {
        dateTimeLabel: '5/28(수) 14:00 ~ 15:30',
        startsAt: '2026-05-28T14:00',
        dayOfWeekLabel: '수',
        placeType: 'online',
        placeDetail: 'Zoom',
        expectedMinutes: 90,
      },
      proposal: null,
      confirmed: {
        dateTimeLabel: '5/28(수) 14:00 ~ 15:30',
        startsAt: '2026-05-28T14:00',
        dayOfWeekLabel: '수',
        placeType: 'online',
        placeDetail: 'Zoom',
        expectedMinutes: 90,
      },
      activityAt: '2026-05-21T09:00',
    },
    {
      requestId: 'res_dm_5',
      teamId: 'team_dm',
      status: 'confirmed',
      requestedAtLabel: '2026-05-22 13:05',
      dDayLabel: null,
      requesterName: '서지민',
      requesterRole: 'pm',
      desired: {
        dateTimeLabel: '5/29(목) 19:00 ~ 21:00',
        startsAt: '2026-05-29T19:00',
        dayOfWeekLabel: '목',
        placeType: 'offline',
        placeDetail: '강의장 B',
        expectedMinutes: 120,
      },
      proposal: null,
      confirmed: {
        dateTimeLabel: '5/29(목) 19:00 ~ 21:00',
        startsAt: '2026-05-29T19:00',
        dayOfWeekLabel: '목',
        placeType: 'offline',
        placeDetail: '강의장 B',
        expectedMinutes: 120,
      },
      activityAt: '2026-05-23T10:30',
    },
    // 거절·취소 — Figma 탭 카운트 '거절·취소 4' 대응(카드 시안 미제공, mock 보강 데이터).
    {
      requestId: 'req_nlp_5',
      teamId: 'team_nlp',
      status: 'rejected',
      requestedAtLabel: '2026-05-11 17:40',
      dDayLabel: null,
      requesterName: '한예린',
      requesterRole: 'pm',
      desired: {
        dateTimeLabel: '5/13(수) 19:00 ~ 21:00',
        startsAt: '2026-05-13T19:00',
        dayOfWeekLabel: '수',
        placeType: 'online',
        placeDetail: 'Zoom',
        expectedMinutes: 120,
        memo: '최종 발표 전 리허설 추가 멘토링 부탁드립니다.',
      },
      proposal: null,
      confirmed: null,
      mentorResponseNote:
        '발표 리허설은 5/10 세션에서 함께 진행했어요. 추가 일정은 어렵습니다.',
      activityAt: '2026-05-12T09:20',
    },
    {
      requestId: 'req_ts_3c',
      teamId: 'team_ts',
      status: 'canceled',
      requestedAtLabel: '2026-05-16 10:00',
      dDayLabel: null,
      requesterName: '박준영',
      requesterRole: 'pm',
      desired: {
        dateTimeLabel: '5/18(월) 14:00 ~ 15:00',
        startsAt: '2026-05-18T14:00',
        dayOfWeekLabel: '월',
        placeType: 'online',
        placeDetail: 'Zoom',
        expectedMinutes: 60,
      },
      proposal: null,
      confirmed: null,
      activityAt: '2026-05-17T08:30',
    },
    {
      requestId: 'req_dm_4r',
      teamId: 'team_dm',
      status: 'rejected',
      requestedAtLabel: '2026-05-04 21:10',
      dDayLabel: null,
      requesterName: '이도현',
      requesterRole: 'member',
      desired: {
        dateTimeLabel: '5/6(수) 09:00 ~ 10:00',
        startsAt: '2026-05-06T09:00',
        dayOfWeekLabel: '수',
        placeType: 'offline',
        placeDetail: '강의장 A',
        expectedMinutes: 60,
        memo: '아침 시간대 가능하실까요?',
      },
      proposal: null,
      confirmed: null,
      mentorResponseNote:
        '오전 시간대는 다른 일정과 겹쳐 어려워요. 저녁 시간대로 다시 요청해주세요.',
      activityAt: '2026-05-05T10:00',
    },
    {
      requestId: 'req_rec_2c',
      teamId: 'team_rec',
      status: 'canceled',
      requestedAtLabel: '2026-04-30 15:25',
      dDayLabel: null,
      requesterName: '박지호',
      requesterRole: 'member',
      desired: {
        dateTimeLabel: '5/2(토) 14:00 ~ 16:00',
        startsAt: '2026-05-02T14:00',
        dayOfWeekLabel: '토',
        placeType: 'online',
        placeDetail: 'Zoom',
        expectedMinutes: 120,
      },
      proposal: null,
      confirmed: null,
      activityAt: '2026-05-01T11:00',
    },
  ],
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** '2026-05-26T14:00' → '5/26' (Figma 표기: 월 무패딩·일 2자리 유지) */
const dateLabelOf = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${Number(m)}/${d}`
}
const timeLabelOf = (iso: string) => iso.slice(11, 16)
const yearLabelOf = (iso: string) => iso.slice(0, 4)

const isActive = (team: MentorMockTeam) =>
  team.status !== 'completed' && team.status !== 'early_ended'

/** 팀 → 배정 read model. 잔여·초과·N시간 완료는 항상 파생(상태 변경 시 일관 유지). */
export function toAssignment(team: MentorMockTeam): MentorTeamAssignment {
  return {
    assignmentId: team.assignmentId,
    teamId: team.teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    memberCount: team.members.length,
    status: team.status,
    allocatedHours: team.allocatedHours,
    accumulatedHours: team.accumulatedHours,
    recognizedHours: team.recognizedHours,
    remainingHours: round1(
      Math.max(team.allocatedHours - team.recognizedHours, 0),
    ),
    excessHours: round1(
      Math.max(team.accumulatedHours - team.recognizedHours, 0),
    ),
    nHoursDone: team.recognizedHours >= team.allocatedHours,
  }
}

/**
 * 인정 시간 SSOT 수식(mentoring.md·DB설계 공통) — 일지 제출 PR(M3+)에서 사용 예정.
 * recognized = min(actual, max(remaining, 0)) / 초과분은 기록만 보존.
 */
export function recognizeMinutes(team: MentorMockTeam, actualMinutes: number) {
  const remainingMinutes = Math.max(
    team.allocatedHours * 60 - team.recognizedHours * 60,
    0,
  )
  const recognized = Math.min(actualMinutes, remainingMinutes)
  return {
    recognizedHours: round1(recognized / 60),
    excessHours: round1((actualMinutes - recognized) / 60),
  }
}

const nextReservationOf = (
  team: MentorMockTeam,
): MentorNextReservation | null =>
  team.nextConfirmed && {
    reservationId: team.nextConfirmed.reservationId,
    dateLabel: dateLabelOf(team.nextConfirmed.startsAt),
    dayOfWeekLabel: team.nextConfirmed.dayOfWeekLabel,
    timeLabel: timeLabelOf(team.nextConfirmed.startsAt),
    locationTypeLabel: team.nextConfirmed.locationTypeLabel,
    locationDetailLabel: team.nextConfirmed.locationDetailLabel,
    expectedMinutes: team.nextConfirmed.expectedMinutes,
    requesterName: team.nextConfirmed.requesterName,
    dDayLabel: team.nextConfirmed.dDayLabel,
  }

/** GET /mentor/v1/dashboard 응답 빌더. */
export function buildDashboardData(): MentorDashboardData {
  // 대시보드 노출 기준: 완료·조기 종료 팀 제외(Figma '3팀') — 노출 규칙은 BE 확정 대기 TODO.
  const active = mentorDb.teams.filter(isActive).map(toAssignment)
  const todoCount = mentorDb.todos.reduce(
    (sum, t) => sum + (parseInt(t.countLabel, 10) || 0),
    0,
  )

  const sessions = mentorDb.teams
    .filter((t) => t.nextConfirmed)
    .sort((a, b) =>
      a.nextConfirmed!.startsAt.localeCompare(b.nextConfirmed!.startsAt),
    )
    .map((t) => ({
      reservationId: t.nextConfirmed!.reservationId,
      teamId: t.teamId,
      cohortLabel: t.cohortLabel,
      teamName: t.teamName,
      dateLabel: dateLabelOf(t.nextConfirmed!.startsAt),
      dayOfWeekLabel: t.nextConfirmed!.dayOfWeekLabel,
      timeLabel: timeLabelOf(t.nextConfirmed!.startsAt),
      locationTypeLabel: t.nextConfirmed!.locationTypeLabel,
      locationDetailLabel: t.nextConfirmed!.locationDetailLabel,
      expectedMinutes: t.nextConfirmed!.expectedMinutes,
      dDayLabel: t.nextConfirmed!.dDayLabel,
      requesterName: t.nextConfirmed!.requesterName,
    }))

  const recentLogs = mentorDb.teams
    .flatMap((team) => team.logs.map((log) => ({ team, log })))
    .sort((a, b) => b.log.performedAt.localeCompare(a.log.performedAt))
    .slice(0, 3) // '최근 7일' 대표 3건(Figma)
    .map(({ team, log }) => ({
      logId: log.logId,
      teamId: team.teamId,
      cohortLabel: team.cohortLabel,
      teamName: team.teamName,
      dateLabel: dateLabelOf(log.performedAt),
      yearLabel: yearLabelOf(log.performedAt),
      actualMinutes: log.actualMinutes,
      recognizedHours: log.recognizedHours,
      status: log.status,
      statusNote: log.statusNote,
    }))

  return {
    mentor: {
      name: mentorDb.mentorName,
      assignedTeamCount: active.length,
      todoCount,
    },
    teamCards: active,
    todos: mentorDb.todos,
    upcoming: { confirmedCount: sessions.length, sessions },
    teamTable: active,
    recentLogs,
  }
}

/** GET /mentor/v1/teams 응답 빌더. */
export function buildTeamsData(): MentorTeamsData {
  const teams = mentorDb.teams.map(toAssignment)
  return {
    kpis: {
      // '진행 중' = N시간 미완료 일반 진행(평가 필요·완료·조기 종료 제외) — Figma 2팀 기준 산정.
      inProgress: teams.filter(
        (t) =>
          !t.nHoursDone &&
          t.status !== 'evaluation_needed' &&
          t.status !== 'completed' &&
          t.status !== 'early_ended',
      ).length,
      // '예약 대기' = 멘토 확인이 필요한 진행 중 예약 요청 건수(요청 확인 필요) — Figma 1팀 기준.
      reservationWaiting: mentorDb.teams.reduce(
        (sum, t) => sum + t.reservationSummary.inProgress,
        0,
      ),
      evaluationNeeded: teams.filter((t) => t.status === 'evaluation_needed')
        .length,
      changeRequested: teams.filter((t) => t.status === 'change_requested')
        .length,
    },
    totalTeamCount: teams.length,
    teams,
  }
}

/** GET /mentor/v1/teams/{teamId} 응답 빌더 — 미배정 팀이면 null(403 처리). */
export function buildTeamDetailData(
  teamId: string,
): MentorTeamDetailData | null {
  const team = mentorDb.teams.find((t) => t.teamId === teamId)
  if (!team) return null
  const assignment = toAssignment(team)
  // 평가·추천 게이트: N시간 완료 또는 조기 종료 시에만 활성(422 MENTOR_EVALUATION_NOT_ELIGIBLE).
  const locked = !(assignment.nHoursDone || team.status === 'early_ended')
  return {
    assignment,
    periodLabel: team.periodLabel,
    mentorName: mentorDb.mentorName,
    members: team.members,
    reservationSummary: team.reservationSummary,
    nextReservation: nextReservationOf(team),
    evaluation: {
      locked,
      lockReasonLabel: 'N시간 완료 후 활성',
      progressHours: assignment.recognizedHours,
      allocatedHours: assignment.allocatedHours,
      percent:
        assignment.allocatedHours > 0
          ? Math.round(
              (assignment.recognizedHours / assignment.allocatedHours) * 100,
            )
          : 0,
      // 제출 상태 연동은 평가·추천 PR(M5)에서 — Figma 시안 라벨은 '대기'만 정의.
      evaluationStatusLabel: team.status === 'completed' ? '완료' : '대기',
      recommendationStatusLabel: team.status === 'completed' ? '완료' : '대기',
    },
    recentLogs: team.logs.map((log) => ({
      logId: log.logId,
      datetimeLabel: `${dateLabelOf(log.performedAt)} ${timeLabelOf(log.performedAt)}`,
      locationLabel: log.locationLabel,
      actualMinutes: log.actualMinutes,
      recognizedHours: log.recognizedHours,
      summary: log.summary,
      status: log.status,
      statusNote: log.statusNote,
    })),
  }
}

// ───────────────────────── 멘토링 예약 (M2) ─────────────────────────

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

/** '2026-05-26T14:00' + 90분 → '15:30' (완료 일정 라벨 파생용) */
function endTimeLabelOf(iso: string, minutes: number) {
  const [h, m] = iso.slice(11, 16).split(':').map(Number)
  const total = h * 60 + m + minutes
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
}

const placeTypeOfLabel = (label: string): MentoringPlaceType =>
  label === '온라인' ? 'online' : label === '오프라인' ? 'offline' : 'etc'

/** 'YYYY-MM-DDTHH:mm' 현재 시각 — 응답 mutation 후 activityAt 갱신용 */
function nowStamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** mock 슬롯 → read model 슬롯(정렬 메타 startsAt 등 mock 전용 필드 제거) */
function stripSlot(slot: MentorMockSlot): MentoringRequestSlot {
  return {
    dateTimeLabel: slot.dateTimeLabel,
    placeType: slot.placeType,
    placeDetail: slot.placeDetail,
    expectedMinutes: slot.expectedMinutes,
    memo: slot.memo,
  }
}

function toRequestItem(req: MentorMockRequest): MentoringRequestItem {
  const team = mentorDb.teams.find((t) => t.teamId === req.teamId)
  return {
    requestId: req.requestId,
    teamId: req.teamId,
    cohortLabel: team?.cohortLabel ?? '',
    teamName: team?.teamName ?? '',
    status: req.status,
    dDayLabel: req.dDayLabel,
    requestedAtLabel: req.requestedAtLabel,
    requester: { name: req.requesterName, role: req.requesterRole },
    desired: stripSlot(req.desired),
    proposal: req.proposal && stripSlot(req.proposal),
    confirmed: req.confirmed && stripSlot(req.confirmed),
    mentorResponseNote: req.mentorResponseNote,
    activityAt: req.activityAt,
  }
}

/**
 * 완료 예약 — 별도 저장 없이 유효 일지에서 파생(일지 제출 시 예약 COMPLETED 동기화 계약 재현,
 * M3 일지 제출 PR과 자연 연동). 요청자·요청 메모는 일지에 보존되지 않아 PM 대표로 대체(mock 한정).
 * Figma 더미 '완료 12'와는 건수 드리프트(유효 일지 14건) — M1 상태 공유를 우선한다.
 */
function deriveCompletedRequests(): MentoringRequestItem[] {
  return mentorDb.teams.flatMap((team) => {
    const pm = team.members.find((m) => m.role === 'pm') ?? team.members[0]
    return team.logs
      .filter((log) => log.status === 'valid')
      .map((log): MentoringRequestItem => {
        const [typeLabel, detail = ''] = log.locationLabel.split(' · ')
        const dow = DOW_LABELS[new Date(log.performedAt).getDay()]
        const slot: MentoringRequestSlot = {
          dateTimeLabel: `${dateLabelOf(log.performedAt)}(${dow}) ${timeLabelOf(log.performedAt)} ~ ${endTimeLabelOf(log.performedAt, log.actualMinutes)}`,
          placeType: placeTypeOfLabel(typeLabel),
          placeDetail: detail,
          expectedMinutes: log.actualMinutes,
        }
        return {
          requestId: `req_${log.logId}`,
          teamId: team.teamId,
          cohortLabel: team.cohortLabel,
          teamName: team.teamName,
          status: 'completed',
          dDayLabel: null,
          requestedAtLabel: `${log.performedAt.slice(0, 10)} ${timeLabelOf(log.performedAt)}`,
          requester: { name: pm?.name ?? '', role: pm?.role ?? 'pm' },
          desired: slot,
          proposal: null,
          confirmed: slot,
          activityAt: log.performedAt,
        }
      })
  })
}

/**
 * GET /mentor/v1/mentoring-requests 응답 빌더.
 * 정렬: 진행 중(요청 대기·조정 제안, Figma 카드 순) → 확정(임박순) → 거절·취소 → 완료(최신순).
 */
export function buildMentoringRequestsData(): MentoringRequestsData {
  const stored = mentorDb.requests.map(toRequestItem)
  const open = stored.filter(
    (r) => r.status === 'requested' || r.status === 'counter_proposed',
  )
  const confirmed = stored
    .filter((r) => r.status === 'confirmed')
    .sort((a, b) => a.activityAt.localeCompare(b.activityAt))
  const closed = stored
    .filter((r) => r.status === 'rejected' || r.status === 'canceled')
    .sort((a, b) => b.activityAt.localeCompare(a.activityAt))
  const completed = deriveCompletedRequests().sort((a, b) =>
    b.activityAt.localeCompare(a.activityAt),
  )
  return { requests: [...open, ...confirmed, ...closed, ...completed] }
}

/** GET /mentor/v1/mentoring-requests/{reservationId} — 미존재 시 null(404 처리). */
export function buildMentoringRequestDetail(
  requestId: string,
): MentoringRequestItem | null {
  return (
    buildMentoringRequestsData().requests.find(
      (r) => r.requestId === requestId,
    ) ?? null
  )
}

export type MentoringRequestMockAction =
  | 'confirm'
  | 'reject'
  | 'counter-propose'
  | 'cancel'

export type MentoringRequestMutationResult =
  | { ok: true; request: MentoringRequestItem }
  | { ok: false; status: number; code: string; message: string }

const mockError = (
  status: number,
  code: string,
  message: string,
): MentoringRequestMutationResult => ({ ok: false, status, code, message })

// 코드명은 MENTOR_RESERVATION_REQUIRED_FIELD_MISSING(명세 확정) 외 추정 — 명세 에러 22종 대조 TODO.
const invalidTransition = (message: string) =>
  mockError(409, 'MENTOR_RESERVATION_INVALID_TRANSITION', message)

/** 확정·조정·변경 공통 필수 필드 — 일정 + 예상 시간 + 장소(422, P0-MTR-RES). */
const slotComplete = (p?: MentoringRequestActionPayload) =>
  !!p?.dateTimeLabel?.trim() &&
  !!p.placeType &&
  !!p.placeDetail?.trim() &&
  typeof p.expectedMinutes === 'number' &&
  p.expectedMinutes > 0

function toNextReservation(
  req: MentorMockRequest,
  slot: MentorMockSlot,
): MentorMockReservation {
  return {
    reservationId: req.requestId,
    startsAt: slot.startsAt,
    dayOfWeekLabel: slot.dayOfWeekLabel,
    locationTypeLabel: MENTORING_PLACE_TYPE_LABEL[slot.placeType],
    locationDetailLabel: slot.placeDetail,
    expectedMinutes: slot.expectedMinutes,
    requesterName: req.requesterName,
    // 가장 임박 건 D-day 부여 규칙 BE 확정 대기 — 신규 확정 건은 미표시
    dDayLabel: null,
  }
}

/** payload(자유 텍스트 일정) → mock 슬롯. 정렬 메타는 base 슬롯에서 승계(BE ISO 확정 시 제거 TODO). */
function payloadToSlot(
  payload: MentoringRequestActionPayload,
  base: MentorMockSlot,
): MentorMockSlot {
  return {
    dateTimeLabel: payload.dateTimeLabel!.trim(),
    placeType: payload.placeType!,
    placeDetail: payload.placeDetail!.trim(),
    expectedMinutes: payload.expectedMinutes!,
    startsAt: base.startsAt,
    dayOfWeekLabel: base.dayOfWeekLabel,
  }
}

/**
 * 멘토 예약 응답 — POST /mentoring-requests/{id}/{confirm|reject|counter-propose|cancel}.
 * 상태 전이(mentoring.md): REQUESTED→(멘토)CONFIRMED/REJECTED/COUNTER_PROPOSED.
 * 응답 결과는 M1 화면 상태(팀 reservationSummary·nextConfirmed)에 즉시 반영(상태형 mock).
 * 역할 교차(수강생 화면 mocks) 반영은 BE 계약 확정 시 — student/mentoring mock 은 무접촉.
 */
export function respondToMentoringRequest(
  requestId: string,
  action: MentoringRequestMockAction,
  payload?: MentoringRequestActionPayload,
): MentoringRequestMutationResult {
  const req = mentorDb.requests.find((r) => r.requestId === requestId)
  if (!req)
    return mockError(
      404,
      'MENTOR_RESERVATION_NOT_FOUND',
      '예약 요청을 찾을 수 없습니다.',
    )
  const team = mentorDb.teams.find((t) => t.teamId === req.teamId)

  switch (action) {
    case 'confirm': {
      // COUNTER_PROPOSED 의 확정은 수강생 몫(재조정 제안 없음) — 멘토 확정은 REQUESTED 에서만.
      if (req.status !== 'requested')
        return invalidTransition('요청 대기 상태에서만 확정할 수 있습니다.')
      req.status = 'confirmed'
      req.confirmed = { ...req.desired } // 희망 일정 그대로
      req.activityAt = nowStamp()
      if (team) {
        team.reservationSummary.inProgress = Math.max(
          0,
          team.reservationSummary.inProgress - 1,
        )
        team.reservationSummary.confirmed += 1
        const next = toNextReservation(req, req.confirmed)
        if (!team.nextConfirmed || next.startsAt < team.nextConfirmed.startsAt)
          team.nextConfirmed = next
      }
      return { ok: true, request: toRequestItem(req) }
    }
    case 'reject': {
      if (req.status !== 'requested')
        return invalidTransition('요청 대기 상태에서만 거절할 수 있습니다.')
      req.status = 'rejected'
      // 거절 응답 메모는 선택 — 필수/선택 정책 미확정(P0-MTR-RES-005) TODO.
      req.mentorResponseNote = payload?.mentorResponseNote?.trim() || undefined
      req.activityAt = nowStamp()
      if (team)
        team.reservationSummary.inProgress = Math.max(
          0,
          team.reservationSummary.inProgress - 1,
        )
      return { ok: true, request: toRequestItem(req) }
    }
    case 'counter-propose': {
      // REQUESTED→COUNTER_PROPOSED + '제안 수정'(본인 제안 갱신 — 전이표 외 보강, BE 확정 대기 TODO)
      if (req.status !== 'requested' && req.status !== 'counter_proposed')
        return invalidTransition('진행 중 요청에만 조정 제안할 수 있습니다.')
      if (!slotComplete(payload))
        return mockError(
          422,
          'MENTOR_RESERVATION_REQUIRED_FIELD_MISSING',
          '일정·예상 시간·장소는 필수입니다.',
        )
      req.status = 'counter_proposed'
      req.proposal = payloadToSlot(payload!, req.desired)
      req.mentorResponseNote = payload?.mentorResponseNote?.trim() || undefined
      req.activityAt = nowStamp()
      return { ok: true, request: toRequestItem(req) }
    }
    case 'cancel': {
      // 명세상 cancel 은 확정 예약 취소(CONFIRMED→CANCELED) 전용. Figma '제안 취소'의
      // 제안 철회 전이는 명세 부재 — mock 한정으로 cancel 을 재사용해 REQUESTED 복귀(BE 확정 시 정합 TODO).
      if (req.status === 'counter_proposed') {
        req.status = 'requested'
        req.proposal = null
        req.mentorResponseNote = undefined
        req.activityAt = nowStamp()
        return { ok: true, request: toRequestItem(req) }
      }
      if (req.status === 'confirmed') {
        req.status = 'canceled'
        req.confirmed = null
        req.activityAt = nowStamp()
        if (team) {
          team.reservationSummary.confirmed = Math.max(
            0,
            team.reservationSummary.confirmed - 1,
          )
          if (team.nextConfirmed?.reservationId === req.requestId) {
            const rest = mentorDb.requests
              .filter(
                (r) =>
                  r.teamId === req.teamId &&
                  r.status === 'confirmed' &&
                  r.confirmed,
              )
              .sort((a, b) =>
                a.confirmed!.startsAt.localeCompare(b.confirmed!.startsAt),
              )
            team.nextConfirmed = rest.length
              ? toNextReservation(rest[0], rest[0].confirmed!)
              : null
          }
        }
        return { ok: true, request: toRequestItem(req) }
      }
      return invalidTransition('취소할 수 없는 상태입니다.')
    }
  }
}

/**
 * 확정 예약 일정·장소 변경 — PATCH /mentoring-requests/{id}/confirmed-details.
 * 확정 후 변경은 멘토만 가능(05-26 정책). 일정 라벨이 자유 텍스트라 대시보드 날짜 칸의
 * 정렬 메타(startsAt)는 유지 — BE ISO 계약 확정 시 정규화 TODO.
 */
export function updateConfirmedDetails(
  requestId: string,
  payload: MentoringRequestActionPayload,
): MentoringRequestMutationResult {
  const req = mentorDb.requests.find((r) => r.requestId === requestId)
  if (!req)
    return mockError(
      404,
      'MENTOR_RESERVATION_NOT_FOUND',
      '예약 요청을 찾을 수 없습니다.',
    )
  if (req.status !== 'confirmed' || !req.confirmed)
    return invalidTransition('확정 상태에서만 변경할 수 있습니다.')
  if (!slotComplete(payload))
    return mockError(
      422,
      'MENTOR_RESERVATION_REQUIRED_FIELD_MISSING',
      '일정·예상 시간·장소는 필수입니다.',
    )
  req.confirmed = payloadToSlot(payload, req.confirmed)
  if (payload.mentorResponseNote !== undefined)
    req.mentorResponseNote = payload.mentorResponseNote.trim() || undefined
  req.activityAt = nowStamp()
  const team = mentorDb.teams.find((t) => t.teamId === req.teamId)
  if (team?.nextConfirmed?.reservationId === req.requestId)
    team.nextConfirmed = {
      ...team.nextConfirmed,
      locationTypeLabel: MENTORING_PLACE_TYPE_LABEL[req.confirmed.placeType],
      locationDetailLabel: req.confirmed.placeDetail,
      expectedMinutes: req.confirmed.expectedMinutes,
    }
  return { ok: true, request: toRequestItem(req) }
}
