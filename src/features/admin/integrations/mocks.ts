import { http, HttpResponse } from 'msw'
import type { IntegrationsData, Integration, SyncJob } from './types'

// 기능별 mock — handlers.ts의 import.meta.glob('../features/**/mocks.ts')가 자동 수집(#37).
const ok = <T>(data: T) => HttpResponse.json({ data })

// ── 외부 연동 (Figma 1546:11613) ──
const integrations: Integration[] = [
  {
    id: 'notion',
    name: 'Notion',
    purpose: '문서/위키 백필',
    lastSync: '05-19 10:22',
    status: 'normal',
    statusLabel: '정상',
    owner: '운영 김',
    actionLabel: '수동 동기화',
  },
  {
    id: 'github',
    name: 'GitHub',
    purpose: '프로젝트 저장소',
    lastSync: '05-19 09:40',
    status: 'error',
    statusLabel: 'Webhook 오류',
    owner: '운영 이',
    actionLabel: '재연결',
  },
  {
    id: 'drive',
    name: 'Google Drive',
    purpose: '증빙 파일',
    lastSync: '05-19 10:10',
    status: 'normal',
    statusLabel: '정상',
    owner: '운영 박',
    actionLabel: '상세',
  },
  {
    id: 'hrd',
    name: '행정 시스템',
    purpose: 'HRD/수강 데이터',
    lastSync: '05-19 08:30',
    status: 'warning',
    statusLabel: '주의',
    owner: '운영 최',
    actionLabel: '권한 확인',
  },
  {
    id: 'slack',
    name: 'Slack 알림',
    purpose: '운영 알림',
    lastSync: '05-18 21:00',
    status: 'inactive',
    statusLabel: '비활성',
    owner: '미배정',
    actionLabel: '설정',
  },
]

const jobs: SyncJob[] = [
  {
    id: 'j1',
    name: 'notion.sync',
    target: '문서 42건',
    status: 'done',
    nextRun: '15분 후',
  },
  {
    id: 'j2',
    name: 'github.webhook.replay',
    target: '이벤트 7건',
    status: 'failed',
    nextRun: '수동',
  },
  {
    id: 'j3',
    name: 'drive.permission.check',
    target: '파일 128건',
    status: 'running',
    nextRun: '-',
  },
  {
    id: 'j4',
    name: 'admin.hrd.delta',
    target: '수강생 2,340명',
    status: 'pending',
    nextRun: '02:00',
  },
]

const overview: IntegrationsData = {
  summary: {
    normal: 4,
    normalHint: '최근 15분',
    warning: 2,
    warningHint: '권한 만료 임박',
    error: 1,
    errorHint: 'GitHub webhook',
    pendingJobs: 18,
    pendingHint: 'SyncJob',
    failureRate: '2.1%',
    failureHint: '24h',
  },
  integrations,
  jobs,
}

export const handlers = [
  http.get('/api/admin/integrations', () => ok<IntegrationsData>(overview)),
]
