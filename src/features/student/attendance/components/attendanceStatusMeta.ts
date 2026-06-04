import type { HrdAttendanceStatus } from '../types'

// 출결 상태 메타 — 라벨·배지색·범례 점색의 단일 출처. 배지·범례·이력·요약이 공유한다.
// 색은 raw hex 금지(@theme 토큰만): 출석=success / 지각=warning / 조퇴=info / 외출=accent / 결석=danger.
// (컴포넌트와 한 파일에 두면 react-refresh 경고가 나므로 상수는 이 파일에 분리한다.)
export const ATTENDANCE_STATUS_META: Record<
  HrdAttendanceStatus,
  { label: string; badgeClassName: string; dotClassName: string }
> = {
  PRESENT: {
    label: '출석',
    badgeClassName: 'bg-success-bg text-success',
    dotClassName: 'bg-success',
  },
  LATE: {
    label: '지각',
    badgeClassName: 'bg-warning-bg text-warning',
    dotClassName: 'bg-warning',
  },
  EARLY_LEAVE: {
    label: '조퇴',
    badgeClassName: 'bg-info-bg text-info',
    dotClassName: 'bg-info',
  },
  OUTING: {
    label: '외출',
    badgeClassName: 'bg-accent-bg text-accent-strong',
    dotClassName: 'bg-accent',
  },
  ABSENT: {
    label: '결석',
    badgeClassName: 'bg-danger-bg text-danger',
    dotClassName: 'bg-danger',
  },
}
