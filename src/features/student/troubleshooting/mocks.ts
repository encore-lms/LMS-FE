import { http, HttpResponse } from 'msw'
import type { TsCaseDetail, TsListData } from './types'

// 트러블슈팅 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// Figma 목록(360:1297)·상세(3283:5853) 시안 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

const mockList: TsListData = {
  stats: [
    {
      key: 'total',
      label: '총 사례',
      value: '12',
      unit: '건',
      sub: '상황·해결·결과 다 갖춤 가능',
      tone: 'brand',
    },
    {
      key: 'certified',
      label: '인증 완료',
      value: '8',
      unit: '건',
      sub: '증명서 내 인증 사례 카드에 반영',
      tone: 'success',
    },
    {
      key: 'independent',
      label: '독립 해결률',
      value: '83',
      unit: '%',
      sub: '독립 10건 · 동료 도움 2건',
      tone: 'warning',
    },
    {
      key: 'avgdays',
      label: '평균 해결',
      value: '2.3',
      unit: '일',
      sub: '문제 발생 → 해결까지',
      tone: 'accent',
    },
  ],
  filters: [
    { key: 'all', label: '전체', count: 12 },
    { key: 'DB', label: 'DB', count: 4 },
    { key: 'deploy', label: '배포·인프라', count: 3 },
    { key: 'perf', label: '성능', count: 2 },
    { key: 'net', label: '네트워크·API', count: 2 },
    { key: 'etc', label: '기타', count: 1 },
  ],
  cases: [
    {
      id: 'ts1',
      category: 'DB',
      categoryTone: 'info',
      status: 'certified',
      statusLabel: '인증 완료',
      independent: true,
      days: '3일',
      repLinked: true,
      accentTone: 'info',
      title: 'Kafka 컨슈머 리밸런싱으로 메시지 중복 처리',
      createdAt: '작성 2026-04-22',
      updatedAt: '최근 수정 2026-05-10',
      situation:
        '스케일아웃 시 컨슈머 리밸런싱이 발생하면서 동일 주문 이벤트가 두 번 처리되어 멱등성이 깨졌습니다.',
      resolution:
        '멱등성 보장키 + ack 처리 패턴 재설계, 외부 키 기반 dedup 테이블을 적용했습니다.',
      result: '중복 처리 0건/주 · 결제 실패율 8% → 0.4%.',
      tags: ['#Kafka', '#이벤트소싱', '#멱등성'],
      actionLabel: '사례 열기',
    },
    {
      id: 'ts2',
      category: '성능',
      categoryTone: 'warning',
      status: 'reviewing',
      statusLabel: '검토 중',
      independent: true,
      days: '1일',
      repLinked: false,
      accentTone: 'success',
      title: 'JPA N+1 쿼리로 주문 목록 응답 3초 지연',
      createdAt: '작성 2026-05-02',
      updatedAt: '최근 수정 2026-05-12',
      situation:
        '주문 목록 조회 시 연관 엔티티마다 추가 쿼리가 발생해 100건 기준 응답이 3초로 지연됐습니다.',
      resolution:
        'N+1 제거를 위해 @EntityGraph·fetch join을 적용하고 페이지네이션을 보정했습니다.',
      result: '응답시간 3초 → 380ms (-87%).',
      tags: ['#JPA', '#N+1', '#성능'],
      actionLabel: '사례 열기',
    },
    {
      id: 'ts3',
      category: 'DB',
      categoryTone: 'info',
      status: 'draft',
      statusLabel: '작성 중',
      independent: false,
      days: '진행 중',
      repLinked: false,
      accentTone: 'accent',
      title: 'Redis 캐시 stampede로 DB 부하 급증',
      createdAt: '작성 2026-05-13',
      updatedAt: '최근 수정 2026-05-13',
      situation:
        '캐시 만료 직후 다수 요청이 동시에 DB로 몰리면서 커넥션 풀이 고갈됐습니다.',
      resolution:
        'stampede 방지를 위해 PER 알고리즘과 single-flight 락을 적용했습니다.',
      result: 'DB 부하 70% ↓ (작성 중).',
      tags: ['#Redis', '#캐시', '#stampede'],
      actionLabel: '이어 작성',
    },
  ],
  shownLabel: '12건 중 3건 표시',
}

const mockCase: TsCaseDetail = {
  id: 'ts3',
  title: 'API 인증 토큰 만료로 배포 후 요청 실패',
  category: '배포·인프라',
  categoryTone: 'accent',
  status: 'draft',
  statusLabel: '작성 중',
  presentationLinked: false,
  independent: true,
  days: '3일',
  situation:
    '배포 직후 모든 API 요청이 401로 실패했습니다. 로컬에서는 정상 동작했지만 운영 환경에서 인증 토큰 만료 시간이 즉시 지난 값으로 계산되었습니다.',
  resolution:
    '서버 시간대 설정과 토큰 만료 계산 로직을 비교해 UTC/KST 변환 누락을 확인했습니다. 만료 시간 저장을 UTC 기준으로 통일하고 배포 환경 변수 검증 체크를 추가했습니다.',
  result:
    '재배포 후 401 오류가 사라졌고, 인증 실패 재현 테스트와 배포 체크리스트가 추가되었습니다. 같은 이슈 재발 시 배포 전 검증 단계에서 차단할 수 있습니다.',
  attachments: [
    { label: 'server-log.txt', kind: 'file' },
    { label: 'fix-pr 링크', kind: 'link' },
  ],
  checklist: [
    {
      label: '상황/해결/결과 입력 완료',
      status: { label: '완료', tone: 'success' },
    },
    { label: '첨부 근거 2개 등록', status: { label: '완료', tone: 'success' } },
    {
      label: '발표 프로젝트 연결 필요',
      status: { label: '필요', tone: 'warning' },
    },
    {
      label: '중복 인증 요청 없음',
      status: { label: '완료', tone: 'success' },
    },
  ],
  timeline: [
    {
      key: 'draft',
      label: '작성 중 (draft)',
      sub: '현재 상태',
      state: 'current',
    },
    {
      key: 'submitted',
      label: '검토 중 (submitted)',
      sub: '인증 요청 후 전환',
      state: 'todo',
    },
    {
      key: 'certified',
      label: '인증 완료 (certified)',
      sub: '강사 승인 후 잠금',
      state: 'todo',
    },
  ],
  certPresentation: 'Final LMS 프로젝트 · 중간 발표',
  certReviewer: '클라우드 배포 · 강사 검토',
  certChecklist: [
    '상황/해결/결과 3개 항목이 모두 작성됨',
    '발표 프로젝트 또는 교과목이 연결됨',
    '첨부 근거와 소요 일수가 확인됨',
    '동일 사례로 진행 중인 요청이 없음',
  ],
}

export const handlers = [
  http.get('/api/student/troubleshooting', () => ok(mockList)),
  http.get('/api/student/troubleshooting/:id', () => ok(mockCase)),
]
