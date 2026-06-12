import type {
  AdminLogTemplate,
  AdminLogTemplatesData,
  AdminMentorOption,
  AdminMentoringCohortOption,
  AdminMentoringLogDetail,
  AdminMentoringLogHistoryEntry,
  AdminMentoringLogRow,
  AdminMentoringLogSnapshotItem,
  AdminMentoringLogsData,
  AdminMentoringStatisticsData,
  AdminTeamLogField,
  AdminTeamLogFieldsData,
  AdminTemplateField,
  MentorAssignmentCreateRequest,
  MentorAssignmentRow,
  MentorAssignmentsData,
  MentorTeamStatRow,
  MentoringLogChangeRequestPayload,
  MentoringTeamStatKey,
  TemplateCreatePayload,
} from './types'
import { MENTORING_LOG_CHANGE_REASON_LABEL } from './types'

// 운영 멘토링 mock 인메모리 상태 — A1(배정·일지) 단일 소유 모듈. mutation 핸들러가 이
// 상태를 실제로 변경하고 화면은 invalidateQueries 로 재조회한다(상태형 mock).
// msw 자동 수집 글롭(features/**/mocks.ts)에 걸리지 않도록 mocks.ts(핸들러 전용)와 분리.
//
// 데이터 서사: 멘토 콘솔 mock(features/mentor/mockDb.ts — 멘토 임수현·추천시스템/데이터마트/
// 트러블슈팅 팀)과 동일 세계관의 운영자 시점 복제. 역할 교차 상태 동기화(운영 수정 요청 →
// 멘토 일지 화면 반영 등)는 BE 확정 시 — 현재는 역할별 독립 상태(결합면 주석 기록).
// 미배정 2팀(이상탐지 ML·공공 데이터)은 배정 생성·409 시연용 mock 보강 데이터.

interface AdminMockTeam {
  teamId: string
  teamName: string
  cohortId: string
  memberCount: number
}

interface AdminMockAssignment {
  assignmentId: string
  teamId: string
  mentorId: string
  allocatedHours: number
  recognizedHours: number
  /** replaced(일지 보존 교체)·inactive(일지 작성 전 해제)는 보드 비노출 보존 상태 */
  status: 'active' | 'early_ended' | 'replaced' | 'inactive'
  logTemplateId: string
  /** 조기 종료 사유 — 멘토에게만 표시·수강생 비공개(05-26 §3) */
  earlyEndedReason?: string
  /**
   * 평가·추천 제출 결과 — 통계(§33) 표시용 요약(평가 원문·5축 원점수는 비공개 정책상
   * 운영 mock 에 두지 않음). 원천은 멘토 콘솔 제출 — 역할 교차 동기화는 BE 확정 시.
   */
  evaluation?: { submittedAtLabel: string; recommended: boolean }
}

interface AdminMockTemplate {
  templateId: string
  name: string
  description: string
  isDefault: boolean
  isActive: boolean
  /** '2026-05-19' — 항목·이름 변경 시 갱신 */
  updatedAt: string
  fields: AdminTemplateField[]
}

interface AdminMockLog {
  logId: string
  teamId: string
  /** 일지가 귀속된 배정 — 교체 시 기존 배정 보존 판단 기준(hasLogs) */
  assignmentId: string
  /** '2026-05-26T14:00' */
  performedAt: string
  locationLabel: string
  actualMinutes: number
  recognizedHours: number | null
  excessHours: number
  status: 'draft' | 'valid' | 'change_requested'
  resubmitted: boolean
  /** fieldSnapshotId(order) → 답변. 미존재 항목은 미입력 표시 */
  answers: Record<number, string>
  history: AdminMentoringLogHistoryEntry[]
  changeRequest: {
    reasonCode: MentoringLogChangeRequestPayload['reasonCode']
    note: string
    requestedAtLabel: string
  } | null
}

interface AdminMentoringMockDb {
  cohorts: AdminMentoringCohortOption[]
  mentors: AdminMentorOption[]
  /** 일지 템플릿 전체(§31) — 배정 폼 선택지는 여기서 활성만 파생(A1·A2 상태 공유) */
  logTemplates: AdminMockTemplate[]
  teams: AdminMockTeam[]
  assignments: AdminMockAssignment[]
  logs: AdminMockLog[]
  /** 팀별 일지 항목 오버라이드(§32) — assignmentId unique(MentoringTeamLogFieldOverride) */
  teamFieldOverrides: Record<string, AdminTeamLogField[]>
}

/** 작성 당시 항목 스냅샷(템플릿 v2.1 · 6항목) — 멘토 콘솔 LOG_FIELD_SNAPSHOT 동일 구성. */
const SNAPSHOT_FIELDS: { order: number; title: string; required: boolean }[] = [
  { order: 1, title: '주요 아젠다', required: true },
  { order: 2, title: '수행 내용', required: true },
  { order: 3, title: '멘토 의견 및 요청 사항', required: true },
  { order: 4, title: '코드리뷰 내용', required: false },
  { order: 5, title: '작성 산출물', required: false },
  { order: 6, title: '활동 기록', required: false },
]

const TEMPLATE_LABEL = 'template v2.1 · 6항목'

