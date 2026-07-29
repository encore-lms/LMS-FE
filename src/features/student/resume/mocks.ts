import { http, HttpResponse } from 'msw'
import {
  INTRO_QUESTIONS,
  computeDoneSections,
  missingSections,
} from './constants'
import type {
  ResumeCreatePayload,
  ResumeDetail,
  ResumeListResponse,
  ResumeStatus,
  ResumeSummary,
  ResumeUpdatePayload,
} from './types'

// 이력서 mock — 기능 로컬. 자동 수집 규약: `export const handlers`
// (mocks/handlers.ts 가 import.meta.glob 으로 자동 등록 → handlers.ts 안 건드림).
// 이력서는 실 BE(learning-service) 연동 완료 도메인 — VITE_REAL_AUTH=true면 미등록 → proxy.
// 기본(mock 모드)은 BE 없이 화면 테스트용 in-memory CRUD(새로고침 시 초기화).
// 데이터는 실제 인적정보가 아닌 보편적 샘플값(홍길동·example.com 등).
const ok = <T>(data: T) => HttpResponse.json({ data })

const notFound = () =>
  HttpResponse.json(
    { code: 'RESUME_NOT_FOUND', message: '이력서를 찾을 수 없습니다.' },
    { status: 404 },
  )

// 작성 완료는 11개 섹션이 모두 작성됐을 때만 인정 — 아니면 작성 중으로 강등(단일 기준 강제).
function clampStatus(d: ResumeDetail): ResumeStatus {
  return missingSections(d).length === 0 ? d.status : '작성 중'
}

function toSummary(d: ResumeDetail): ResumeSummary {
  return {
    id: d.id,
    title: d.title,
    status: clampStatus(d),
    doneSections: computeDoneSections(d),
    updatedAt: d.updatedAt,
  }
}

// in-memory store — 전체 이력서를 ResumeDetail 로 보관하고 목록은 toSummary 로 파생.
const store: ResumeDetail[] = [
  {
    id: 'r1',
    title: '백엔드 신입 이력서',
    status: '작성 중',
    basicInfo: {
      name: '홍길동',
      phone: '010-1234-5678',
      email: 'hong@example.com',
      birth: '1998-01-01',
      githubUrl: 'https://github.com/hong-gildong',
      blogUrl: '',
    },
    strength: '데이터를 근거로 문제를 정의하고 단계적으로 해결합니다.',
    educations: [
      {
        title: '한국대학교',
        subtitle: '컴퓨터공학 학사',
        period: '2017.03 ~ 2023.02',
        description: '',
      },
    ],
    careers: [
      {
        title: '(주)테크컴퍼니',
        subtitle: '백엔드 인턴',
        period: '2025.07 ~ 2025.12',
        description: '주문 도메인 REST API 설계 및 개발',
      },
    ],
    certificates: [],
    awards: [],
    trainings: [],
    activities: [],
    skills: ['Java', 'Spring Boot', 'MySQL'],
    projects: [],
    coverLetters: INTRO_QUESTIONS.map((q) => ({ question: q, content: '' })),
    doneSections: [],
    updatedAt: '2026-06-10T09:00:00Z',
  },
  {
    id: 'r2',
    title: '포트폴리오용 이력서',
    status: '작성 완료',
    basicInfo: {
      name: '김민지',
      phone: '010-2345-6789',
      email: 'minji.kim@example.com',
      birth: '1997-05-12',
      githubUrl: 'https://github.com/minji-kim',
      blogUrl: 'https://blog.example.com/minji',
    },
    strength: '사용자 가치를 빠르게 검증하고 개선하는 과정을 좋아합니다.',
    educations: [
      {
        title: '한국대학교',
        subtitle: '소프트웨어학 학사',
        period: '2016.03 ~ 2022.02',
        description: '',
      },
    ],
    careers: [
      {
        title: '(주)스타트업',
        subtitle: '풀스택 개발자',
        period: '2022.03 ~ 2024.12',
        description: '사내 어드민·결제 연동 기능 개발',
      },
    ],
    certificates: [
      {
        title: 'SQLD',
        subtitle: '한국데이터산업진흥원',
        period: '2023.06',
        description: '',
      },
    ],
    awards: [
      {
        title: '교내 해커톤 우수상',
        subtitle: '한국대학교',
        period: '2021.11',
        description: '실시간 협업 메모 서비스로 우수상 수상',
      },
    ],
    trainings: [
      {
        title: '클라우드 부트캠프',
        subtitle: '수료',
        period: '2025.01 ~ 2025.06',
        description: 'AWS 기반 인프라 실습 과정',
      },
    ],
    activities: [
      {
        title: '개발 동아리',
        subtitle: '운영진',
        period: '2020.03 ~ 2021.12',
        description: '주간 알고리즘 스터디 운영 및 신입 멘토링',
      },
    ],
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
    projects: [
      {
        title: '커뮤니티 서비스',
        subtitle: '팀 프로젝트 · 4인',
        period: '2025.03 ~ 2025.05',
        description: '실시간 알림·피드 기능 구현',
      },
    ],
    coverLetters: INTRO_QUESTIONS.map((q) => ({
      question: q,
      content:
        q === '자기소개'
          ? '성장과 협업을 중요하게 생각하는 개발자입니다.'
          : q === '지원동기'
            ? '제품의 처음과 끝을 책임지는 경험을 이어가고 싶습니다.'
            : '',
    })),
    doneSections: [],
    updatedAt: '2026-06-11T15:20:00Z',
  },
]

