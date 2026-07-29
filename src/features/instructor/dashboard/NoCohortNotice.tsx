// 담당 기수 없음 안내 (/instructor/no-cohort) — P1. (Figma 2750:1974)
// 배정 전에는 대시보드 대신 이 안내를 표시한다(대시보드 분기 + 단독 라우트, 06-11 결정).
const NEXT_STEPS = [
  '운영 매니저에게 담당 기수 배정을 요청합니다.',
  '배정 전에는 대시보드 대신 이 안내 화면을 표시합니다.',
  '검색, 검토, 과제 생성 액션은 비활성화합니다.',
]

export function NoCohortNotice() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-24">
      <h1 className="text-fg text-3xl font-bold">
        아직 담당된 기수가 없습니다
      </h1>
      <p className="text-fg-muted mt-4 text-[15px]">
        운영 매니저가 담당 기수를 배정하면 강사 대시보드와 수강생/검토 메뉴를
        사용할 수 있습니다.
      </p>
      <div className="border-border bg-surface mt-10 rounded-xl border p-6">
        <p className="text-fg text-base font-bold">다음 단계</p>
        <ul className="mt-4 flex flex-col gap-3">
          {NEXT_STEPS.map((step) => (
            <li key={step} className="text-fg-muted text-sm">
              - {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// 단독 라우트 진입용 페이지 (직접 URL·가드 redirect 대상)
export default function NoCohortPage() {
  return <NoCohortNotice />
}