export const adminMentoringDb: AdminMentoringMockDb = {
  cohorts: [
    {
      cohortId: 'coh_ai5_a',
      courseName: 'AI 캠프',
      cohortLabel: 'AI 5기',
      cohortName: 'AI 5기 A반',
    },
    {
      cohortId: 'coh_ai5_b',
      courseName: 'AI 캠프',
      cohortLabel: 'AI 5기',
      cohortName: 'AI 5기 B반',
    },
    {
      cohortId: 'coh_da4_a',
      courseName: '데이터 분석',
      cohortLabel: 'DA 4기',
      cohortName: 'DA 4기 A반',
    },
    {
      cohortId: 'coh_da4_b',
      courseName: '데이터 분석',
      cohortLabel: 'DA 4기',
      cohortName: 'DA 4기 B반',
    },
  ],
  mentors: [
    { mentorId: 'mentor_lim', name: '임수현' },
    { mentorId: 'mentor_kim', name: '김효원' },
    { mentorId: 'mentor_lee', name: '이지훈' },
    { mentorId: 'mentor_park', name: '박지영' },
  ],
  // 템플릿 5종 — Figma 2746:7909 목록 원문(이름·항목 수·수정일·비활성). 적용 팀 수는
  // assignments 파생. 기본 v2.1 항목 6종은 Figma 항목 편집 카드 원문 — 일지 스냅샷
  // (SNAPSHOT_FIELDS)과 달라 '템플릿 변경은 기존 일지 스냅샷 보존' 서사를 함께 시연한다.
  logTemplates: [
    {
      templateId: 'tpl_default_v21',
      name: 'AI 캠프 기본 v2.1',
      description: '주요 아젠다·수행 내용·멘토 의견 등 핵심 6항목',
      isDefault: true,
      isActive: true,
      updatedAt: '2026-05-19',
      fields: [
        {
          fieldId: 'tf_agenda',
          order: 1,
          name: '주요 아젠다',
          helpText: '이번 멘토링에서 다룬 핵심 안건',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_progress',
          order: 2,
          name: '수행 내용',
          helpText: '회의 흐름에 따른 상세 진행 내용',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_opinion',
          order: 3,
          name: '멘토 의견 및 요청 사항',
          helpText: '팀에게 전달하는 권장사항',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_codereview',
          order: 4,
          name: '코드리뷰 내용',
          helpText: '코드 단위 피드백 (선택)',
          required: false,
          type: 'long_text',
        },
        {
          fieldId: 'tf_next',
          order: 5,
          name: '다음 회차 일정',
          helpText: 'YYYY-MM-DD HH:MM',
          required: false,
          type: 'short_text',
        },
        {
          fieldId: 'tf_memo',
          order: 6,
          name: '활동 기록 메모',
          helpText: '사진 첨부 외 보조 메모',
          required: false,
          type: 'short_text',
        },
      ],
    },
    {
      templateId: 'tpl_da5_data',
      name: 'DA 5기 데이터 분석용',
      description: '분석 주제·데이터 검증 중심 5항목',
      isDefault: false,
      isActive: true,
      updatedAt: '2026-05-12',
      fields: [
        {
          fieldId: 'tf_da_topic',
          order: 1,
          name: '분석 주제',
          helpText: '이번 회차에서 다룬 분석 주제',
          required: true,
          type: 'short_text',
        },
        {
          fieldId: 'tf_da_progress',
          order: 2,
          name: '분석 진행 내용',
          helpText: '데이터 탐색·모델링 진행 상세',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_da_validate',
          order: 3,
          name: '데이터 검증 결과',
          helpText: '데이터 품질·가설 검증 결과',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_da_opinion',
          order: 4,
          name: '멘토 의견',
          helpText: '팀에게 전달하는 권장사항',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_da_next',
          order: 5,
          name: '다음 액션',
          helpText: '다음 회차까지의 액션 아이템',
          required: false,
          type: 'short_text',
        },
      ],
    },
    {
      templateId: 'tpl_de3_infra',
      name: 'DE 3기 인프라 중심',
      description: '인프라 구성·장애 대응 중심 7항목',
      isDefault: false,
      isActive: true,
      updatedAt: '2026-04-28',
      fields: [
        {
          fieldId: 'tf_de_agenda',
          order: 1,
          name: '주요 아젠다',
          helpText: '이번 멘토링에서 다룬 핵심 안건',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_de_arch',
          order: 2,
          name: '인프라 구성 점검',
          helpText: '아키텍처·리소스 구성 점검 내용',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_de_incident',
          order: 3,
          name: '장애 대응 리뷰',
          helpText: '장애 재현·대응 절차 리뷰',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_de_pipeline',
          order: 4,
          name: '파이프라인 점검',
          helpText: '배포·데이터 파이프라인 점검 (선택)',
          required: false,
          type: 'long_text',
        },
        {
          fieldId: 'tf_de_cost',
          order: 5,
          name: '리소스 점검 메모',
          helpText: '리소스 사용량 보조 메모 (선택)',
          required: false,
          type: 'short_text',
        },
        {
          fieldId: 'tf_de_next',
          order: 6,
          name: '다음 회차 일정',
          helpText: 'YYYY-MM-DD HH:MM',
          required: false,
          type: 'short_text',
        },
        {
          fieldId: 'tf_de_memo',
          order: 7,
          name: '활동 기록 메모',
          helpText: '사진 첨부 외 보조 메모',
          required: false,
          type: 'short_text',
        },
      ],
    },
    {
      templateId: 'tpl_boot_4w',
      name: '부트캠프 단기 4주',
      description: '단기 과정용 경량 4항목',
      isDefault: false,
      isActive: true,
      updatedAt: '2026-04-15',
      fields: [
        {
          fieldId: 'tf_bc_agenda',
          order: 1,
          name: '주요 아젠다',
          helpText: '이번 멘토링에서 다룬 핵심 안건',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_bc_progress',
          order: 2,
          name: '수행 내용',
          helpText: '회의 흐름에 따른 상세 진행 내용',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_bc_opinion',
          order: 3,
          name: '멘토 의견',
          helpText: '팀에게 전달하는 권장사항',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_bc_next',
          order: 4,
          name: '다음 회차 일정',
          helpText: 'YYYY-MM-DD HH:MM',
          required: false,
          type: 'short_text',
        },
      ],
    },
    {
      templateId: 'tpl_legacy_v10',
      name: '레거시 v1.0 (보관)',
      description: '구 버전 보관용 — 신규 배정 선택 불가',
      isDefault: false,
      isActive: false,
      updatedAt: '2026-03-02',
      fields: [
        {
          fieldId: 'tf_lg_agenda',
          order: 1,
          name: '주요 아젠다',
          helpText: '이번 멘토링에서 다룬 핵심 안건',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_lg_progress',
          order: 2,
          name: '수행 내용',
          helpText: '회의 흐름에 따른 상세 진행 내용',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_lg_opinion',
          order: 3,
          name: '멘토 의견 및 요청 사항',
          helpText: '팀에게 전달하는 권장사항',
          required: true,
          type: 'long_text',
        },
        {
          fieldId: 'tf_lg_output',
          order: 4,
          name: '작성 산출물',
          helpText: '회차 산출물 링크·파일 (선택)',
          required: false,
          type: 'short_text',
        },
        {
          fieldId: 'tf_lg_memo',
          order: 5,
          name: '활동 기록',
          helpText: '보조 메모 (선택)',
          required: false,
          type: 'short_text',
        },
      ],
    },
  ],
  teams: [
    {
      teamId: 'team_rec',
      teamName: '추천시스템 팀',
      cohortId: 'coh_ai5_a',
      memberCount: 5,
    },
    // 미배정 — 추천시스템 팀과 같은 반(409 MENTOR_ASSIGNMENT_DUPLICATED_COHORT 시연)
    {
      teamId: 'team_ad',
      teamName: '이상탐지 ML 팀',
      cohortId: 'coh_ai5_a',
      memberCount: 4,
    },
    {
      teamId: 'team_ts',
      teamName: '트러블슈팅 팀',
      cohortId: 'coh_ai5_b',
      memberCount: 6,
    },
    {
      teamId: 'team_dm',
      teamName: '데이터마트 팀',
      cohortId: 'coh_da4_a',
      memberCount: 4,
    },
    // 미배정 — 빈 반(배정 생성 성공 경로)
    {
      teamId: 'team_pub',
      teamName: '공공 데이터 팀',
      cohortId: 'coh_da4_b',
      memberCount: 4,
    },
  ],
  // 배정 3건 — 멘토 콘솔 mock 의 임수현 배정(추천시스템 12h/8h · 데이터마트 10h/10h ·
  // 트러블슈팅 8h/3.5h)과 동일 수치.
  assignments: [
    {
      assignmentId: 'asgn_rec',
      teamId: 'team_rec',
      mentorId: 'mentor_lim',
      allocatedHours: 12,
      recognizedHours: 8,
      status: 'active',
      logTemplateId: 'tpl_default_v21',
    },
    {
      assignmentId: 'asgn_dm',
      teamId: 'team_dm',
      mentorId: 'mentor_lim',
      allocatedHours: 10,
      recognizedHours: 10,
      status: 'active',
      logTemplateId: 'tpl_default_v21',
      // N시간 완료 → 평가·추천 최종 제출 완료(통계 '평가 완료 · 추천'·'스냅샷 반영 완료' 행)
      evaluation: { submittedAtLabel: '05-28 18:40', recommended: true },
    },
    {
      assignmentId: 'asgn_ts',
      teamId: 'team_ts',
      mentorId: 'mentor_lim',
      allocatedHours: 8,
      recognizedHours: 3.5,
      status: 'active',
      logTemplateId: 'tpl_default_v21',
    },
  ],
  // 일지 12건 — 멘토 콘솔 mock 의 회차·시간·요약과 동일 서사(초안 1 · 수정 요청 1 · 유효 10).
  logs: [
    {
      logId: 'log_rec_5d',
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      performedAt: '2026-05-16T14:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 90,
      recognizedHours: null,
      excessHours: 0,
      status: 'draft',
      resubmitted: false,
      answers: { 1: '콜드 스타트 사용자 처리 로직 자문' },
      history: [
        {
          atLabel: '05-16 16:02',
          actionLabel: '임시 저장 완료',
          tone: 'neutral',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_rec_4',
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      performedAt: '2026-05-26T14:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 90,
      recognizedHours: 1.5,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      // 상세 패널 대표 일지 — 멘토 콘솔 일지 상세 모달(2582:6514) 원문 답변 요약 재현.
      answers: {
        1: '프로젝트 전체 진행 현황 / 데이터 수집·저장 / 추천 시스템 구현 방향 / 중간 발표 점검',
        2: 'LangGraph 기반 추천 아키텍처 설계 리뷰. PR #142 코드 리뷰 진행. hallucination 제어 전략 도입 합의.',
        3: '도메인 데이터 검증 후 사용 결정 / 추천 로직 단순 시작 / 발표 자료는 서비스 목적 중심.',
        4: '이번 회차 미진행 — 다음 회차 PR 단위 리뷰 예정',
      },
      history: [
        {
          atLabel: '05-26 16:05',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
        {
          atLabel: '05-26 16:01',
          actionLabel: '임시 저장 완료',
          tone: 'neutral',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_rec_3',
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      performedAt: '2026-05-20T19:00',
      locationLabel: '오프라인 · 강의장 B',
      actualMinutes: 120,
      recognizedHours: 2,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '콜드 스타트 케이스 디버깅 라이브 + 팀원 1:1 점검' },
      history: [
        {
          atLabel: '05-20 21:10',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_rec_2',
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      performedAt: '2026-05-14T14:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 90,
      recognizedHours: 1.5,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '임베딩 모델 비교 실험 결과 리뷰' },
      history: [
        {
          atLabel: '05-14 15:40',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_rec_1',
      teamId: 'team_rec',
      assignmentId: 'asgn_rec',
      performedAt: '2026-05-08T19:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 180,
      recognizedHours: 3,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '초기 PRD 검토 + 데이터 파이프라인 설계 자문' },
      history: [
        {
          atLabel: '05-08 22:05',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_dm_4',
      teamId: 'team_dm',
      assignmentId: 'asgn_dm',
      performedAt: '2026-05-24T19:00',
      locationLabel: '오프라인 · 강의장 B',
      actualMinutes: 120,
      recognizedHours: 2,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '집계 마트 성능 점검 + 지표 정의 검토' },
      history: [
        {
          atLabel: '05-24 21:30',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_dm_3',
      teamId: 'team_dm',
      assignmentId: 'asgn_dm',
      performedAt: '2026-05-16T19:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 150,
      recognizedHours: 2.5,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '대시보드 지표 검증 세션' },
      history: [
        {
          atLabel: '05-16 21:45',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_dm_2',
      teamId: 'team_dm',
      assignmentId: 'asgn_dm',
      performedAt: '2026-05-09T14:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 120,
      recognizedHours: 2,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: 'ETL 파이프라인 리뷰' },
      history: [
        {
          atLabel: '05-09 16:20',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_dm_1',
      teamId: 'team_dm',
      assignmentId: 'asgn_dm',
      performedAt: '2026-04-30T19:00',
      locationLabel: '오프라인 · 강의장 B',
      actualMinutes: 210,
      recognizedHours: 3.5,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '데이터 모델링 기초 자문' },
      history: [
        {
          atLabel: '04-30 22:40',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    // 수정 요청 중 — 멘토 콘솔 log_ts_3 와 동일 사유(항목 답변 불충분 · 05-23 10:20).
    // 인정 null = 재제출 전 인정 미확정(멘토 콘솔 mock 동일 표현). 운영 신규 수정 요청은
    // 기존 유효본 인정 유지(createLogChangeRequest — 05-31 정책)로 처리한다.
    {
      logId: 'log_ts_3',
      teamId: 'team_ts',
      assignmentId: 'asgn_ts',
      performedAt: '2026-05-22T19:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 60,
      recognizedHours: null,
      excessHours: 0,
      status: 'change_requested',
      resubmitted: false,
      answers: { 1: '장애 재현 시나리오 점검', 2: '장애 재현 시나리오 점검' },
      history: [
        {
          atLabel: '05-23 10:20',
          actionLabel: '수정 요청',
          tone: 'info',
          actor: '운영자',
        },
        {
          atLabel: '05-22 20:30',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: {
        reasonCode: 'template_answer_insufficient',
        note: '수행 내용이 1줄 요약뿐입니다. 회차 진행 내용을 항목 구조에 맞춰 보강한 뒤 전체 수정 후 재제출해 주세요.',
        requestedAtLabel: '2026-05-23 10:20',
      },
    },
    {
      logId: 'log_ts_2',
      teamId: 'team_ts',
      assignmentId: 'asgn_ts',
      performedAt: '2026-05-15T19:00',
      locationLabel: '오프라인 · 강의장 B',
      actualMinutes: 120,
      recognizedHours: 2,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '장애 로그 분석 실습' },
      history: [
        {
          atLabel: '05-15 21:20',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
    {
      logId: 'log_ts_1',
      teamId: 'team_ts',
      assignmentId: 'asgn_ts',
      performedAt: '2026-05-07T14:00',
      locationLabel: '온라인 · Zoom',
      actualMinutes: 90,
      recognizedHours: 1.5,
      excessHours: 0,
      status: 'valid',
      resubmitted: false,
      answers: { 1: '트러블슈팅 리포트 양식 점검' },
      history: [
        {
          atLabel: '05-07 16:00',
          actionLabel: '제출 (유효)',
          tone: 'success',
          actor: '임수현 멘토',
        },
      ],
      changeRequest: null,
    },
  ],
  // 추천시스템 팀(§32 대표) — 기본 v2.1 대비 설명 변경 1 · 신규 추가 1 · 필수 변경 1 ·
  // 비활성 1(= 변경 3 + 비활성 1, Figma 2749:8024 행 구성). 다른 팀은 오버라이드 없음.
  teamFieldOverrides: {
    asgn_rec: [
      {
        fieldId: 'tf_agenda',
        order: 1,
        name: '주요 아젠다',
        helpText: '이번 멘토링에서 다룬 핵심 안건',
        required: true,
        type: 'long_text',
        isActive: true,
      },
      {
        fieldId: 'tf_progress',
        order: 2,
        name: '수행 내용',
        helpText: '회의 흐름에 따른 상세 진행 내용',
        required: true,
        type: 'long_text',
        isActive: true,
      },
      {
        fieldId: 'tf_opinion',
        order: 3,
        name: '멘토 의견 및 요청 사항',
        helpText:
          '팀에게 전달하는 권장사항 (이 팀은 "추천 시스템에 한정해 권장"으로 보강)',
        required: true,
        type: 'long_text',
        isActive: true,
      },
      {
        fieldId: 'tf_codereview',
        order: 4,
        name: '코드리뷰 내용',
        helpText: '코드 단위 피드백 (선택)',
        required: false,
        type: 'long_text',
        isActive: true,
      },
      {
        fieldId: 'fld_rec_llm',
        order: 5,
        name: 'LLM 비용·실험 메모',
        helpText: '이 팀 전용 신규 항목 — 호출 비용·hallucination 사례 기록',
        required: false,
        type: 'long_text',
        isActive: true,
      },
      {
        fieldId: 'tf_next',
        order: 6,
        name: '다음 회차 일정',
        helpText: 'YYYY-MM-DD HH:MM',
        required: true,
        type: 'short_text',
        isActive: true,
      },
      {
        fieldId: 'tf_memo',
        order: 7,
        name: '활동 기록 메모',
        helpText: '사진 첨부 외 보조 메모',
        required: false,
        type: 'short_text',
        isActive: false,
      },
    ],
  },
}

// ───────────────────────── 공통 파생 ─────────────────────────

export type AdminMentoringMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string }

const fail = (
  status: number,
  code: string,
  message: string,
): { ok: false; status: number; code: string; message: string } => ({
  ok: false,
  status,
  code,
  message,
})

const round1 = (n: number) => Math.round(n * 10) / 10

const cohortOf = (cohortId: string) =>
  adminMentoringDb.cohorts.find((c) => c.cohortId === cohortId)!

const mentorOf = (mentorId: string) =>
  adminMentoringDb.mentors.find((m) => m.mentorId === mentorId) ?? null

/** 팀의 현 노출 배정(active·early_ended) — replaced/inactive 는 보존만. */
const visibleAssignmentOf = (teamId: string) =>
  adminMentoringDb.assignments.find(
    (a) =>
      a.teamId === teamId &&
      (a.status === 'active' || a.status === 'early_ended'),
  ) ?? null

const assignmentHasLogs = (assignmentId: string) =>
  adminMentoringDb.logs.some((l) => l.assignmentId === assignmentId)

function toRow(team: AdminMockTeam): MentorAssignmentRow {
  const cohort = cohortOf(team.cohortId)
  const assignment = visibleAssignmentOf(team.teamId)
  return {
    teamId: team.teamId,
    teamName: team.teamName,
    cohortId: team.cohortId,
    cohortLabel: cohort.cohortLabel,
    courseName: cohort.courseName,
    memberCount: team.memberCount,
    assignmentId: assignment?.assignmentId ?? null,
    mentor: assignment ? mentorOf(assignment.mentorId) : null,
    allocatedHours: assignment?.allocatedHours ?? null,
    recognizedHours: assignment ? assignment.recognizedHours : null,
    recognizedPct:
      assignment && assignment.allocatedHours > 0
        ? Math.round(
            (assignment.recognizedHours / assignment.allocatedHours) * 100,
          )
        : null,
    hasLogs: assignment ? assignmentHasLogs(assignment.assignmentId) : false,
    status: assignment
      ? assignment.status === 'early_ended'
        ? 'early_ended'
        : 'active'
      : null,
    nHoursDone: assignment
      ? assignment.recognizedHours >= assignment.allocatedHours
      : false,
    logTemplateId: assignment?.logTemplateId ?? null,
  }
}

/** ['AI 5기 1', 'DA 4기 1'] 형태 분포 힌트. */
function distributionHint(labels: string[]) {
  const counts = new Map<string, number>()
  labels.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1))
  return [...counts.entries()].map(([label, n]) => `${label} ${n}`).join(' · ')
}

/** GET /admin/mentors/assignments 응답 빌더. */
export function buildAssignmentsData(): MentorAssignmentsData {
  const rows = adminMentoringDb.teams.map(toRow)
  const active = rows.filter((r) => r.status === 'active')
  const unassigned = rows.filter((r) => !r.assignmentId)
  const earlyEnded = rows.filter((r) => r.status === 'early_ended')
  return {
    kpis: {
      activeMentors: new Set(active.map((r) => r.mentor?.mentorId)).size,
      activeAssignments: active.length,
      activeAssignmentsHint:
        distributionHint(active.map((r) => r.cohortLabel)) || '활성 배정 없음',
      unassignedTeams: unassigned.length,
      unassignedTeamsHint:
        distributionHint(unassigned.map((r) => r.cohortLabel)) || '미배정 없음',
      earlyEnded: earlyEnded.length,
    },
    cohorts: adminMentoringDb.cohorts,
    mentors: adminMentoringDb.mentors,
    // 배정 폼 선택지 — 활성 템플릿만(§31 비활성화 = 신규 배정 선택 불가, 기존 스냅샷 보존)
    templates: adminMentoringDb.logTemplates
      .filter((t) => t.isActive)
      .map(({ templateId, name, isDefault }) => ({
        templateId,
        name,
        isDefault,
      })),
    rows,
    summary: {
      total: rows.length,
      active: active.length,
      unassigned: unassigned.length,
    },
  }
}

// ───────────────────────── 배정 mutation (§29) ─────────────────────────

let assignmentSeq = 0

/**
 * POST /admin/mentors/assignments — 배정 생성.
 * §29 게이트: 템플릿 필수 · N시간>0(422 MENTOR_ASSIGNMENT_HOURS_INVALID) ·
 * 한 반에 한 팀만(409 MENTOR_ASSIGNMENT_DUPLICATED_COHORT).
 * 같은 팀 재배정(교체): 일지 있으면 기존 배정 replaced 보존(일지·인정 시간·평가 책임 유지),
 * 일지 작성 전이면 inactive 해제 후 새 배정 생성(05-26 §3).
 */
export function createAssignment(
  payload: Partial<MentorAssignmentCreateRequest>,
): AdminMentoringMutationResult<MentorAssignmentRow> {
  const team = adminMentoringDb.teams.find((t) => t.teamId === payload.teamId)
  if (!team) {
    return fail(404, 'ADMIN_MENTORING_TEAM_NOT_FOUND', '팀을 찾을 수 없습니다.')
  }
  if (!payload.logTemplateId) {
    // 명세 에러 코드 미등재 — FE 는 폼에서 선차단, mock 은 안내 코드로 응답(BE 확정 시 정합 TODO).
    return fail(
      422,
      'MENTOR_ASSIGNMENT_TEMPLATE_REQUIRED',
      '배정 폼에서 일지 템플릿 필수 선택 안내',
    )
  }
  if (
    !adminMentoringDb.logTemplates.some(
      (t) => t.templateId === payload.logTemplateId && t.isActive,
    )
  ) {
    return fail(
      404,
      'ADMIN_MENTORING_TEMPLATE_NOT_FOUND',
      '일지 템플릿을 찾을 수 없습니다.',
    )
  }
  if (!payload.mentorId || !mentorOf(payload.mentorId)) {
    return fail(
      404,
      'ADMIN_MENTORING_MENTOR_NOT_FOUND',
      '멘토를 찾을 수 없습니다.',
    )
  }
  if (!payload.allocatedHours || payload.allocatedHours <= 0) {
    return fail(
      422,
      'MENTOR_ASSIGNMENT_HOURS_INVALID',
      '배정 N시간은 0보다 커야 합니다.',
    )
  }
  // 한 반에 한 팀만 — 같은 반의 "다른 팀"에 활성 배정이 있으면 차단(같은 팀 교체는 허용).
  const cohortConflict = adminMentoringDb.teams.some(
    (t) =>
      t.cohortId === team.cohortId &&
      t.teamId !== team.teamId &&
      visibleAssignmentOf(t.teamId)?.status === 'active',
  )
  if (cohortConflict) {
    return fail(
      409,
      'MENTOR_ASSIGNMENT_DUPLICATED_COHORT',
      '같은 반 중복 배정 — 동일 cohort에 이미 팀이 배정되어 있습니다 (저장 차단).',
    )
  }
  const existing = visibleAssignmentOf(team.teamId)
  if (existing) {
    // 덮어쓰기 금지 — 일지 존재 시 기존 배정·일지·인정 시간·평가 책임 보존(replaced).
    existing.status = assignmentHasLogs(existing.assignmentId)
      ? 'replaced'
      : 'inactive'
  }
  assignmentSeq += 1
  adminMentoringDb.assignments.push({
    assignmentId: `asgn_new_${assignmentSeq}`,
    teamId: team.teamId,
    mentorId: payload.mentorId,
    allocatedHours: payload.allocatedHours,
    recognizedHours: 0,
    status: 'active',
    logTemplateId: payload.logTemplateId,
  })
  return { ok: true, data: toRow(team) }
}

/**
 * PATCH /admin/mentors/assignments/{assignmentId} — 멘토 교체(일지 작성 전에만).
 * 일지가 하나라도 있으면 409 MENTOR_ASSIGNMENT_HAS_LOGS — FE 는 '기존 배정 보존 +
 * 새 배정 생성'(createAssignment)으로 안내한다.
 */
export function changeAssignmentMentor(
  assignmentId: string,
  mentorId: string | undefined,
): AdminMentoringMutationResult<MentorAssignmentRow> {
  const assignment = adminMentoringDb.assignments.find(
    (a) => a.assignmentId === assignmentId && a.status === 'active',
  )
  if (!assignment) {
    return fail(
      404,
      'ADMIN_MENTORING_ASSIGNMENT_NOT_FOUND',
      '배정을 찾을 수 없습니다.',
    )
  }
  if (!mentorId || !mentorOf(mentorId)) {
    return fail(
      404,
      'ADMIN_MENTORING_MENTOR_NOT_FOUND',
      '멘토를 찾을 수 없습니다.',
    )
  }
  if (assignmentHasLogs(assignmentId)) {
    return fail(
      409,
      'MENTOR_ASSIGNMENT_HAS_LOGS',
      '일지가 있는 배정은 수정할 수 없습니다 — 기존 배정을 보존하고 새 배정을 생성하세요.',
    )
  }
  assignment.mentorId = mentorId
  const team = adminMentoringDb.teams.find(
    (t) => t.teamId === assignment.teamId,
  )!
  return { ok: true, data: toRow(team) }
}

/**
 * PATCH /admin/mentors/assignments/{assignmentId}/allocated-hours — N시간 수정(언제든).
 * 감소 → 기존 인정 시간 유지(새 기준 충족 시 즉시 N시간 완료) /
 * 증가 → 최신 유효 일지 기준 재계산(완료 팀도 진행 중 복귀) — 05-26 §3.
 */
export function updateAllocatedHours(
  assignmentId: string,
  allocatedHours: number | undefined,
): AdminMentoringMutationResult<MentorAssignmentRow> {
  const assignment = adminMentoringDb.assignments.find(
    (a) =>
      a.assignmentId === assignmentId &&
      (a.status === 'active' || a.status === 'early_ended'),
  )
  if (!assignment) {
    return fail(
      404,
      'ADMIN_MENTORING_ASSIGNMENT_NOT_FOUND',
      '배정을 찾을 수 없습니다.',
    )
  }
  if (!allocatedHours || allocatedHours <= 0) {
    return fail(
      422,
      'MENTOR_ASSIGNMENT_HOURS_INVALID',
      '배정 N시간은 0보다 커야 합니다.',
    )
  }
  if (allocatedHours > assignment.allocatedHours) {
    // 증가 — 유효 일지 실제 진행 시간 합 기준 재계산(잔여까지만 인정, SSOT 수식).
    const validActualHours =
      adminMentoringDb.logs
        .filter((l) => l.assignmentId === assignmentId && l.status === 'valid')
        .reduce((sum, l) => sum + l.actualMinutes, 0) / 60
    assignment.recognizedHours = round1(
      Math.min(validActualHours, allocatedHours),
    )
  }
  // 감소 — 기존 인정 시간 유지(차감·소급 없음).
  assignment.allocatedHours = allocatedHours
  const team = adminMentoringDb.teams.find(
    (t) => t.teamId === assignment.teamId,
  )!
  return { ok: true, data: toRow(team) }
}

/**
 * POST /admin/mentors/assignments/{assignmentId}/early-end — 조기 종료.
 * 사유 필수(422 MENTOR_EARLY_END_REASON_REQUIRED) · 평가·추천 가능 상태로 전환.
 * 사유는 멘토에게만 표시·수강생 비공개(멘토 측 반영은 BE 확정 시 — 역할 교차 주석).
 */
export function earlyEndAssignment(
  assignmentId: string,
  reason: string | undefined,
): AdminMentoringMutationResult<MentorAssignmentRow> {
  const assignment = adminMentoringDb.assignments.find(
    (a) => a.assignmentId === assignmentId && a.status === 'active',
  )
  if (!assignment) {
    return fail(
      404,
      'ADMIN_MENTORING_ASSIGNMENT_NOT_FOUND',
      '배정을 찾을 수 없습니다.',
    )
  }
  if (!reason?.trim()) {
    return fail(
      422,
      'MENTOR_EARLY_END_REASON_REQUIRED',
      '조기 종료 사유 입력이 필요합니다.',
    )
  }
  assignment.status = 'early_ended'
  assignment.earlyEndedReason = reason.trim()
  const team = adminMentoringDb.teams.find(
    (t) => t.teamId === assignment.teamId,
  )!
  return { ok: true, data: toRow(team) }
}

// ───────────────────────── 일지 read model (§30) ─────────────────────────

const dateTimeLabelOf = (iso: string) =>
  `${iso.slice(5, 10)} ${iso.slice(11, 16)}`

/** '2026-05-26T14:00' + 90분 → '2026-05-26 14:00 → 15:30' */
function conductedRangeLabelOf(iso: string, minutes: number) {
  const [h, m] = iso.slice(11, 16).split(':').map(Number)
  const total = h * 60 + m + minutes
  const pad = (n: number) => String(n).padStart(2, '0')
  const end = `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} → ${end}`
}

const teamNameOf = (teamId: string) =>
  adminMentoringDb.teams.find((t) => t.teamId === teamId)?.teamName ?? ''

const mentorNameOfLog = (log: AdminMockLog) => {
  const assignment = adminMentoringDb.assignments.find(
    (a) => a.assignmentId === log.assignmentId,
  )
  return (assignment && mentorOf(assignment.mentorId)?.name) || '임수현'
}

const sortedLogs = () =>
  [...adminMentoringDb.logs].sort((a, b) =>
    b.performedAt.localeCompare(a.performedAt),
  )

function toLogRow(log: AdminMockLog): AdminMentoringLogRow {
  return {
    logId: log.logId,
    teamId: log.teamId,
    teamName: teamNameOf(log.teamId),
    mentorName: mentorNameOfLog(log),
    performedAtLabel: dateTimeLabelOf(log.performedAt),
    actualMinutes: log.actualMinutes,
    recognizedHours: log.recognizedHours,
    excessHours: log.excessHours,
    status: log.status,
    resubmitted: log.resubmitted,
  }
}

/** GET /admin/mentoring/logs 응답 빌더 — KPI·요약은 상태에서 파생(상태 변경 즉시 반영). */
export function buildAdminLogsData(): AdminMentoringLogsData {
  const logs = sortedLogs()
  const valid = logs.filter((l) => l.status === 'valid')
  const changeRequested = logs.filter((l) => l.status === 'change_requested')
  const drafts = logs.filter((l) => l.status === 'draft')
  return {
    kpis: {
      valid: valid.length,
      changeRequested: changeRequested.length,
      draft: drafts.length,
      resubmitted: valid.filter((l) => l.resubmitted).length,
    },
    monthlySubmitted: logs.length - drafts.length,
    pendingCount: changeRequested.length,
    rows: logs.map(toLogRow),
  }
}

/** GET /admin/mentoring/logs/{logId} 응답 빌더 — 미존재 시 null(404 처리). */
export function buildAdminLogDetail(
  logId: string,
): AdminMentoringLogDetail | null {
  const log = adminMentoringDb.logs.find((l) => l.logId === logId)
  if (!log) return null
  // 회차 = 같은 팀 "제출된" 일지의 진행 일시 오름차순 순번(초안은 제출 시 회차 확정 —
  // 작성 중 초안은 제출분 다음 회차로 표기).
  const submittedLogs = adminMentoringDb.logs
    .filter((l) => l.teamId === log.teamId && l.status !== 'draft')
    .sort((a, b) => a.performedAt.localeCompare(b.performedAt))
  const submittedIndex = submittedLogs.findIndex((l) => l.logId === logId)
  const round =
    submittedIndex >= 0 ? submittedIndex + 1 : submittedLogs.length + 1
  const snapshotItems: AdminMentoringLogSnapshotItem[] = SNAPSHOT_FIELDS.map(
    (field) => ({
      ...field,
      answer: log.answers[field.order] ?? '',
    }),
  )
  return {
    logId: log.logId,
    teamId: log.teamId,
    teamName: teamNameOf(log.teamId),
    roundLabel: `${round}회차`,
    mentorName: mentorNameOfLog(log),
    conductedRangeLabel: conductedRangeLabelOf(
      log.performedAt,
      log.actualMinutes,
    ),
    actualMinutes: log.actualMinutes,
    recognizedHours: log.recognizedHours,
    excessHours: log.excessHours,
    locationLabel: log.locationLabel,
    templateLabel: TEMPLATE_LABEL,
    status: log.status,
    resubmitted: log.resubmitted,
    snapshotItems,
    history: log.history,
    changeRequest: log.changeRequest && {
      ...log.changeRequest,
      reasonLabel:
        MENTORING_LOG_CHANGE_REASON_LABEL[log.changeRequest.reasonCode],
    },
  }
}

// ───────────────────────── 일지 수정 요청 mutation (§30) ─────────────────────────

/** 'MM-DD HH:mm' 현재 시각 — 이력 타임스탬프용. */
function nowLabel() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * POST /admin/mentoring/logs/{logId}/change-requests — 수정 요청.
 * 게이트: 초안 대상 불가(422) · 미해결 요청 logId당 1건(409
 * MENTORING_LOG_CHANGE_REQUEST_EXISTS) · 사유 코드 + 상세 메모 필수(422).
 * 수정 요청 중에도 기존 유효본 인정 시간·평가 가능 상태 유지(인정 값 변경 없음).
 * 멘토 재제출(즉시 자동 유효·재계산)은 멘토 콘솔 소관 — 역할 교차 반영은 BE 확정 시.
 */
export function createLogChangeRequest(
  logId: string,
  payload: Partial<MentoringLogChangeRequestPayload> | undefined,
): AdminMentoringMutationResult<AdminMentoringLogDetail> {
  const log = adminMentoringDb.logs.find((l) => l.logId === logId)
  if (!log) {
    return fail(
      404,
      'ADMIN_MENTORING_LOG_NOT_FOUND',
      '일지를 찾을 수 없습니다.',
    )
  }
  if (log.status === 'draft') {
    return fail(
      422,
      'MENTORING_LOG_CHANGE_REQUEST_DRAFT_FORBIDDEN',
      '초안 일지는 수정 요청 대상이 아닙니다.',
    )
  }
  if (log.status === 'change_requested') {
    return fail(
      409,
      'MENTORING_LOG_CHANGE_REQUEST_EXISTS',
      '미해결 수정 요청이 이미 있습니다 — 멘토 재제출 후 다시 요청할 수 있습니다.',
    )
  }
  const reasonCode = payload?.reasonCode
  if (
    !reasonCode ||
    !(reasonCode in MENTORING_LOG_CHANGE_REASON_LABEL) ||
    !payload?.note?.trim()
  ) {
    return fail(
      422,
      'MENTORING_LOG_CHANGE_REQUEST_REASON_REQUIRED',
      '수정 요청에는 사유 코드와 상세 메모가 필요합니다.',
    )
  }
  log.status = 'change_requested'
  // 기존 유효본 인정 시간 유지 — recognizedHours/excessHours 그대로(배정 누적도 불변).
  log.changeRequest = {
    reasonCode,
    note: payload.note.trim(),
    requestedAtLabel: nowLabel(),
  }
  log.history = [
    {
      atLabel: nowLabel(),
      actionLabel: '수정 요청',
      tone: 'info',
      actor: '운영자',
    },
    ...log.history,
  ]
  return { ok: true, data: buildAdminLogDetail(logId)! }
}

// ───────────────────────── 일지 템플릿 (§31) ─────────────────────────

/** 'YYYY-MM-DD' 오늘 — 템플릿 수정일 갱신용. */
function todayIso() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const templateOf = (templateId: string) =>
  adminMentoringDb.logTemplates.find((t) => t.templateId === templateId) ?? null

/** 적용 팀 수 — 현 노출 배정(active·early_ended)이 이 템플릿을 쓰는 수(상태 파생). */
const appliedTeamCountOf = (templateId: string) =>
  adminMentoringDb.assignments.filter(
    (a) =>
      a.logTemplateId === templateId &&
      (a.status === 'active' || a.status === 'early_ended'),
  ).length

function toTemplateView(t: AdminMockTemplate): AdminLogTemplate {
  return {
    templateId: t.templateId,
    name: t.name,
    description: t.description,
    isDefault: t.isDefault,
    isActive: t.isActive,
    appliedTeamCount: appliedTeamCountOf(t.templateId),
    updatedAtLabel: t.updatedAt.slice(5),
    fields: t.fields.map((f) => ({ ...f })),
  }
}

/** GET /admin/mentoring/log-templates 응답 빌더 — 비활성 포함 전체(필터는 화면 소관). */
export function buildLogTemplatesData(): AdminLogTemplatesData {
  const templates = adminMentoringDb.logTemplates.map(toTemplateView)
  return {
    summary: {
      total: templates.length,
      defaults: templates.filter((t) => t.isDefault).length,
    },
    templates,
  }
}

let templateSeq = 0
let templateFieldSeq = 0

/** POST /admin/mentoring/log-templates — 생성(이름 필수 422, 항목은 편집 카드에서 추가). */
export function createLogTemplate(
  payload: Partial<TemplateCreatePayload> | undefined,
): AdminMentoringMutationResult<AdminLogTemplate> {
  if (!payload?.name?.trim()) {
    return fail(
      422,
      'MENTORING_TEMPLATE_NAME_REQUIRED',
      '템플릿 이름을 입력해 주세요.',
    )
  }
  templateSeq += 1
  const template: AdminMockTemplate = {
    templateId: `tpl_new_${templateSeq}`,
    name: payload.name.trim(),
    description: payload.description?.trim() ?? '',
    isDefault: false,
    isActive: true,
    updatedAt: todayIso(),
    fields: [],
  }
  adminMentoringDb.logTemplates.push(template)
  return { ok: true, data: toTemplateView(template) }
}

/** POST /admin/mentoring/log-templates/{id}/duplicate — 복제(항목 포함, 기본 OFF). */
export function duplicateLogTemplate(
  templateId: string,
): AdminMentoringMutationResult<AdminLogTemplate> {
  const source = templateOf(templateId)
  if (!source) {
    return fail(
      404,
      'ADMIN_MENTORING_TEMPLATE_NOT_FOUND',
      '일지 템플릿을 찾을 수 없습니다.',
    )
  }
  templateSeq += 1
  const copy: AdminMockTemplate = {
    templateId: `tpl_new_${templateSeq}`,
    name: `${source.name} (복제)`,
    description: source.description,
    isDefault: false,
    isActive: true,
    updatedAt: todayIso(),
    fields: source.fields.map((f) => {
      templateFieldSeq += 1
      return { ...f, fieldId: `tfd_${templateFieldSeq}` }
    }),
  }
  adminMentoringDb.logTemplates.push(copy)
  return { ok: true, data: toTemplateView(copy) }
}

/** 항목 공통 검증 — 항목명 필수 · 타입 2종만(422 MENTORING_TEMPLATE_FIELD_TYPE_NOT_ALLOWED). */
function validateFields(
  fields: AdminTemplateField[] | undefined,
):
  | { ok: true; fields: AdminTemplateField[] }
  | { ok: false; status: number; code: string; message: string } {
  if (!fields || fields.length === 0) {
    return fail(
      422,
      'MENTORING_TEMPLATE_FIELD_REQUIRED',
      '항목이 1개 이상 필요합니다.',
    )
  }
  if (fields.some((f) => !f.name?.trim())) {
    return fail(
      422,
      'MENTORING_TEMPLATE_FIELD_NAME_REQUIRED',
      '항목명을 입력해 주세요.',
    )
  }
  if (fields.some((f) => f.type !== 'short_text' && f.type !== 'long_text')) {
    return fail(
      422,
      'MENTORING_TEMPLATE_FIELD_TYPE_NOT_ALLOWED',
      '항목 타입은 짧은/긴 텍스트만 허용됩니다 (선택형·점수형·체크리스트 제외).',
    )
  }
  // 표시 순서 정규화(1..N) — 순서 변경·삭제 후 구멍 제거.
  return {
    ok: true,
    fields: fields.map((f, i) => ({ ...f, name: f.name.trim(), order: i + 1 })),
  }
}

/**
 * PATCH /admin/mentoring/log-templates/{id} — 항목 편집(추가·수정·삭제·순서).
 * 기존 제출 일지·작성 중 초안은 작성 당시 스냅샷 보존(소급 적용 없음 — 403
 * MENTORING_TEMPLATE_RETROACTIVE_FORBIDDEN 은 BE 게이트, mock 일지는 자체 스냅샷 보유).
 */
export function updateTemplateFields(
  templateId: string,
  fields: AdminTemplateField[] | undefined,
): AdminMentoringMutationResult<AdminLogTemplate> {
  const template = templateOf(templateId)
  if (!template) {
    return fail(
      404,
      'ADMIN_MENTORING_TEMPLATE_NOT_FOUND',
      '일지 템플릿을 찾을 수 없습니다.',
    )
  }
  const validated = validateFields(fields)
  if (!validated.ok) return validated
  template.fields = validated.fields
  template.updatedAt = todayIso()
  return { ok: true, data: toTemplateView(template) }
}

/**
 * PATCH /admin/mentoring/log-templates/{id}/status — 비활성화/복원.
 * 비활성화 = 신규 배정 선택 불가(기존 팀·일지 영향 없음). 기본 템플릿은 비활성화
 * 불가(기본 1개 유지 — isDefault 단일성 규칙 BE 미확정, mock 자체 게이트 TODO).
 */
export function setTemplateStatus(
  templateId: string,
  isActive: boolean | undefined,
): AdminMentoringMutationResult<AdminLogTemplate> {
  const template = templateOf(templateId)
  if (!template) {
    return fail(
      404,
      'ADMIN_MENTORING_TEMPLATE_NOT_FOUND',
      '일지 템플릿을 찾을 수 없습니다.',
    )
  }
  if (typeof isActive !== 'boolean') {
    return fail(
      422,
      'MENTORING_TEMPLATE_STATUS_INVALID',
      '템플릿 상태 값이 올바르지 않습니다.',
    )
  }
  if (!isActive && template.isDefault) {
    return fail(
      422,
      'MENTORING_TEMPLATE_DEFAULT_DEACTIVATE_FORBIDDEN',
      '기본 템플릿은 비활성화할 수 없습니다 — 다른 템플릿을 기본으로 지정한 뒤 시도하세요.',
    )
  }
  template.isActive = isActive
  template.updatedAt = todayIso()
  return { ok: true, data: toTemplateView(template) }
}

// ───────────────────────── 팀별 일지 항목 (§32) ─────────────────────────

const visibleAssignmentById = (assignmentId: string) =>
  adminMentoringDb.assignments.find(
    (a) =>
      a.assignmentId === assignmentId &&
      (a.status === 'active' || a.status === 'early_ended'),
  ) ?? null

/**
 * GET /admin/mentoring/assignments/{assignmentId}/log-fields 응답 빌더.
 * 오버라이드 없으면 배정 템플릿 항목 그대로(전부 활성). templateFields 는 diff 비교·
 * '템플릿 값 복원' 기준. 화면 라우트는 teamId(/admin/mentoring/teams/:teamId/log-fields),
 * API 는 assignmentId — 매핑은 배정 보드 조회로 해소(명세 매핑 규칙 미정 TODO).
 */
export function buildTeamLogFields(
  assignmentId: string,
): AdminTeamLogFieldsData | null {
  const assignment = visibleAssignmentById(assignmentId)
  if (!assignment) return null
  const template = templateOf(assignment.logTemplateId)
  if (!template) return null
  const team = adminMentoringDb.teams.find(
    (t) => t.teamId === assignment.teamId,
  )!
  const override = adminMentoringDb.teamFieldOverrides[assignmentId]
  const fields =
    override?.map((f) => ({ ...f })) ??
    template.fields.map((f) => ({ ...f, isActive: true }))
  return {
    assignmentId,
    teamId: team.teamId,
    teamName: team.teamName,
    cohortName: cohortOf(team.cohortId).cohortName,
    mentorName: mentorOf(assignment.mentorId)?.name ?? '',
    memberCount: team.memberCount,
    baseTemplateName: template.name,
    templateFields: template.fields.map((f) => ({ ...f })),
    fields,
  }
}

/**
 * PUT /admin/mentoring/assignments/{assignmentId}/log-fields — 변경 일괄 저장.
 * 다음 일지부터 적용 · 작성된 일지/초안은 작성 당시 스냅샷 보존(§32 — mock 일지는
 * answers+SNAPSHOT_FIELDS 자체 보유라 자동 충족). 활성 항목 0개는 차단.
 */
export function saveTeamLogFields(
  assignmentId: string,
  fields: AdminTeamLogField[] | undefined,
): AdminMentoringMutationResult<AdminTeamLogFieldsData> {
  if (!visibleAssignmentById(assignmentId)) {
    return fail(
      404,
      'ADMIN_MENTORING_ASSIGNMENT_NOT_FOUND',
      '배정을 찾을 수 없습니다.',
    )
  }
  const validated = validateFields(fields)
  if (!validated.ok) return validated
  if (fields!.every((f) => !f.isActive)) {
    return fail(
      422,
      'MENTORING_TEAM_FIELD_ACTIVE_REQUIRED',
      '활성 항목이 1개 이상 필요합니다.',
    )
  }
  // validateFields 가 이름 trim·순서 정규화(1..N)한 결과에 활성 여부만 입력 순서대로 복원.
  adminMentoringDb.teamFieldOverrides[assignmentId] = validated.fields.map(
    (f, i) => ({ ...f, isActive: fields![i].isActive !== false }),
  )
  return { ok: true, data: buildTeamLogFields(assignmentId)! }
}

/** POST /admin/mentoring/assignments/{assignmentId}/log-fields/reset — 템플릿으로 되돌리기. */
export function resetTeamLogFields(
  assignmentId: string,
): AdminMentoringMutationResult<AdminTeamLogFieldsData> {
  if (!visibleAssignmentById(assignmentId)) {
    return fail(
      404,
      'ADMIN_MENTORING_ASSIGNMENT_NOT_FOUND',
      '배정을 찾을 수 없습니다.',
    )
  }
  delete adminMentoringDb.teamFieldOverrides[assignmentId]
  return { ok: true, data: buildTeamLogFields(assignmentId)! }
}

// ───────────────────────── 멘토 통계 (§33) — 조회 전용 ─────────────────────────

/**
 * 팀 상태 파생 — 정책 enum 중 통계 노출 5종. 우선순위: 평가 가능(완료/평가 필요) >
 * 수정 요청 > 일지 필요(제출 일지 0) > 진행 중. reservation_waiting 은 예약(멘토 콘솔)
 * 소관이라 운영 mock 파생 범위 밖 — BE 확정 시 정합.
 */
function statTeamStatusOf(
  assignment: AdminMockAssignment,
): MentoringTeamStatKey {
  const logs = adminMentoringDb.logs.filter(
    (l) => l.assignmentId === assignment.assignmentId,
  )
  const eligible =
    assignment.status === 'early_ended' ||
    assignment.recognizedHours >= assignment.allocatedHours
  if (eligible) {
    return assignment.evaluation ? 'completed' : 'evaluation_needed'
  }
  if (logs.some((l) => l.status === 'change_requested')) {
    return 'change_requested'
  }
  if (!logs.some((l) => l.status !== 'draft')) return 'log_needed'
  return 'in_progress'
}

function toStatRow(assignment: AdminMockAssignment): MentorTeamStatRow {
  const team = adminMentoringDb.teams.find(
    (t) => t.teamId === assignment.teamId,
  )!
  const cohort = cohortOf(team.cohortId)
  const logs = adminMentoringDb.logs.filter(
    (l) => l.assignmentId === assignment.assignmentId,
  )
  const eligible =
    assignment.status === 'early_ended' ||
    assignment.recognizedHours >= assignment.allocatedHours
  return {
    assignmentId: assignment.assignmentId,
    teamId: team.teamId,
    teamName: team.teamName,
    mentorId: assignment.mentorId,
    mentorName: mentorOf(assignment.mentorId)?.name ?? '',
    courseName: cohort.courseName,
    cohortLabel: cohort.cohortLabel,
    allocatedHours: assignment.allocatedHours,
    recognizedHours: assignment.recognizedHours,
    logCount: logs.filter((l) => l.status !== 'draft').length,
    changeRequestCount: logs.filter((l) => l.status === 'change_requested')
      .length,
    teamStatus: statTeamStatusOf(assignment),
    evaluation: assignment.evaluation
      ? 'submitted'
      : eligible
        ? 'needed'
        : 'not_eligible',
    recommendation: assignment.evaluation
      ? assignment.evaluation.recommended
        ? 'recommended'
        : 'not_recommended'
      : 'pending',
    certificate: assignment.evaluation
      ? 'reflected'
      : eligible
        ? 'waiting_source'
        : 'not_target',
    earlyEnded: assignment.status === 'early_ended',
  }
}

/**
 * GET /admin/mentoring/statistics 응답 빌더 — A1 배정·일지 상태 공유 파생(배정 생성·
 * 조기 종료·수정 요청이 통계에 즉시 반영). 조회 전용 — mutation 빌더 없음(403
 * MENTORING_STATISTICS_READ_ONLY 는 BE 게이트).
 */
export function buildMentoringStatistics(): AdminMentoringStatisticsData {
  const rows = adminMentoringDb.assignments
    .filter((a) => a.status === 'active' || a.status === 'early_ended')
    .map(toStatRow)
  const summary: Record<MentoringTeamStatKey, number> = {
    in_progress: 0,
    log_needed: 0,
    change_requested: 0,
    evaluation_needed: 0,
    completed: 0,
  }
  rows.forEach((r) => {
    summary[r.teamStatus] += 1
  })
  return { summary, rows }
}
