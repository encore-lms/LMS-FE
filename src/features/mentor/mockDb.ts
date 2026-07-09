import type {
  EvaluationScoreTuple,
  MenteeDetailData,
  MentorDashboardData,
  MentorEvaluationDraftPayload,
  MentorEvaluationMemberEntry,
  MentorEvaluationSheetData,
  MentorEvaluationStatus,
  MentorEvaluationSubmission,
  MentorEvaluationsData,
  MentorNextReservation,
  MentorRecommendationCandidate,
  MentorRecommendationDraftPayload,
  MentorRecommendationSheetData,
  MentorRecommendationStatus,
  MentorRecommendationSubmission,
  MentorRecommendationsData,
  MentorTeamAssignment,
  MentorTeamDetailData,
  MentorTeamMember,
  MentorTeamMemberRole,
  MentorTeamStatus,
  MentorTeamsData,
  MentorTodoItem,
  MentoringLogChangeRequest,
  MentoringLogDetailData,
  MentoringLogDraftPayload,
  MentoringLogFieldSnapshot,
  MentoringLogListItem,
  MentoringLogPhoto,
  MentoringLogStatus,
  MentoringLogTargetsData,
  MentoringLogsData,
  MentoringPlaceType,
  MentoringRequestActionPayload,
  MentoringRequestItem,
  MentoringRequestSlot,
  MentoringRequestStatus,
  MentoringRequestsData,
} from './types'
import {
  MENTORING_LOG_CHANGE_REASON_LABEL,
  MENTORING_PLACE_TYPE_LABEL,
} from './types'

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
  // ── M3 일지 상세 필드(선택) — 미지정 시 builder 가 기본값 파생 ──
  /** 참석 멘티 — 미지정이면 팀원 전원 참석 */
  attendedIds?: string[]
  /** 템플릿 항목 답변(fieldSnapshotId → value) — 미지정 시 summary 기반 기본 답변 파생 */
  answers?: Record<string, string>
  /** '2026-05-26 16:05' — 미지정 시 종료 시각으로 파생. 초안은 null 처리 */
  submittedAtLabel?: string
  /** 운영자 수정 요청 — change_requested 상태에서만 */
  changeRequest?: MentoringLogChangeRequest
  /** 활동 기록 사진 메타(표시 전용 — 업로드 계약 미확정) */
  photos?: MentoringLogPhoto[]
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
  /**
   * 제출 완료 멘토 평가·추천(mock) — 완료 팀(NLP 분석 팀)만 존재. 학생 상세(M3)의
   * 평가 5축·추천 카드 데이터 원천이며, M4 평가·추천 제출 mutation 이 이 상태를 확장한다.
   * 축 순서 고정: 기술·책임감·소통·성장·팀워크(점수 1~5 가정 — 범위 미확정 TODO).
   */
  evaluations: MentorMockEvaluation[]
  recommendations: MentorMockRecommendation[]
  /** 평가 임시 저장(MentorEvaluation.draftPayload) — teamId 키, 제출 시 제거 */
  evaluationDrafts: Record<string, MentorEvaluationDraftPayload>
  /** 추천 임시 저장 — teamId 키, 제출 시 제거 */
  recommendationDrafts: Record<string, MentorRecommendationDraftPayload>
}

export interface MentorMockEvaluation {
  teamId: string
  writtenAtLabel: string // '2026-05-15'
  /** 최종 제출 시각('2026-05-15 20:40') — submittedAt/lockedAt 대응(M4 제출 요약용) */
  submittedAtLabel?: string
  byStudent: Record<
    string,
    { axes: [number, number, number, number, number]; comment?: string }
  >
}

export interface MentorMockRecommendation {
  teamId: string
  /** 팀당 1명 추천 정책 — 추천 대상 학생. '추천 안 함'이면 null(targetStudentProfileId:null) */
  studentId: string | null
  submittedAtLabel: string // '2026-05-15 21:10'
  /** 증명서용 간략 요약(certificateSummary) — 추천 안 함이면 빈 문자열 */
  reason: string
  /** 수강생 즉시 알림 토글 — BE 계약 'Notification optional'(FE 보존, 확정 시 정합 TODO) */
  notify?: boolean
}

/** 학생 상세 '멘토 평가 5축' 고정 축 라벨(05-26 결정 — 운영 커스터마이즈 없음). */
export const EVALUATION_AXIS_LABELS = [
  '기술',
  '책임감',
  '소통',
  '성장',
  '팀워크',
] as const

// Figma 2553:4166/2582:6514 '운영 설정 항목' 6종 — 팀 템플릿 6개 · 필수 3 · 선택 3.
// 텍스트 항목 타입은 SHORT_TEXT/LONG_TEXT만(계약). 작성 산출물·활동 기록은 첨부형 —
// DB 계약에 첨부 필드 부재(스키마 갭 openQuestion)라 inputKind 로 FE 표시만 보강한다.
// mock 은 전 팀 동일 스냅샷 — 팀별 항목 설정(운영 PR)·배정 시점 스냅샷 분기는 BE 확정 시.
export const LOG_FIELD_SNAPSHOT: MentoringLogFieldSnapshot[] = [
  {
    fieldSnapshotId: 'fld_agenda',
    name: '주요 아젠다',
    description: '이번 멘토링에서 다룬 핵심 안건을 불릿으로 정리',
    required: true,
    type: 'long_text',
    charLimit: 500,
    order: 1,
  },
  {
    fieldSnapshotId: 'fld_progress',
    name: '수행 내용',
    description: '회의 흐름에 따른 상세 진행 내용 · 계층 구조 사용 가능',
    required: true,
    type: 'long_text',
    charLimit: 3000,
    order: 2,
  },
  {
    fieldSnapshotId: 'fld_opinion',
    name: '멘토 의견 및 요청 사항',
    description: '팀에게 전달하는 권장사항·후속 액션',
    required: true,
    type: 'long_text',
    charLimit: 500,
    order: 3,
  },
  {
    fieldSnapshotId: 'fld_codereview',
    name: '코드리뷰 내용',
    description: '코드 단위 피드백',
    required: false,
    type: 'long_text',
    charLimit: null,
    order: 4,
  },
  {
    fieldSnapshotId: 'fld_artifacts',
    name: '작성 산출물',
    description: '회차 중 또는 회차 직후 생성된 자료 첨부 (선택)',
    required: false,
    type: 'long_text',
    charLimit: null,
    order: 5,
    inputKind: 'files',
  },
  {
    fieldSnapshotId: 'fld_photos',
    name: '활동 기록',
    description: '회차 시작·종료 시각이 표시된 사진 (오프라인 회차 필수 권장)',
    required: false,
    type: 'long_text',
    charLimit: null,
    order: 6,
    inputKind: 'photos',
  },
]

