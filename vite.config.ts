import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// dev 프록시 대상 — 서비스별 포트가 달라(auth:8081, learning:8082, ops:8083) blanket
// 프록시를 두지 않고, 실연동이 끝난 경로만 골라 붙인다. 그 외 /api/* 는 MSW mock이 계속 가로챈다.
const HRD_API_TARGET =
  process.env.VITE_HRD_API_TARGET ?? 'http://localhost:8082'
const AUTH_API_TARGET =
  process.env.VITE_AUTH_API_TARGET ?? 'http://localhost:8081'
// 운영 CSV 인입 — operations-service. 로컬은 kafka-connect가 8083을 점유해 8084로 기동한다
// (LMS-SV/operations-service: SERVER_PORT=8084 ./gradlew bootRun).
const OPS_API_TARGET =
  process.env.VITE_OPS_API_TARGET ?? 'http://localhost:8084'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // FE는 baseURL '/api' 뒤에 BE 경로를 붙여 호출한다(→ /api/admin/hrd-keys).
      // BE 컨트롤러에는 /api prefix가 없으므로 프록시에서 제거한 뒤 :8082로 넘긴다.
      // MSW는 이 경로에 핸들러가 없어 bypass → 실제 네트워크 → 이 프록시로 도달한다.
      // 운영 대시보드(/admin/dashboard) — operations-service(:8084) staging 집계 실연동.
      '/api/admin/dashboard': {
        target: OPS_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 운영 CSV 인입(/admin/csv-ingest) — operations-service(:8084) 실연동(P0_20).
      '/api/admin/csv-ingest': {
        target: OPS_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/admin/hrd-keys': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 교육 과정 추가(HRD-Net 검색·등록)도 learning-service(:8082) 실연동.
      '/api/admin/education': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/admin/courses': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 과제 탭 — 운영 과제 관리(/admin/assignments) learning-service 실연동.
      '/api/admin/assignments': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 강사 과제 페이지(/instructor/assignments) learning-service 실연동(mock 제거).
      '/api/instructor/assignments': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 강사/운영 퀴즈(/instructor/quizzes) learning-service 실연동(mock 제거).
      '/api/instructor/quizzes': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 강사 퀴즈 템플릿(/instructor/quiz-templates) learning-service 실연동(mock 제거).
      '/api/instructor/quiz-templates': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 운영 퀴즈 정답 관리(/admin/quizzes/:id/answers·impact·changes) learning-service 실연동.
      // 수동 채점(.../submissions/:id/grade)은 아직 MSW mock이 가로채므로 프록시로 안 감(핸들러 우선).
      '/api/admin/quizzes': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 퀴즈 응시(/student/quizzes) learning-service 실연동(mock 제거).
      '/api/student/quizzes': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 이력서 작성(/student/resume) learning-service 실연동(mock 제거).
      '/api/student/resume': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 기록실(/student/records) learning-service 실연동(mock 제거).
      '/api/student/records': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 마일리지(/student/mileage) 잔액·내역·상품 learning-service 실연동(mock 제거).
      '/api/student/mileage': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 프로젝트(/student/projects) 생성·목록·삭제 learning-service 실연동.
      // 워크스페이스 상세(/:id)·생성 마법사(/wizard)는 MSW mock이 가로채 유지(핸들러 우선).
      '/api/student/projects': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/student/troubleshooting': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 운영 학습 기록 검토(/admin/records) learning-service 실연동(mock 제거).
      '/api/admin/records': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/admin/mileage/purchase-requests': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/admin/mileage': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/admin/mileage/products': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 과제 목록·상세·제출 learning-service 실연동.
      '/api/student/course/assignments': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 과정 기능 플래그(메뉴 토글 반영)도 learning-service(:8082) 실연동.
      // 그 외 /api/student/* 는 MSW mock 유지(이 경로만 핸들러 없어 bypass → 프록시).
      '/api/student/course-features': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 자료실(GET)도 learning-service 실연동. POST/DELETE(공유)는 MSW mock이라 미프록시.
      '/api/student/course/materials': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 나의 과정 홈(/student/course)도 learning-service 실연동. (온라인교육 등 하위는 MSW mock이 우선 처리)
      '/api/student/course': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 출결 폼(me — 메타/제출/증빙)도 learning-service 실연동.
      '/api/student/attendance-forms/me': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 출결/태도 조회(누적·HRD 캘린더)도 learning-service 실연동.
      '/api/student/attendance/overview': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 QnA 게시판(목록·상세·질문/답변/댓글·채택) — learning-service 실연동.
      '/api/student/qna': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 실로그인(VITE_REAL_AUTH=true)일 때만 MSW가 /api/auth/login을 bypass → 이 프록시로 도달.
      // mock 로그인(기본)에서는 MSW가 가로채므로 이 프록시는 사용되지 않는다.
      '/api/auth': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 동료 평가(/student/peer)는 auth-user-service(:8081) 실연동(mock 제거).
      '/api/student/peer': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 운영 멘토링(/admin/mentoring: 템플릿·일지·통계)도 auth-user-service(:8081) 실연동.
      '/api/admin/mentoring': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 운영 평판 관리(/admin/reputation) — 동료평가(§67) 실데이터 집계. auth-user-service(:8081).
      // 요청 푸시는 클라이언트 낙관(알림 계약 미확정)이라 프록시 미사용.
      '/api/admin/reputation': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 운영 멘토 배정(/admin/mentors/assignments)도 auth-user-service(:8081) 실연동.
      '/api/admin/mentors': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 멘토 멘토링 일지(/mentor/v1/mentoring-logs)도 auth-user-service(:8081) 실연동(mock 제거).
      '/api/mentor/v1': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 멘토링(/student/mentoring)도 auth-user-service(:8081) 실연동(mock 제거).
      '/api/student/mentoring': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 프로필(/student/profile 조회·수정)도 auth-user-service(:8081) 실연동.
      '/api/student/profile': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 수강생 계정(HRD 동기화 등록·목록)도 auth-user-service(:8081) 실연동.
      '/api/users': {
        target: AUTH_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // 개발자 .env.local(실 BE 주소)이 vitest에 새어 들어와 apiClient baseURL이 바뀌면
    // MSW 핸들러(*/api/*)가 매칭되지 않아 client.test.ts가 로컬에서만 깨진다.
    // 테스트는 항상 '' → '/api' 폴백으로 고정해 환경 무관하게 만든다.
    env: {
      VITE_API_BASE_URL: '',
    },
  },
})
