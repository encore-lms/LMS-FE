import { http, HttpResponse } from 'msw'
import type { AdminOperatorDashboard } from './types'
import type {
  AnalyticsStats,
  AttendanceAnalytics,
  HeatmapCell,
} from './analyticsTypes'

// 운영 대시보드 mock — 로컬 dev(MSW)용. URL은 /api 프리픽스 포함, 응답은 {data} 래핑.
const ok = <T>(data: T) => HttpResponse.json({ data })

const pad = (n: number) => String(n).padStart(2, '0')
const now = new Date()
const iso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const plusDays = (n: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() + n)
  return d
}

const dashboard: AdminOperatorDashboard = {
  today: iso(now),
  hrdAvailable: true,
  cohorts: [
    {
      cohortId: 'c-skn22',
      name: 'SKN AI/데이터 22기',
      totalStudents: 28,
      checkedInToday: 25,
      absentToday: [
        { id: 's-1', name: '김도윤' },
        { id: 's-2', name: '박서준' },
        { id: 's-3', name: '이하은' },
      ],
      weeklyAttendanceRate: [96, 93, 100, 89, 96],
    },
    {
      cohortId: 'c-skn21',
      name: 'SKN AI/데이터 21기',
      totalStudents: 24,
      checkedInToday: 24,
      absentToday: [],
      weeklyAttendanceRate: [100, 96, 92, 100, 100],
    },
  ],
  repeatedIssues: [
    {
      studentId: 's-2',
      name: '박서준',
      cohortName: 'SKN AI/데이터 22기',
      lateCount: 3,
      absenceCount: 1,
    },
    {
      studentId: 's-9',
      name: '최유진',
      cohortName: 'SKN AI/데이터 22기',
      lateCount: 2,
      absenceCount: 2,
    },
    {
      studentId: 's-14',
      name: '정민재',
      cohortName: 'SKN AI/데이터 21기',
      lateCount: 2,
      absenceCount: 0,
    },
  ],
  pending: {
    mileage: 5,
    blog: 8,
    study: 3,
    certificate: 2,
    recordsTotal: 13,
    topCohort: {
      mileage: null,
      blog: 'c-skn22',
      study: 'c-skn22',
      certificate: 'c-skn21',
    },
  },
  upcoming: {
    quizzes: [
      {
        id: 'q-1',
        title: 'Python 기초 평가',
        cohortName: 'SKN AI/데이터 22기',
        endAt: `${iso(plusDays(1))}T18:00:00`,
        questionCount: 20,
        totalScore: 100,
      },
      {
        id: 'q-2',
        title: 'SQL 중간 점검',
        cohortName: 'SKN AI/데이터 21기',
        endAt: `${iso(plusDays(3))}T23:59:00`,
        questionCount: 15,
        totalScore: 100,
      },
      {
        id: 'q-3',
        title: '머신러닝 개념',
        cohortName: 'SKN AI/데이터 22기',
        endAt: `${iso(plusDays(6))}T18:00:00`,
        questionCount: 25,
        totalScore: 100,
      },
    ],
    cohortEndings: [
      {
        cohortId: 'c-skn21',
        name: 'SKN AI/데이터 21기',
        endDate: iso(plusDays(12)),
        daysLeft: 12,
      },
      {
        cohortId: 'c-skn22',
        name: 'SKN AI/데이터 22기',
        endDate: iso(plusDays(47)),
        daysLeft: 47,
      },
    ],
  },
}

// ── 출석률 분석 mock ──────────────────────────────────────────────
const NAMES = [
  '김도윤',
  '박서준',
  '이하은',
  '최유진',
  '정민재',
  '한소율',
  '오지호',
  '윤채원',
  '임건우',
  '강나윤',
  '조현우',
  '신예은',
  '배준서',
  '문지안',
  '서다인',
  '권시우',
  '남지우',
  '홍서아',
  '고은우',
  '유하린',
]
// yyyymmdd 최근 N 영업일(주말 제외)
function recentBusinessDays(n: number): string[] {
  const out: string[] = []
  const d = new Date(now)
  while (out.length < n) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6)
      out.unshift(
        `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`,
      )
    d.setDate(d.getDate() - 1)
  }
  return out
}
const V = { NORMAL: 1, LATE: 2, ABSENT: 3, EXCUSED: 4 } as const
const VLABEL = ['데이터 없음', '정상', '지각', '결석', '인정결석']