// 생성 ID 카운터 — 단조 증가(삭제 후 재생성해도 충돌 없음).
let idCounter = store.length

function emptyDetail(id: string, title: string): ResumeDetail {
  return {
    id,
    title,
    status: '작성 중',
    basicInfo: {
      name: '',
      phone: '',
      email: '',
      birth: '',
      githubUrl: '',
      blogUrl: '',
    },
    strength: '',
    educations: [],
    careers: [],
    certificates: [],
    awards: [],
    trainings: [],
    activities: [],
    skills: [],
    projects: [],
    coverLetters: INTRO_QUESTIONS.map((q) => ({ question: q, content: '' })),
    doneSections: [],
    updatedAt: new Date().toISOString(),
  }
}

const resumeHandlers = [
  // 목록 + KPI(누적 피드백)
  http.get('/api/student/resume', () =>
    ok<ResumeListResponse>({
      resumes: store.map(toSummary),
      feedbackCount: 2,
    }),
  ),

  // 새 이력서 생성(빈 초안) → 목록 맨 앞에 추가하고 요약 반환
  http.post('/api/student/resume', async ({ request }) => {
    const body = (await request.json()) as ResumeCreatePayload
    idCounter += 1
    const detail = emptyDetail(
      `r${idCounter}`,
      body.title?.trim() || '새 이력서',
    )
    store.unshift(detail)
    return HttpResponse.json({ data: toSummary(detail) }, { status: 201 })
  }),

  // 단건 조회(편집기 로드) — doneSections·status 는 항상 최신 계산값으로 반환
  http.get('/api/student/resume/:resumeId', ({ params }) => {
    const d = store.find((r) => r.id === String(params.resumeId))
    if (!d) return notFound()
    return ok<ResumeDetail>({
      ...d,
      doneSections: computeDoneSections(d),
      status: clampStatus(d),
    })
  }),

  // 저장/제출 — 편집 필드를 병합하고 doneSections·updatedAt·status 재계산
  http.put('/api/student/resume/:resumeId', async ({ params, request }) => {
    const idx = store.findIndex((r) => r.id === String(params.resumeId))
    if (idx === -1) return notFound()
    const body = (await request.json()) as ResumeUpdatePayload
    const updated: ResumeDetail = {
      ...store[idx],
      ...body,
      id: store[idx].id,
      updatedAt: new Date().toISOString(),
      doneSections: [],
    }
    updated.doneSections = computeDoneSections(updated)
    // 11개 섹션이 모두 작성됐을 때만 작성 완료 유지(아니면 작성 중).
    updated.status = clampStatus(updated)
    store[idx] = updated
    return ok<ResumeSummary>(toSummary(updated))
  }),

  // 삭제
  http.delete('/api/student/resume/:resumeId', ({ params }) => {
    const idx = store.findIndex((r) => r.id === String(params.resumeId))
    if (idx === -1) return notFound()
    store.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

export const handlers =
  import.meta.env.VITE_REAL_AUTH === 'true' ? [] : resumeHandlers
