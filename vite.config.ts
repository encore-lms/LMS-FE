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
      '/api/admin/hrd-keys': {
        target: HRD_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 교육 과정 추가(HRD-Net 검색·등록)도 learning-service(:8082) 실연동.
      '/api/admin/courses': {
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
      // 실로그인(VITE_REAL_AUTH=true)일 때만 MSW가 /api/auth/login을 bypass → 이 프록시로 도달.
      // mock 로그인(기본)에서는 MSW가 가로채므로 이 프록시는 사용되지 않는다.
      '/api/auth': {
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
  },
})