function buildStats(days: string[], students: string[]): AnalyticsStats {
  const points: HeatmapCell[] = []
  let normal = 0,
    late = 0,
    absent = 0,
    excused = 0
  const perStudent = students.map(() => ({ n: 0, l: 0, a: 0, e: 0 }))
  const perDay = days.map(() => ({ present: 0, denom: 0 }))
  students.forEach((_, y) => {
    days.forEach((_, x) => {
      // 결정적 의사난수: 대부분 정상, 가끔 지각/결석/인정결석
      const seed = (x * 7 + y * 13) % 20
      let v: number = V.NORMAL
      if (seed === 3) v = V.LATE
      else if (seed === 11) v = V.ABSENT
      else if (seed === 17) v = V.EXCUSED
      points.push({ x, y, v, label: VLABEL[v] })
      const ps = perStudent[y]
      if (v === V.NORMAL) {
        normal++
        ps.n++
        perDay[x].present++
        perDay[x].denom++
      } else if (v === V.LATE) {
        late++
        ps.l++
        perDay[x].present++
        perDay[x].denom++
      } else if (v === V.ABSENT) {
        absent++
        ps.a++
        perDay[x].denom++
      } else {
        excused++
        ps.e++
      } // 인정결석은 분모 제외
    })
  })
  const rate = (present: number, denom: number) =>
    denom > 0 ? Math.round((present / denom) * 100) : 0
  const dailyRates = days.map((date, x) => ({
    date,
    label: `${Number(date.slice(4, 6))}.${Number(date.slice(6, 8))}`,
    rate: rate(perDay[x].present, perDay[x].denom),
  }))
  const wk = ['월', '화', '수', '목', '금']
  const weekdayRates = wk.map((label, i) => ({
    label,
    rate: 88 + ((i * 3) % 11),
  }))
  const arrivalBuckets = [
    {
      label: '8:30 이전',
      count: 62,
      late: false,
      topStudents: [{ name: students[0], count: 14 }],
    },
    {
      label: '8:30~8:45',
      count: 121,
      late: false,
      topStudents: [{ name: students[1], count: 16 }],
    },
    {
      label: '8:45~9:00',
      count: 84,
      late: false,
      topStudents: [{ name: students[2], count: 12 }],
    },
    {
      label: '9:00~9:10',
      count: 33,
      late: false,
      topStudents: [{ name: students[3], count: 9 }],
    },
    {
      label: '9:11 이후(지각)',
      count: late,
      late: true,
      topStudents: [{ name: students[4], count: 4 }],
    },
  ]
  const studentStats = students.map((name, i) => {
    const ps = perStudent[i]
    const denom = ps.n + ps.l + ps.a
    return {
      studentUuid: `u-${i}`,
      name,
      totalDays: days.length,
      presentDays: ps.n + ps.l,
      lateDays: ps.l,
      absentDays: ps.a,
      excusedDays: ps.e,
      rate: rate(ps.n + ps.l, denom),
    }
  })
  return {
    statusCounts: { normal, late, absent, excused },
    dailyRates,
    weekdayRates,
    arrivalBuckets,
    studentStats,
    heatmap: { students, days, points },
  }
}

const anDays = recentBusinessDays(22)
const analytics: AttendanceAnalytics = {
  hrdAvailable: true,
  cohorts: [
    { cohortId: 'c-skn22', name: 'SKN AI/데이터 22기' },
    { cohortId: 'c-skn21', name: 'SKN AI/데이터 21기' },
  ],
  aggregate: buildStats(anDays, NAMES),
  perCohort: [
    {
      cohortId: 'c-skn22',
      name: 'SKN AI/데이터 22기',
      stats: buildStats(anDays, NAMES.slice(0, 12)),
    },
    {
      cohortId: 'c-skn21',
      name: 'SKN AI/데이터 21기',
      stats: buildStats(anDays, NAMES.slice(12)),
    },
  ],
}

export const handlers = [
  http.get('/api/admin/dashboard', () => ok(dashboard)),
  http.get('/api/admin/dashboard/attendance-analytics', () => ok(analytics)),
]
