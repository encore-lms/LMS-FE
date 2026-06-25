import { useToast } from '@/components/ui/use-toast'
import { TestModeFab } from '@/components/dev/TestModeFab'
import { useAuthStore } from '@/shared/store'
import type { TrainingType } from '@/shared/types'
import { useOnlineCourse } from '../api/course'
import { useOnlineWeekStore } from './online/store'

// 나의 과정 테스트 컨트롤(FE 목 전용) — 하나의 TestModeFab(우하단 🧪 버튼)에 두 컨트롤을 묶었다.
//   · 교육 타입 전환(KDT 강의 홈 ↔ KDC 온라인 교육) — 진입 화면 분기 확인.
//   · (KDC일 때만) 현재 주차 선택 — 주차별 1강 해제(잠금/해제) 확인.
//
// 삭제 방법(추후 한 번에 제거):
//   1) 이 파일(TrainingTypeTestNav.tsx)과 online/store.ts 의 주차 오버라이드 삭제
//   2) CourseHomePage.tsx 의 import 와 <TrainingTypeTestNav /> 한 줄 제거
// BE 연동 시 trainingType 은 로그인 응답이, currentWeek 은 서버(enrollment week)가 내려준다.
const OPTIONS: { value: TrainingType; label: string; desc: string }[] = [
  { value: 'KDT', label: 'KDT', desc: '강의 홈' },
  { value: 'KDC', label: 'KDC', desc: '온라인 교육' },
]

// 패널 안의 작은 섹션 라벨.
function SectionLabel({ children }: { children: string }) {
  return (
    <span className="text-accent-strong/70 text-[10px] font-bold tracking-wide">
      {children}
    </span>
  )
}

const btnClass = (active: boolean) =>
  active
    ? 'bg-accent-strong rounded-lg px-4 py-2 text-[13px] font-bold text-white'
    : 'border-accent-strong/50 text-accent-strong hover:bg-accent-strong/10 rounded-lg border px-4 py-2 text-[13px] font-bold transition-colors'

export function TrainingTypeTestNav() {
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const setSession = useAuthStore((s) => s.setSession)

  if (!user || !token) return null
  const current: TrainingType = user.trainingType ?? 'KDT'

  return (
    <TestModeFab
      openOnHover
      note="나의 과정 테스트 (교육 타입 전환 · 온라인 주차 잠금)"
    >
      {/* 교육 타입 전환 */}
      <SectionLabel>교육 타입</SectionLabel>
      {OPTIONS.map((opt) => {
        const active = opt.value === current
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              if (active) return
              // 현재 토큰은 유지하고 trainingType 만 바꿔 세션을 갱신한다(재로그인 불필요).
              setSession(token, { ...user, trainingType: opt.value })
              toast.success(`${opt.label}로 전환했어요 · ${opt.desc}`)
            }}
            className={btnClass(active)}
          >
            {active ? '● ' : ''}
            {opt.label} · {opt.desc}
          </button>
        )
      })}

      {/* KDC일 때만 주차 선택 — 하위 컴포넌트라 KDC에서만 마운트되어 온라인 데이터를 가져온다. */}
      {current === 'KDC' && <WeekSection />}
    </TestModeFab>
  )
}

// 온라인 교육(KDC) 현재 주차 선택 — 주차별 1강 해제(no ≤ week)를 시뮬레이션.
function WeekSection() {
  const { data } = useOnlineCourse()
  const week = useOnlineWeekStore((s) => s.week)
  const setWeek = useOnlineWeekStore((s) => s.setWeek)
  if (!data) return null

  const total = data.chapters.length
  const current = week ?? data.currentWeek

  return (
    <>
      <div className="bg-accent-strong/20 my-1 h-px w-full" />
      <SectionLabel>현재 주차 · 주차별 1강 해제</SectionLabel>
      {Array.from({ length: total }, (_, i) => i + 1).map((w) => {
        const active = w === current
        return (
          <button
            key={w}
            type="button"
            onClick={() => setWeek(w)}
            className={btnClass(active)}
          >
            {active ? '● ' : ''}
            {w}주차 · 1~{w}강 해제
          </button>
        )
      })}
    </>
  )
}
