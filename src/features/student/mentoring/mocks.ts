import { http, HttpResponse } from 'msw'
import type { MentoringData } from './types'

// 멘토링 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// 데이터는 Figma 멘토링(2651:5430) 시안 재현. 멘토 미배정 상태는 ?state=no-mentor 쿼리로 화면에서 처리.
const ok = <T>(data: T) => HttpResponse.json({ data })

const mockMentoring: MentoringData = {
  teamName: 'LLM 추천 시스템 팀',
  mentor: { name: '김효원', specialty: 'AI/ML 전문', assigned: true },
  kpis: {
    inProgress: 1,
    requestLimit: 1,
    completed: 3,
    cumulativeHours: 6,
    remainingHours: 4,
  },
  stats: [
    {
      key: 'waiting',
      label: '요청 대기',
      value: 0,
      caption: '팀 요청 후 멘토 미응답',
      tone: 'neutral',
    },
    {
      key: 'proposed',
      label: '조정 제안',
      value: 1,
      caption: '멘토가 일정/장소 조정 제안',
      tone: 'warning',
    },
    {
      key: 'confirmed',
      label: '확정 예약',
      value: 1,
      caption: '3/26(목) 18:30 오프라인',
      tone: 'success',
    },
    {
      key: 'done',
      label: '완료 기록',
      value: 3,
      caption: '최근 멘토링 완료 건수',
      tone: 'info',
    },
  ],
  activeRequest: {
    id: 'req_4f7c',
    status: 'proposed',
    proposedAtLabel: '2026-03-19 21:40',
    student: {
      person: '임도형 (AI/ML)',
      datetime: '2026-03-25(수) 19:00 ~ 21:00',
      placeType: '온라인',
      placeDetail: 'Zoom — 팀 채널 링크',
      memo: '중간 발표 직전 점검',
    },
    proposal: {
      person: '김효원 멘토',
      datetime: '2026-03-26(목) 18:30 ~ 20:30',
      placeType: '오프라인',
      placeDetail: '플레이데이터 강남캠퍼스 세미나실 B',
      memo: '오프라인이 더 효율적 — 캠퍼스 추천',
    },
  },
  reservation: {
    id: 'res_8b21',
    dateLabel: '2026-03-26(목)',
    timeLabel: '18:30 ~ 20:30',
    placeType: '오프라인',
    placeDetail: '강남캠퍼스 · 세미나실 B',
    estHours: '2h',
    mentorName: '김효원',
    mentorSpecialty: 'AI/ML 전문',
  },
  history: [
    {
      round: 3,
      datetime: '2026-03-12(목) 19:00',
      place: '온라인 · Zoom',
      hours: '예상 2h / 실제 2h',
      requester: '임도형',
    },
    {
      round: 2,
      datetime: '2026-03-05(목) 19:00',
      place: '오프라인 · 강남캠퍼스',
      hours: '예상 2h / 실제 2h',
      requester: '김희준',
    },
    {
      round: 1,
      datetime: '2026-02-26(목) 19:00',
      place: '오프라인 · 강남캠퍼스',
      hours: '예상 2h / 실제 2h',
      requester: '이준서',
    },
  ],
}

export const handlers = [
  http.get('/api/student/mentoring', () => ok<MentoringData>(mockMentoring)),
]
