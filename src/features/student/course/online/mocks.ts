import { http, HttpResponse } from 'msw'
import type { OnlineCourse } from './types'

// 온라인 교육(KDC) mock — 기능 로컬. 자동 수집 규약: `export const handlers`
// (mocks/handlers.ts 가 import.meta.glob 으로 자동 등록 → handlers.ts 안 건드림).
// 데이터는 참고 시안(온라인 자기주도 학습 대시보드)을 KDC 콘텐츠로 재현.
const ok = <T>(data: T) => HttpResponse.json({ data })

// 강의 영상은 public/video/*.mp4 (정적 서빙). 파일명은 ASCII 슬러그로 통일해
// 공백·한글(NFD 정규화)·특수문자로 인한 URL 불일치를 원천 차단한다.
const mockOnlineCourse: OnlineCourse = {
  trackLabel: 'K-DIGITAL 기초역량훈련',
  courseName: '네트워크 기초 입문',
  mentor: { name: '김도현', role: '강사', org: 'AI캠프' },
  description:
    '비전공자도 따라올 수 있는 자기주도 온라인 과정입니다. 네트워크의 기본 개념부터 tracert·Wireshark 실습, 네트워크 모델까지 단계별로 학습합니다.\n\n각 차시 영상을 끝까지 시청하면 진도율이 올라가고, 수료 기준 진도율을 충족하면 수료 평가에 응시할 수 있어요.',
  // 진입 시 1차시(첫 강의)부터 시작 — 신규 수강 상태(모든 차시 0%, 시청에 따라 진도율이 실시간 증가).
  currentChapterId: 'ch1',
  // 주차별 1강 해제 — 현재 3주차이므로 1~3차시가 열려 있고 4차시는 잠김(no ≤ currentWeek 만 수강 가능).
  currentWeek: 3,
  chapters: [
    {
      id: 'ch1',
      no: 1,
      title: '네트워크란 무엇인가?',
      durationLabel: '24:27',
      status: 'learning',
      progressPct: 0,
      watchedLabel: '00:00',
      lastVisitLabel: '미시청',
      videoUrl: '/video/01-network-intro.mp4',
      posterUrl: '/video/01-network-intro.jpg',
    },
    {
      id: 'ch2',
      no: 2,
      title: '실습 1 — tracert로 경로 추적',
      durationLabel: '05:24',
      status: 'upcoming',
      progressPct: 0,
      watchedLabel: '00:00',
      lastVisitLabel: '미시청',
      videoUrl: '/video/02-network-tracert.mp4',
      posterUrl: '/video/02-network-tracert.jpg',
    },
    {
      id: 'ch3',
      no: 3,
      title: '실습 2 — Wireshark 패킷 분석',
      durationLabel: '08:32',
      status: 'upcoming',
      progressPct: 0,
      watchedLabel: '00:00',
      lastVisitLabel: '미시청',
      videoUrl: '/video/03-network-wireshark.mp4',
      posterUrl: '/video/03-network-wireshark.jpg',
    },
    {
      id: 'ch4',
      no: 4,
      title: '네트워크의 기준! 네트워크 모델',
      durationLabel: '25:15',
      status: 'upcoming',
      progressPct: 0,
      watchedLabel: '00:00',
      lastVisitLabel: '미시청',
      videoUrl: '/video/04-network-model.mp4',
      posterUrl: '/video/04-network-model.jpg',
    },
  ],
  // 수료 현황은 페이지가 실제 시청에서 실시간 계산하므로 requiredPct 만 의미가 있다(나머지는 초기 표시값).
  completion: {
    overallPct: 0,
    requiredPct: 80,
    completedChapters: 0,
    totalChapters: 4,
    totalDurationLabel: '1시간 04분',
    watchedDurationLabel: '0분',
    statusLabel: '수료 기준까지 진도율 80% 남았어요',
    metStandard: false,
  },
  notices: [
    {
      id: 'n1',
      tone: 'urgent',
      tagLabel: '긴급',
      title: '수료 평가 응시 기간 안내 — 6/30 ~ 7/4',
      timeAgo: '1시간 전',
    },
    {
      id: 'n2',
      tone: 'notice',
      tagLabel: '공지',
      title: '실습 2 자료(Wireshark 캡처 파일) 업로드',
      timeAgo: '어제',
    },
    {
      id: 'n3',
      tone: 'normal',
      tagLabel: '일반',
      title: '학습 진도는 매일 자정에 집계됩니다',
      timeAgo: '3일 전',
    },
  ],
}

export const handlers = [
  http.get('/api/student/course/online', () =>
    ok<OnlineCourse>(mockOnlineCourse),
  ),
]
