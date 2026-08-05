// 멘토 mock — 인메모리 상태 타입·시드 데이터(mockDb 단일 소유 상태의 원천 모듈).
import type {
  MentorEvaluationDraftPayload,
  MentorRecommendationDraftPayload,
  MentorTeamMember,
  MentorTeamMemberRole,
  MentorTeamStatus,
  MentorTodoItem,
  MentoringLogChangeRequest,
  MentoringLogFieldSnapshot,
  MentoringLogPhoto,
  MentoringLogStatus,
  MentoringRequestSlot,
  MentoringRequestStatus,
} from '../types'
import { MENTORING_LOG_CHANGE_REASON_LABEL } from '../types'

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
    { axes: [number, number, number, number]; comment?: string }
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

/** 멘토 평가 고정 4축 라벨(2026-08-05 개편) — BE scores4 순서와 1:1. */
export const EVALUATION_AXIS_LABELS = [
  '기술/기술기여',
  '소통·협업·팀워크',
  '문제해결',
  '책임감',
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
          axes: [5, 4, 5, 5],
          comment:
            '코퍼스 수집 전략과 토픽 모델링 해석 기준을 본인이 주도적으로 정리하면서, 분석 결과를 발표 구조로 옮기는 과정에서 팀의 결정을 끌어냈습니다. 코드 리뷰 코멘트 품질이 안정적이고, 다섯 명 협업에서 신뢰감을 주는 발표를 보여줍니다. 본인 영역에 머무르지 않고 지표 정의·일정 동기화에도 능동적으로 기여.',
        },
        stu_kim_d: {
          axes: [4, 4, 4, 5],
          comment:
            '토픽 모델링 실험 설계를 안정적으로 수행했고, 새 기법 적용 전 비교 실험을 스스로 챙기는 학습 태도가 돋보입니다.',
        },
        stu_park_s: {
          axes: [4, 5, 4, 4],
          comment:
            '코퍼스 수집·전처리 일정을 끝까지 책임지고, 팀원 작업이 막힐 때 데이터 이슈를 먼저 정리해 공유했습니다.',
        },
        stu_lee_g: {
          axes: [4, 4, 5, 4],
          comment:
            'API 설계 논의에서 의견 전달이 명확하고, 분석 결과를 서비스 응답 구조로 옮기는 협업 커뮤니케이션이 좋았습니다.',
        },
        stu_jo: {
          axes: [3, 4, 4, 4],
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
          scores: [5, 4, 5, 5],
          comment:
            '집계 마트 성능 점검과 지표 정의 검토를 주도하며 팀 일정도 체계적으로 챙겼습니다.',
        },
        {
          studentId: 'stu_lee_d',
          scores: [4, 5, 4, 4],
          comment:
            'ETL 파이프라인 리뷰 후속 액션을 끝까지 마무리. 데이터 검증 문서화가 꼼꼼합니다.',
        },
        {
          studentId: 'stu_kim_n',
          scores: [5, 4, null, null],
          comment: '',
        },
        {
          studentId: 'stu_jung',
          scores: [null, null, null, null],
          comment: '',
        },
      ],
    },
  },
  recommendationDrafts: {},
}