// 일지 상세 모달(2582:6514) 원문 답변 — 추천시스템 팀 4회차(log_rec_4)에 매핑.
// Figma 모달 더미는 'AI 캠프 22기 LLM 추천 시스템 팀' 세계관이나 mock 은 M1 팀 상태를
// 공유(목업 세계관 불일치 openQuestion — 2553:4040 목록 세계관을 정본으로 사용).
const REC4_ANSWERS: Record<string, string> = {
  fld_agenda: [
    '프로젝트 전체 진행 현황',
    '데이터 수집 및 저장',
    '추천 시스템 구현 방향 — 추천 시스템 및 LLM 아키텍처 / 백엔드 및 프론트엔드',
    '중간 발표 준비 점검',
  ].join('\n'),
  fld_progress: [
    '● 프로젝트 진행 현황',
    '- 데이터 수집 및 적재 완료 (상품, 리뷰, 도메인 데이터)',
    '- 상품 및 리뷰 데이터 임베딩 및 DB 적재 완료',
    '- LangGraph 기반 추천 및 QA 아키텍처 설계 완료 (테스트 미진행)',
    '- 백엔드 일부 기능 구현 진행 중 — OAuth 로그인(구글·카카오·네이버), 사용자/반려동물 정보 저장',
    '- 프론트엔드 — UI 기획 완료 (Figma 기반), 프레임워크 Django로 변경 진행 중',
    '● 데이터 수집 및 저장',
    '- 1차 데이터 수집 완료, 품질 문제 확인',
    '- 도메인 지식 데이터 출처 불명확 · 매핑 어려움 → 전수 검증(약 300~400건) 또는 유효 데이터만 선별 후 활용 방식 재검토',
    '- 상품 리뷰 데이터 결측치 약 50% — 초기 단계는 Null 유지 또는 단순 대체값 사용',
    '● 추천 시스템 구현 방향',
    '- LangGraph 기반 구조 — Intent 분류 후 QA / 추천 분기 + 응답 병합',
    '- 주요 Agent — Intent Agent / 일반 QA Agent / Recommendation Agent',
    '- 고려사항 — LLM 호출 단가, unclear 제어, DB 간 정합성, hallucination 제어 전략 필요',
    '● 중간 발표 준비 점검',
    '- 발표 대본만 작성 완료, PPT 미작성 상태',
    '- 서비스 소개 중심으로 구성 · LLM 추천 구조 강조 · 아키텍처는 단순화 표현',
    '- 슬라이드 25~30장 수준 구성 필요',
  ].join('\n'),
  fld_opinion: [
    '도메인 데이터는 반드시 출처 기반 검증 후 사용 여부 결정',
    '데이터 간 매핑 전략(상품과 메타데이터) 명확히 설계 필요',
    '추천 로직은 초기에는 단순하게 시작 후 점진 개선',
    '발표 자료는 서비스 목적과 구조 중심으로 단순하고 명확하게 구성',
    '아키텍처 및 파이프라인은 과도한 상세 대신 흐름 중심으로 표현',
  ].join('\n'),
  fld_codereview:
    '이번 회차에는 코드리뷰 미진행 — 다음 회차에 PR 단위 리뷰 예정',
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
      // tagLabel(담당 파트)은 학생 상세·일지 참석 칩용 mock 보강 데이터(Figma 역할 태그 패턴).
      members: [
        { studentId: 'stu_kim', name: '김수강', role: 'pm', tagLabel: 'PM' },
        {
          studentId: 'stu_park',
          name: '박지호',
          role: 'member',
          tagLabel: '백엔드',
        },
        {
          studentId: 'stu_choi',
          name: '최유나',
          role: 'member',
          tagLabel: 'AI/ML',
        },
        {
          studentId: 'stu_han',
          name: '한지우',
          role: 'member',
          tagLabel: '프론트엔드',
        },
        {
          studentId: 'stu_song',
          name: '송하늘',
          role: 'member',
          tagLabel: '데이터',
        },
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
        // 작성 중 임시 일지 — Figma 2553:4040 5행('이어 작성'). 초안은 인정 시간 미반영.
        {
          logId: 'log_rec_5d',
          performedAt: '2026-05-16T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 90,
          recognizedHours: null,
          status: 'draft',
          summary: '콜드 스타트 사용자 처리 로직 자문',
          attendedIds: ['stu_kim', 'stu_park', 'stu_choi'],
          answers: {
            fld_agenda: '콜드 스타트 사용자 처리 로직 자문',
          },
        },
        {
          logId: 'log_rec_4',
          performedAt: '2026-05-26T14:00',
          locationLabel: '온라인 · Zoom',
          actualMinutes: 90,
          recognizedHours: 1.5,
          status: 'valid',
          summary: '추천 모델 v2 평가 지표 검토 + 다음 액션 정리',
          // 일지 상세 모달(2582:6514) 대표 일지 — 원문 답변·타임스탬프 사진 재현.
          answers: REC4_ANSWERS,
          submittedAtLabel: '2026-05-26 16:05',
          photos: [
            { dateLabel: '2026.05.26 (화)', timeLabel: '14:00', kind: 'start' },
            { dateLabel: '2026.05.26 (화)', timeLabel: '15:30', kind: 'end' },
          ],
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
        { studentId: 'stu_seo', name: '서지민', role: 'pm', tagLabel: 'PM' },
        {
          studentId: 'stu_lee_d',
          name: '이도현',
          role: 'member',
          tagLabel: '데이터',
        },
        {
          studentId: 'stu_kim_n',
          name: '김나윤',
          role: 'member',
          tagLabel: '백엔드',
        },
        {
          studentId: 'stu_jung',
          name: '정태호',
          role: 'member',
          tagLabel: '프론트엔드',
        },
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
        { studentId: 'stu_park_j', name: '박준영', role: 'pm', tagLabel: 'PM' },
        {
          studentId: 'stu_kim_h',
          name: '김하린',
          role: 'member',
          tagLabel: '백엔드',
        },
        {
          studentId: 'stu_lee_s',
          name: '이서준',
          role: 'member',
          tagLabel: '인프라',
        },
        {
          studentId: 'stu_choi_m',
          name: '최민재',
          role: 'member',
          tagLabel: 'AI/ML',
        },
        {
          studentId: 'stu_yoon',
          name: '윤지아',
          role: 'member',
          tagLabel: '프론트엔드',
        },
        {
          studentId: 'stu_kang',
          name: '강도윤',
          role: 'member',
          tagLabel: '데이터',
        },
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
          // 운영자 수정 요청 — 사유 코드 6종 중 1 + 상세 메모 필수(05-31 확정). 멘토는 전체
          // 수정 후 재제출(M3 일지 수정 플로우의 진입 데이터).
          changeRequest: {
            reasonCode: 'template_answer_insufficient',
            reasonLabel:
              MENTORING_LOG_CHANGE_REASON_LABEL.template_answer_insufficient,
            note: '수행 내용이 1줄 요약뿐입니다. 회차 진행 내용을 항목 구조에 맞춰 보강한 뒤 전체 수정 후 재제출해 주세요.',
            requestedAtLabel: '2026-05-23 10:20',
          },
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
        { studentId: 'stu_han_y', name: '한예린', role: 'pm', tagLabel: 'PM' },
        {
          studentId: 'stu_kim_d',
          name: '김도윤',
          role: 'member',
          tagLabel: 'AI/ML',
        },
        {
          studentId: 'stu_park_s',
          name: '박시우',
          role: 'member',
          tagLabel: '데이터',
        },
        {
          studentId: 'stu_lee_g',
          name: '이가은',
          role: 'member',
          tagLabel: '백엔드',
        },
        {
          studentId: 'stu_jo',
          name: '조윤서',
          role: 'member',
          tagLabel: '프론트엔드',
        },
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
  // 완료 팀(NLP 분석 팀)의 제출 완료 평가·추천 — 학생 상세(M3) 대표 데이터.
  // 진행 중 팀들은 평가 전(null) — 학생 상세는 '평가 전' empty 상태로 표시.
  evaluations: [
    {
      teamId: 'team_nlp',
      writtenAtLabel: '2026-05-15',
      submittedAtLabel: '2026-05-15 20:40',
      byStudent: {
        // 한예린 — 평균 4.6(Figma 2659:1772 대표값). 줄글 코멘트는 수강생별 필수(05-29 확정)
        // — M3 mock 의 미작성분(4명)을 M4 정책 정합으로 보강했다.
        stu_han_y: {
          axes: [5, 4, 5, 5, 4],
          comment:
            '코퍼스 수집 전략과 토픽 모델링 해석 기준을 본인이 주도적으로 정리하면서, 분석 결과를 발표 구조로 옮기는 과정에서 팀의 결정을 끌어냈습니다. 코드 리뷰 코멘트 품질이 안정적이고, 다섯 명 협업에서 신뢰감을 주는 발표를 보여줍니다. 본인 영역에 머무르지 않고 지표 정의·일정 동기화에도 능동적으로 기여.',
        },
        stu_kim_d: {
          axes: [4, 4, 4, 5, 4],
          comment:
            '토픽 모델링 실험 설계를 안정적으로 수행했고, 새 기법 적용 전 비교 실험을 스스로 챙기는 학습 태도가 돋보입니다.',
        },
        stu_park_s: {
          axes: [4, 5, 4, 4, 5],
          comment:
            '코퍼스 수집·전처리 일정을 끝까지 책임지고, 팀원 작업이 막힐 때 데이터 이슈를 먼저 정리해 공유했습니다.',
        },
        stu_lee_g: {
          axes: [4, 4, 5, 4, 4],
          comment:
            'API 설계 논의에서 의견 전달이 명확하고, 분석 결과를 서비스 응답 구조로 옮기는 협업 커뮤니케이션이 좋았습니다.',
        },
        stu_jo: {
          axes: [3, 4, 4, 4, 5],
          comment:
            '시각화 화면 구현은 보강이 필요하지만, 발표 자료 협업과 팀 일정 조율에서 꾸준히 팀을 지원했습니다.',
        },
      },
    },
  ],
  recommendations: [
    {
      teamId: 'team_nlp',
      studentId: 'stu_han_y',
      submittedAtLabel: '2026-05-15 21:10',
      reason:
        '코퍼스 수집 전략 수립부터 토픽 모델링 결과 해석까지 분석 파이프라인 전 구간을 주도했고, 해석 기준을 팀에 명확히 설명해 합의를 이끌었습니다. 최종 발표 리허설에서도 구성·전달 모두 팀 진행 속도를 끌어올린 핵심 기여자입니다.',
      notify: true,
    },
  ],
  // 평가 작성 중 초안 — 평가 필요 팀(데이터마트 팀)의 대표 진행 상태(Figma 2553:4279 의
  // '완료 N + 작성 중 1 + 대기' 카드 상태 재현 — 팀원 구성은 mock 세계관 기준 4명).
  evaluationDrafts: {
    team_dm: {
      entries: [
        {
          studentId: 'stu_seo',
          scores: [5, 4, 5, 5, 4],
          comment:
            '집계 마트 성능 점검과 지표 정의 검토를 주도하며 팀 일정도 체계적으로 챙겼습니다.',
        },
        {
          studentId: 'stu_lee_d',
          scores: [4, 5, 4, 4, 5],
          comment:
            'ETL 파이프라인 리뷰 후속 액션을 끝까지 마무리. 데이터 검증 문서화가 꼼꼼합니다.',
        },
        {
          studentId: 'stu_kim_n',
          scores: [5, 4, null, null, null],
          comment: '',
        },
        {
          studentId: 'stu_jung',
          scores: [null, null, null, null, null],
          comment: '',
        },
      ],
    },
  },
  recommendationDrafts: {},
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

const sortByPerformedAtDesc = (logs: MentorMockLog[]) =>
  [...logs].sort((a, b) => b.performedAt.localeCompare(a.performedAt))

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
    // 배정 시간이 0(미배정·미설정)이면 완료로 보지 않는다 — 0>=0 오판으로 평가 게이트가
    // 잘못 열리는 것을 막는다.
    nHoursDone:
      team.allocatedHours > 0 && team.recognizedHours >= team.allocatedHours,
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
      // M4 제출 상태 연동 — 제출 즉시 '완료'(제출 후 수정 불가, PATCH/DELETE 없음).
      evaluationStatusLabel: mentorDb.evaluations.some(
        (e) => e.teamId === teamId,
      )
        ? '완료'
        : '대기',
      recommendationStatusLabel: mentorDb.recommendations.some(
        (r) => r.teamId === teamId,
      )
        ? '완료'
        : '대기',
    },
    // 최신순 정렬 — M3에서 초안(작성 중) 일지가 추가돼 배열 순서 대신 진행 일시 기준 파생.
    recentLogs: sortByPerformedAtDesc(team.logs).map((log) => ({
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

// ──────────────────── 멘토링 일지 · 학생 상세 (M3) ────────────────────

const dowOf = (iso: string) => DOW_LABELS[new Date(iso).getDay()]

/** 제출 일지(초안 제외) — 회차·참석 이력·완료 예약 파생의 분모. */
const submittedLogs = (team: MentorMockTeam) =>
  team.logs.filter((l) => l.status !== 'draft')

/**
 * 회차 — 동일 팀 제출 일지의 진행 일시 오름차순 누적 자동 산정.
 * 초안은 아직 미제출이라 '다음 회차'(제출 수 + 1)로 본다.
 */
function roundOf(team: MentorMockTeam, log: MentorMockLog): number {
  const submitted = submittedLogs(team).sort((a, b) =>
    a.performedAt.localeCompare(b.performedAt),
  )
  if (log.status === 'draft') return submitted.length + 1
  return submitted.findIndex((l) => l.logId === log.logId) + 1
}

/** 일지별 초과 시간 — 실제 − 인정(유효 일지만, 잔여까지만 인정 정책의 보존 기록). */
const excessOf = (log: MentorMockLog) =>
  log.status === 'valid' && log.recognizedHours != null
    ? round1(Math.max(log.actualMinutes / 60 - log.recognizedHours, 0))
    : 0

/** 답변 미보유 구 mock 일지(M1)용 기본 답변 — summary 기반 보강(초안은 비우지 않음). */
function defaultAnswersOf(log: MentorMockLog): Record<string, string> {
  return {
    fld_agenda: log.summary,
    fld_progress: `● 진행 내용\n- ${log.summary}\n- 논의 결과 정리 및 다음 액션 역할 분담`,
    fld_opinion: '논의된 후속 액션을 다음 회차 전까지 팀 문서로 정리해 주세요.',
  }
}

const splitLocation = (label: string): [string, string] => {
  const [typeLabel, detail = ''] = label.split(' · ')
  return [typeLabel, detail]
}

const composeLocationLabel = (placeType: MentoringPlaceType, detail: string) =>
  detail.trim()
    ? `${MENTORING_PLACE_TYPE_LABEL[placeType]} · ${detail.trim()}`
    : MENTORING_PLACE_TYPE_LABEL[placeType]

/** 'HH:mm' 간격(분) — 종료가 시작 이전이면 음수(검증에서 422). */
function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

/** 주요 아젠다 첫 줄 → 목록 요지 파생(불릿 기호 제거). */
const summaryOfAnswers = (answers: Record<string, string>) =>
  answers.fld_agenda
    ?.split('\n')
    .map((line) => line.replace(/^[-•●\s]+/, '').trim())
    .find(Boolean)

function toLogListItem(
  team: MentorMockTeam,
  log: MentorMockLog,
): MentoringLogListItem {
  const [typeLabel, placeDetail] = splitLocation(log.locationLabel)
  return {
    logId: log.logId,
    teamId: team.teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    summary: log.summary,
    dateLabel: dateLabelOf(log.performedAt),
    timeLabel: timeLabelOf(log.performedAt),
    yearLabel: yearLabelOf(log.performedAt),
    placeType: placeTypeOfLabel(typeLabel),
    placeDetail,
    actualMinutes: log.actualMinutes,
    recognizedHours: log.recognizedHours,
    excessHours: excessOf(log),
    status: log.status,
    statusNote: log.statusNote,
    performedAt: log.performedAt,
  }
}

/** GET /mentor/v1/mentoring-logs 응답 빌더 — 진행 일시 내림차순(Figma 2553:4040). */
export function buildMentoringLogsData(): MentoringLogsData {
  return {
    logs: mentorDb.teams
      .flatMap((team) => team.logs.map((log) => toLogListItem(team, log)))
      .sort((a, b) => b.performedAt.localeCompare(a.performedAt)),
  }
}

function toLogDetail(
  team: MentorMockTeam,
  log: MentorMockLog,
): MentoringLogDetailData {
  const assignment = toAssignment(team)
  const [typeLabel, placeDetail] = splitLocation(log.locationLabel)
  const sessionDate = log.performedAt.slice(0, 10)
  const startTime = timeLabelOf(log.performedAt)
  const endTime = endTimeLabelOf(log.performedAt, log.actualMinutes)
  const answers =
    log.answers ?? (log.status === 'draft' ? {} : defaultAnswersOf(log))
  const attendedIds = log.attendedIds ?? team.members.map((m) => m.studentId)
  return {
    logId: log.logId,
    round: roundOf(team, log),
    status: log.status,
    statusNote: log.statusNote,
    teamId: team.teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    mentorName: mentorDb.mentorName,
    summary: log.summary,
    sessionLabel: `${sessionDate}(${dowOf(log.performedAt)}) ${startTime} → ${endTime}`,
    sessionDate,
    startTime,
    endTime,
    placeType: placeTypeOfLabel(typeLabel),
    placeDetail,
    actualMinutes: log.actualMinutes,
    recognizedHours: log.recognizedHours,
    excessHours: excessOf(log),
    teamHours: {
      accumulatedHours: assignment.accumulatedHours,
      allocatedHours: assignment.allocatedHours,
      remainingHours: assignment.remainingHours,
    },
    attendees: team.members.map((m) => ({
      ...m,
      attended: attendedIds.includes(m.studentId),
    })),
    attendedCount: team.members.filter((m) => attendedIds.includes(m.studentId))
      .length,
    memberCount: team.members.length,
    answers: LOG_FIELD_SNAPSHOT.map((field) => ({
      field,
      value: answers[field.fieldSnapshotId] ?? '',
    })),
    // 제출 시각 미보유 구 mock 일지는 종료 시각으로 파생(초안은 미제출 — null).
    submittedAtLabel:
      log.status === 'draft'
        ? null
        : (log.submittedAtLabel ?? `${sessionDate} ${endTime}`),
    changeRequest: log.changeRequest ?? null,
    photos: log.photos ?? [],
  }
}

/** GET /mentor/v1/mentoring-logs/{logId} — 미존재 시 null(404 처리). */
export function buildMentoringLogDetail(
  logId: string,
): MentoringLogDetailData | null {
  for (const team of mentorDb.teams) {
    const log = team.logs.find((l) => l.logId === logId)
    if (log) return toLogDetail(team, log)
  }
  return null
}

/**
 * GET /mentor/v1/mentoring-logs/targets — 작성 대상 팀.
 * N시간 완료 팀도 추가 일지 가능(인정 0 — '초과 멘토링 · 활동 인정 시간 없음').
 * 조기 종료 팀 제외 규칙은 BE 확정 대기 — 보수적으로 제외.
 */
export function buildMentoringLogTargets(): MentoringLogTargetsData {
  return {
    targets: mentorDb.teams
      .filter((t) => t.status !== 'early_ended')
      .map((team) => {
        const a = toAssignment(team)
        return {
          teamId: team.teamId,
          cohortLabel: team.cohortLabel,
          teamName: team.teamName,
          nextRound: submittedLogs(team).length + 1,
          allocatedHours: a.allocatedHours,
          accumulatedHours: a.accumulatedHours,
          recognizedHours: a.recognizedHours,
          remainingHours: a.remainingHours,
          members: team.members,
        }
      }),
  }
}

/**
 * GET /mentor/v1/teams/{teamId}/log-field-snapshot — 운영 적용 항목 스냅샷.
 * mock 은 전 팀 동일(팀별 항목 설정 분기는 운영 멘토링 PR·BE 확정 시) — 미배정 팀 null(403).
 */
export function buildLogFieldSnapshot(
  teamId: string,
): MentoringLogFieldSnapshot[] | null {
  return mentorDb.teams.some((t) => t.teamId === teamId)
    ? LOG_FIELD_SNAPSHOT
    : null
}

export type MentoringLogMutationResult =
  | { ok: true; log: MentoringLogDetailData }
  | { ok: false; status: number; code: string; message: string }

const mockLogError = (
  status: number,
  code: string,
  message: string,
): MentoringLogMutationResult => ({ ok: false, status, code, message })

// 코드명은 명세 에러 22종 대조 전 추정(MENTOR_LOG_* 계열) — BE 확정 시 정합 TODO.
const logRequired422 = (message: string) =>
  mockLogError(422, 'MENTOR_LOG_REQUIRED_FIELD_MISSING', message)

function findMockLog(
  logId: string,
): { team: MentorMockTeam; log: MentorMockLog } | null {
  for (const team of mentorDb.teams) {
    const log = team.logs.find((l) => l.logId === logId)
    if (log) return { team, log }
  }
  return null
}

/** 초안·재제출 공용 — payload 의 입력값을 mock 일지에 반영(부분 입력 허용). */
function applyLogPayload(
  log: MentorMockLog,
  payload: MentoringLogDraftPayload,
) {
  if (payload.sessionDate && payload.startTime) {
    log.performedAt = `${payload.sessionDate}T${payload.startTime}`
  }
  if (payload.startTime && payload.endTime) {
    log.actualMinutes = Math.max(
      minutesBetween(payload.startTime, payload.endTime),
      0,
    )
  }
  if (payload.placeType) {
    log.locationLabel = composeLocationLabel(
      payload.placeType,
      payload.placeDetail ?? splitLocation(log.locationLabel)[1],
    )
  } else if (payload.placeDetail !== undefined) {
    const [typeLabel] = splitLocation(log.locationLabel)
    log.locationLabel = payload.placeDetail.trim()
      ? `${typeLabel} · ${payload.placeDetail.trim()}`
      : typeLabel
  }
  if (payload.attendedIds) log.attendedIds = [...payload.attendedIds]
  if (payload.answers) {
    log.answers = Object.fromEntries(
      payload.answers.map((a) => [a.fieldSnapshotId, a.value]),
    )
    log.summary = summaryOfAnswers(log.answers) ?? log.summary
  }
}

let draftSeq = 1

/**
 * PUT /mentor/v1/mentoring-logs/draft — 초안 신규 저장(자유 수정·인정 시간 미반영).
 * 초안은 시간 차감·팀 누적에 영향 없음(DRAFT, 03_멘토.md §5).
 */
export function saveMentoringLogDraft(
  payload: MentoringLogDraftPayload,
): MentoringLogMutationResult {
  const team = mentorDb.teams.find((t) => t.teamId === payload.teamId)
  if (!team)
    return mockLogError(
      403,
      'MENTOR_SCOPE_FORBIDDEN',
      '본인에게 배정된 팀이 아닙니다.',
    )
  const log: MentorMockLog = {
    logId: `log_draft_${draftSeq++}`,
    performedAt:
      payload.sessionDate && payload.startTime
        ? `${payload.sessionDate}T${payload.startTime}`
        : nowStamp(),
    locationLabel: composeLocationLabel(
      payload.placeType ?? 'online',
      payload.placeDetail ?? '',
    ),
    actualMinutes: 0,
    recognizedHours: null,
    status: 'draft',
    summary: '(작성 중)',
    attendedIds: payload.attendedIds ?? [],
    answers: {},
  }
  applyLogPayload(log, payload)
  team.logs.unshift(log)
  return { ok: true, log: toLogDetail(team, log) }
}

/** PUT /mentor/v1/mentoring-logs/{logId}/draft — 초안 갱신. 대상 팀 변경은 미지원(작성 시 고정). */
export function updateMentoringLogDraft(
  logId: string,
  payload: MentoringLogDraftPayload,
): MentoringLogMutationResult {
  const found = findMockLog(logId)
  if (!found)
    return mockLogError(404, 'MENTOR_LOG_NOT_FOUND', '일지를 찾을 수 없습니다.')
  if (found.log.status !== 'draft')
    // 유효 일지 수정·삭제 endpoint 없음(제출 후 임의 수정 불가) — 수정 요청 응답은 resubmit 전용.
    return mockLogError(
      409,
      'MENTOR_LOG_DIRECT_EDIT_FORBIDDEN',
      '제출된 일지는 임시 저장할 수 없습니다.',
    )
  applyLogPayload(found.log, payload)
  return { ok: true, log: toLogDetail(found.team, found.log) }
}

/** 제출·재제출 공통 필수 검증 — 422 (FE는 폼 검증으로 선차단). */
function validateLogForSubmit(
  team: MentorMockTeam,
  log: MentorMockLog,
): MentoringLogMutationResult | null {
  if (log.actualMinutes <= 0)
    return logRequired422(
      '시작·종료 시각을 분 단위까지 입력해 주세요 (실제 진행 시간 > 0).',
    )
  if (!splitLocation(log.locationLabel)[1].trim())
    return logRequired422('상세 장소를 입력해 주세요.')
  const attendedIds = log.attendedIds ?? team.members.map((m) => m.studentId)
  if (attendedIds.length === 0)
    return logRequired422('참석 멘티를 1명 이상 선택해 주세요.')
  const answers = log.answers ?? {}
  for (const field of LOG_FIELD_SNAPSHOT) {
    const value = (answers[field.fieldSnapshotId] ?? '').trim()
    if (field.required && !value)
      return logRequired422(`필수 항목 '${field.name}'을(를) 작성해 주세요.`)
    if (field.charLimit != null && value.length > field.charLimit)
      return mockLogError(
        422,
        'MENTOR_LOG_ANSWER_LENGTH_EXCEEDED',
        `'${field.name}'은(는) ${field.charLimit}자 이내로 작성해 주세요.`,
      )
  }
  return null
}

/**
 * POST /mentor/v1/mentoring-logs/{logId}/{submit|resubmit} — 제출 즉시 자동 유효.
 * 인정 시간 SSOT 수식(recognizeMinutes)으로 재계산해 M1 팀 누적(accumulated/recognized)과
 * 팀 상태에 즉시 반영(상태형 mock). 완료 예약 파생(deriveCompletedRequests)도 자동 동기화.
 * 재제출 = 수정 요청 일지 전체 수정 후 즉시 자동 유효(폐기·반려 없음, 05-31 확정).
 */
export function submitMentoringLog(
  logId: string,
  mode: 'submit' | 'resubmit',
  payload?: MentoringLogDraftPayload,
): MentoringLogMutationResult {
  const found = findMockLog(logId)
  if (!found)
    return mockLogError(404, 'MENTOR_LOG_NOT_FOUND', '일지를 찾을 수 없습니다.')
  const { team, log } = found
  if (mode === 'submit' && log.status !== 'draft')
    return mockLogError(
      409,
      'MENTOR_LOG_ALREADY_SUBMITTED',
      '이미 제출된 일지입니다. 수정 요청 상태에서만 재제출할 수 있습니다.',
    )
  if (mode === 'resubmit' && log.status !== 'change_requested')
    return mockLogError(
      409,
      'MENTOR_LOG_NOT_CHANGE_REQUESTED',
      '수정 요청 상태의 일지만 재제출할 수 있습니다.',
    )
  if (payload) applyLogPayload(log, payload)
  const invalid = validateLogForSubmit(team, log)
  if (invalid) return invalid

  // 인정 = min(실제, max(잔여, 0)) — 초과분은 기록 보존·인정 없음(잔여까지만).
  const rec = recognizeMinutes(team, log.actualMinutes)
  log.status = 'valid'
  log.statusNote = undefined
  log.recognizedHours = rec.recognizedHours
  // ChangeRequest 해소(resolvedAt 기록) — mock 은 제거로 갈음(이력 보존은 BE 몫).
  log.changeRequest = undefined
  log.submittedAtLabel = nowStamp().replace('T', ' ')
  team.accumulatedHours = round1(team.accumulatedHours + log.actualMinutes / 60)
  team.recognizedHours = round1(team.recognizedHours + rec.recognizedHours)
  // 팀 상태 전이 — N시간 완료 시 평가 필요, 수정 요청 해소·일지 필요 해소는 진행 중 복귀.
  if (team.status !== 'completed' && team.status !== 'early_ended') {
    if (toAssignment(team).nHoursDone) team.status = 'evaluation_needed'
    else if (team.status === 'log_needed' || team.status === 'change_requested')
      team.status = 'in_progress'
  }
  return { ok: true, log: toLogDetail(team, log) }
}

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

// ───────────────────────── 평가 · 추천 (M4) ─────────────────────────

const EMPTY_SCORES: EvaluationScoreTuple = [null, null, null, null, null]

/** 점수 유효성 — 1~5 정수(범위 미확정 TODO — Figma '0~5점 필수' 카피와 충돌 openQuestion). */
const isValidScore = (s: number | null): s is number =>
  s != null && Number.isInteger(s) && s >= 1 && s <= 5

/** 평가 입력 완료 — 5축 전 점수 + 줄글 코멘트(필수, 500자 이내). */
const isCompleteEvaluationEntry = (entry: {
  scores: EvaluationScoreTuple
  comment: string
}) =>
  entry.scores.every(isValidScore) &&
  entry.comment.trim().length > 0 &&
  entry.comment.length <= 500

/** 평가 가능 게이트 — N시간 완료 또는 운영자 조기 종료(P0_35 · 03_멘토.md §6). */
const isEvaluationEligible = (team: MentorMockTeam) =>
  toAssignment(team).nHoursDone || team.status === 'early_ended'

const avgOf = (scores: number[]) =>
  round1(scores.reduce((sum, s) => sum + s, 0) / scores.length)

/** '2026-03-19 21:14' + 24h → '2026-03-20(금) 21:14 까지' (Figma 원문 행 표기 전용). */
function plus24hLabel(stamp: string) {
  const d = new Date(stamp.replace(' ', 'T'))
  d.setDate(d.getDate() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}(${DOW_LABELS[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())} 까지`
}

/** 팀원 + 초안/제출본 병합 — 평가 카드 행(read model). */
function evaluationEntriesOf(
  team: MentorMockTeam,
): MentorEvaluationMemberEntry[] {
  const submitted = mentorDb.evaluations.find((e) => e.teamId === team.teamId)
  const draft = mentorDb.evaluationDrafts[team.teamId]
  return team.members.map((member) => {
    const sub = submitted?.byStudent[member.studentId]
    const d = draft?.entries.find((e) => e.studentId === member.studentId)
    return {
      ...member,
      scores: sub
        ? ([...sub.axes] as EvaluationScoreTuple)
        : d
          ? ([...d.scores] as EvaluationScoreTuple)
          : ([...EMPTY_SCORES] as EvaluationScoreTuple),
      comment: sub ? (sub.comment ?? '') : (d?.comment ?? ''),
    }
  })
}

/** GET /mentor/v1/teams/{teamId}/evaluation — 미배정 팀이면 null(403 처리). */
export function buildTeamEvaluationSheet(
  teamId: string,
): MentorEvaluationSheetData | null {
  const team = mentorDb.teams.find((t) => t.teamId === teamId)
  if (!team) return null
  const assignment = toAssignment(team)
  const submitted = mentorDb.evaluations.find((e) => e.teamId === teamId)
  const eligible = isEvaluationEligible(team)
  const members = evaluationEntriesOf(team)
  const status: MentorEvaluationStatus = submitted
    ? 'submitted'
    : !eligible
      ? 'not_eligible'
      : members.every(isCompleteEvaluationEntry)
        ? 'ready_to_submit'
        : 'draft'
  return {
    teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    memberCount: team.members.length,
    allocatedHours: assignment.allocatedHours,
    recognizedHours: assignment.recognizedHours,
    eligible,
    eligibleLabel:
      team.status === 'early_ended'
        ? '조기 종료 · 평가 가능'
        : assignment.nHoursDone
          ? 'N시간 완료 · 평가 가능'
          : 'N시간 미완료 · 평가 잠금',
    lockReasonLabel: eligible
      ? null
      : `N시간 완료 후 활성 — 인정 ${assignment.recognizedHours}h / 배정 ${assignment.allocatedHours}h`,
    status,
    submittedAtLabel:
      submitted?.submittedAtLabel ?? submitted?.writtenAtLabel ?? null,
    members,
  }
}

export type MentorEvaluationMutationResult =
  | { ok: true; sheet: MentorEvaluationSheetData }
  | { ok: false; status: number; code: string; message: string }

const evalError = (
  status: number,
  code: string,
  message: string,
): MentorEvaluationMutationResult => ({ ok: false, status, code, message })

/** payload 정규화 — 팀원 외 entry 제거 + 점수 범위 클램프 + 코멘트 500자 컷. */
function normalizeEvaluationPayload(
  team: MentorMockTeam,
  payload: MentorEvaluationDraftPayload,
): MentorEvaluationDraftPayload {
  return {
    entries: team.members.map((member) => {
      const entry = payload.entries.find(
        (e) => e.studentId === member.studentId,
      )
      return {
        studentId: member.studentId,
        scores: (entry?.scores ?? EMPTY_SCORES).map((s) =>
          isValidScore(s) ? s : null,
        ) as EvaluationScoreTuple,
        comment: (entry?.comment ?? '').slice(0, 500),
      }
    }),
  }
}

/** 평가 공통 guard — 미배정 403 · 제출 후 수정 불가 409 · 게이트 422. */
function guardEvaluation(
  teamId: string,
): { team: MentorMockTeam } | MentorEvaluationMutationResult {
  const team = mentorDb.teams.find((t) => t.teamId === teamId)
  if (!team)
    return evalError(
      403,
      'MENTOR_SCOPE_FORBIDDEN',
      '본인에게 배정된 팀이 아닙니다.',
    )
  if (mentorDb.evaluations.some((e) => e.teamId === teamId))
    // 최종 제출 후 PATCH/DELETE endpoint 없음(05-31 확정) — 코드명은 명세 대조 전 추정 TODO.
    return evalError(
      409,
      'MENTOR_EVALUATION_ALREADY_SUBMITTED',
      '제출된 평가는 수정할 수 없습니다.',
    )
  if (!isEvaluationEligible(team))
    return evalError(
      422,
      'MENTOR_EVALUATION_NOT_ELIGIBLE',
      'N시간 완료 또는 조기 종료 후에 평가할 수 있습니다.',
    )
  return { team }
}

/** PUT /mentor/v1/teams/{teamId}/evaluation/draft — 부분 입력 그대로 보관(자동/임시 저장). */
export function saveEvaluationDraft(
  teamId: string,
  payload: MentorEvaluationDraftPayload,
): MentorEvaluationMutationResult {
  const guarded = guardEvaluation(teamId)
  if ('ok' in guarded) return guarded
  mentorDb.evaluationDrafts[teamId] = normalizeEvaluationPayload(
    guarded.team,
    payload,
  )
  return { ok: true, sheet: buildTeamEvaluationSheet(teamId)! }
}

/**
 * POST /mentor/v1/teams/{teamId}/evaluation/submit — 최종 제출(submittedAt/lockedAt).
 * 전원 5축 점수 + 줄글 코멘트 필수(미충족 422), 제출 후 수정·삭제 불가(409).
 * 제출 후에도 팀 상태는 evaluation_needed 유지 — 추천 제출까지 완료해야 completed
 * (활동 인정 요건 = 평가 + 추천 제출 완료, P0_32).
 */
export function submitEvaluation(
  teamId: string,
  payload?: MentorEvaluationDraftPayload,
): MentorEvaluationMutationResult {
  const guarded = guardEvaluation(teamId)
  if ('ok' in guarded) return guarded
  const { team } = guarded
  if (payload)
    mentorDb.evaluationDrafts[teamId] = normalizeEvaluationPayload(
      team,
      payload,
    )
  const entries = evaluationEntriesOf(team)
  const missing = entries.filter((e) => !isCompleteEvaluationEntry(e)).length
  if (missing > 0)
    // 코드명은 명세 에러 22종 대조 전 추정(MENTOR_EVALUATION_* 계열) — BE 확정 시 정합 TODO.
    return evalError(
      422,
      'MENTOR_EVALUATION_REQUIRED_FIELD_MISSING',
      `팀원 전체 5축 점수와 줄글 평가 코멘트를 입력해 주세요 (${missing}명 미완료).`,
    )
  const stamp = nowStamp().replace('T', ' ')
  mentorDb.evaluations.push({
    teamId,
    writtenAtLabel: stamp.slice(0, 10),
    submittedAtLabel: stamp,
    byStudent: Object.fromEntries(
      entries.map((e) => [
        e.studentId,
        {
          axes: e.scores.map((s) => s!) as [
            number,
            number,
            number,
            number,
            number,
          ],
          comment: e.comment.trim(),
        },
      ]),
    ),
  })
  delete mentorDb.evaluationDrafts[teamId]
  return { ok: true, sheet: buildTeamEvaluationSheet(teamId)! }
}

function toEvaluationSubmission(
  evaluation: MentorMockEvaluation,
): MentorEvaluationSubmission | null {
  const team = mentorDb.teams.find((t) => t.teamId === evaluation.teamId)
  if (!team) return null
  const entries = Object.values(evaluation.byStudent)
  const submittedAtLabel =
    evaluation.submittedAtLabel ?? `${evaluation.writtenAtLabel} 00:00`
  const commentCount = entries.filter((e) => (e.comment ?? '').trim()).length
  return {
    teamId: team.teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    submittedAtLabel,
    targetCount: entries.length,
    axisAverages: EVALUATION_AXIS_LABELS.map((label, i) => ({
      label,
      value: avgOf(entries.map((e) => e.axes[i])),
    })),
    commentsLabel:
      commentCount === entries.length
        ? `${entries.length}명 모두 작성`
        : `${commentCount} / ${entries.length}명 작성`,
    editDeadlineLabel: plus24hLabel(submittedAtLabel),
  }
}

/**
 * GET /mentor/v1/evaluations — 제출 완료 페이지 요약(최신 제출 우선).
 * 명세 P0_35 에는 팀 단위 endpoint 만 정의 — 목록 read model 은 mock 보강(BE 확정 시 정합 TODO).
 */
export function buildEvaluationsData(): MentorEvaluationsData {
  return {
    submissions: mentorDb.evaluations
      .map(toEvaluationSubmission)
      .filter((s): s is MentorEvaluationSubmission => s != null)
      .sort((a, b) => b.submittedAtLabel.localeCompare(a.submittedAtLabel)),
  }
}

/** GET /mentor/v1/teams/{teamId}/recommendation — 미배정 팀이면 null(403 처리). */
export function buildTeamRecommendationSheet(
  teamId: string,
): MentorRecommendationSheetData | null {
  const team = mentorDb.teams.find((t) => t.teamId === teamId)
  if (!team) return null
  const evaluation = mentorDb.evaluations.find((e) => e.teamId === teamId)
  const submitted = mentorDb.recommendations.find((r) => r.teamId === teamId)
  const draft = mentorDb.recommendationDrafts[teamId]
  const candidates: MentorRecommendationCandidate[] = team.members.map(
    (member) => {
      const sub = evaluation?.byStudent[member.studentId]
      return {
        ...member,
        average: sub ? avgOf(sub.axes) : null,
        scores: sub
          ? ([...sub.axes] as EvaluationScoreTuple)
          : ([...EMPTY_SCORES] as EvaluationScoreTuple),
      }
    },
  )
  const status: MentorRecommendationStatus = !evaluation
    ? 'locked_until_evaluation'
    : submitted
      ? submitted.studentId
        ? 'submitted_recommended'
        : 'submitted_not_recommended'
      : draft
        ? 'draft'
        : 'not_started'
  return {
    teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    memberCount: team.members.length,
    status,
    teamAverage: evaluation
      ? avgOf(
          candidates
            .map((c) => c.average)
            .filter((a): a is number => a != null),
        )
      : null,
    candidates,
    draft: submitted
      ? {
          mode: submitted.studentId ? 'recommend' : 'none',
          studentId: submitted.studentId,
          summary: submitted.reason,
          notify: submitted.notify ?? true,
        }
      : (draft ?? { mode: null, studentId: null, summary: '', notify: true }),
    submittedAtLabel: submitted?.submittedAtLabel ?? null,
  }
}

export type MentorRecommendationMutationResult =
  | { ok: true; sheet: MentorRecommendationSheetData }
  | { ok: false; status: number; code: string; message: string }

const recError = (
  status: number,
  code: string,
  message: string,
): MentorRecommendationMutationResult => ({ ok: false, status, code, message })

/** 추천 공통 guard — 미배정 403 · 평가 미제출 잠금 422 · 제출 후 수정 불가 409. */
function guardRecommendation(
  teamId: string,
): { team: MentorMockTeam } | MentorRecommendationMutationResult {
  const team = mentorDb.teams.find((t) => t.teamId === teamId)
  if (!team)
    return recError(
      403,
      'MENTOR_SCOPE_FORBIDDEN',
      '본인에게 배정된 팀이 아닙니다.',
    )
  if (!mentorDb.evaluations.some((e) => e.teamId === teamId))
    return recError(
      422,
      'MENTOR_RECOMMENDATION_LOCKED_UNTIL_EVALUATION',
      '팀원 전체 평가를 최종 제출한 뒤 추천을 선택할 수 있습니다.',
    )
  if (mentorDb.recommendations.some((r) => r.teamId === teamId))
    return recError(
      409,
      'MENTOR_RECOMMENDATION_ALREADY_SUBMITTED',
      '제출된 추천은 수정할 수 없습니다.',
    )
  return { team }
}

/** PUT /mentor/v1/teams/{teamId}/recommendation/draft — 자동/임시 저장. */
export function saveRecommendationDraft(
  teamId: string,
  payload: MentorRecommendationDraftPayload,
): MentorRecommendationMutationResult {
  const guarded = guardRecommendation(teamId)
  if ('ok' in guarded) return guarded
  mentorDb.recommendationDrafts[teamId] = {
    mode: payload.mode,
    studentId: payload.mode === 'none' ? null : payload.studentId,
    summary: (payload.summary ?? '').slice(0, 500),
    notify: payload.notify ?? true,
  }
  return { ok: true, sheet: buildTeamRecommendationSheet(teamId)! }
}

/**
 * POST /mentor/v1/teams/{teamId}/recommendation/submit — 최종 제출(팀당 1건 unique).
 * recommended → 대상 1명 + certificateSummary 필수(MENTOR_RECOMMENDATION_SUMMARY_REQUIRED),
 * not_recommended → 대상 null · 사유 입력 없음. 제출 후 수정 불가(409).
 * 추천 제출 = 활동 인정 요건 충족 — 평가 필요 팀은 completed 로 전이(조기 종료 팀은 유지).
 */
export function submitRecommendation(
  teamId: string,
  payload?: MentorRecommendationDraftPayload,
): MentorRecommendationMutationResult {
  const guarded = guardRecommendation(teamId)
  if ('ok' in guarded) return guarded
  const { team } = guarded
  const input = payload ?? mentorDb.recommendationDrafts[teamId]
  if (!input?.mode)
    // 코드명은 명세 에러 22종 대조 전 추정(MENTOR_RECOMMENDATION_* 계열) — BE 확정 시 정합 TODO.
    return recError(
      422,
      'MENTOR_RECOMMENDATION_MODE_REQUIRED',
      '팀원 1명 추천 또는 추천하지 않음 중 하나를 선택해 주세요.',
    )
  const summary = (input.summary ?? '').trim()
  if (input.mode === 'recommend') {
    if (
      !input.studentId ||
      !team.members.some((m) => m.studentId === input.studentId)
    )
      return recError(
        422,
        'MENTOR_RECOMMENDATION_TARGET_REQUIRED',
        '추천할 팀원을 선택해 주세요 (팀당 1명).',
      )
    if (!summary)
      return recError(
        422,
        'MENTOR_RECOMMENDATION_SUMMARY_REQUIRED',
        '추천 대상자는 증명서용 간략 요약이 있어야 합니다.',
      )
    if (summary.length > 500)
      return recError(
        422,
        'MENTOR_RECOMMENDATION_SUMMARY_LENGTH_EXCEEDED',
        '증명서용 간략 요약은 500자 이내로 작성해 주세요.',
      )
  }
  mentorDb.recommendations.push({
    teamId,
    studentId: input.mode === 'recommend' ? input.studentId : null,
    submittedAtLabel: nowStamp().replace('T', ' '),
    reason: input.mode === 'recommend' ? summary : '',
    notify: input.notify ?? true,
  })
  delete mentorDb.recommendationDrafts[teamId]
  if (team.status === 'evaluation_needed') team.status = 'completed'
  return { ok: true, sheet: buildTeamRecommendationSheet(teamId)! }
}

function toRecommendationSubmission(
  rec: MentorMockRecommendation,
): MentorRecommendationSubmission | null {
  const team = mentorDb.teams.find((t) => t.teamId === rec.teamId)
  if (!team) return null
  const member = rec.studentId
    ? team.members.find((m) => m.studentId === rec.studentId)
    : undefined
  return {
    teamId: team.teamId,
    cohortLabel: team.cohortLabel,
    teamName: team.teamName,
    submittedAtLabel: rec.submittedAtLabel,
    recommended: !!member,
    targetLabel: member
      ? `${member.name} (${member.tagLabel ?? (member.role === 'pm' ? 'PM' : '팀원')})`
      : '추천하지 않음',
    summaryLabel: member
      ? `${rec.reason.length}자 · 필수 충족`
      : '입력 없음 · 추천하지 않음',
    certificateLabel: '증명서 전체 공개 + 인증 완료 + 최신화 스냅샷 기준',
    editDeadlineLabel: plus24hLabel(rec.submittedAtLabel),
  }
}

/** GET /mentor/v1/recommendations — 제출 완료 페이지 요약(최신 제출 우선, mock 보강 read model). */
export function buildRecommendationsData(): MentorRecommendationsData {
  return {
    submissions: mentorDb.recommendations
      .map(toRecommendationSubmission)
      .filter((s): s is MentorRecommendationSubmission => s != null)
      .sort((a, b) => b.submittedAtLabel.localeCompare(a.submittedAtLabel)),
  }
}
