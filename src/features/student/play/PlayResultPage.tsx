import { useNavigate } from 'react-router-dom'

// PLAY 결과·예외 상태 (/student/play/result) — Figma 3370:5976.
// 서버 계산 결과 / 저장 실패 / Empty / 기능 미사용 4개 상태 카탈로그.
const card =
  'border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

export default function PlayResultPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-[22px] font-bold">PLAY 결과·예외 상태</h1>
        <p className="text-fg-muted text-[12px]">
          타자 게임 제출 이후 서버 계산 결과와 저장 실패, 제시문 없음, 기능
          미사용 상태를 한 화면에서 확인합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 결과 화면 */}
        <section className={card}>
          <span className="bg-brand/10 text-brand w-fit rounded-full px-2.5 py-1 text-[11px] font-bold">
            결과 화면
          </span>
          <span className="text-fg text-[16px] font-bold">서버 계산 결과</span>
          <span className="text-fg-muted text-[12px] leading-5">
            클라이언트 진행 중 예상값이 아니라 서버가 세션 원본을 재계산한 최종
            결과입니다.
          </span>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'WPM', value: '92' },
              { label: 'CPM', value: '612' },
              { label: '정확도', value: '97.2%' },
              { label: 'Score', value: '92,400' },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-surface-muted/50 flex flex-col gap-1 rounded-[10px] p-3"
              >
                <span className="text-fg-subtle text-[11px]">{m.label}</span>
                <span className="text-brand text-[18px] font-bold">
                  {m.value}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/student/play/typing')}
              className="bg-brand rounded-lg px-4 py-2 text-[12px] font-bold text-white"
            >
              다시 플레이
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/play')}
              className="border-border text-fg rounded-lg border px-4 py-2 text-[12px] font-semibold"
            >
              PLAY로 돌아가기
            </button>
            <span className="text-fg-subtle text-[10px]">
              랭킹·보상 예정은 결과 저장 이후 비교로 반영됩니다.
            </span>
          </div>
        </section>

        {/* 저장 실패 */}
        <section className={card}>
          <span className="bg-danger-bg text-danger w-fit rounded-full px-2.5 py-1 text-[11px] font-bold">
            저장 실패
          </span>
          <span className="text-fg text-[16px] font-bold">결과 저장 실패</span>
          <span className="text-fg-muted text-[12px] leading-5">
            네트워크 또는 서버 오류로 결과가 저장되지 않았습니다. 동일 세션 ID와
            입력 digest로 재시도합니다.
          </span>
          <div className="bg-warning-bg/60 flex flex-col gap-1 rounded-xl p-3.5">
            <span className="text-warning text-[12px] font-bold">
              입력 내용 보존 중
            </span>
            <span className="text-fg-muted text-[11px]">
              재시도 전까지 사용자가 입력한 내용과 세션 ID를 유지합니다.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="bg-brand rounded-lg px-4 py-2 text-[12px] font-bold text-white"
            >
              결과 저장 재시도
            </button>
            <button
              type="button"
              className="border-border text-fg rounded-lg border px-4 py-2 text-[12px] font-semibold"
            >
              나중에 다시 시도
            </button>
          </div>
        </section>

        {/* Empty */}
        <section className={card}>
          <span className="bg-surface-muted text-fg-subtle w-fit rounded-full px-2.5 py-1 text-[11px] font-bold">
            Empty
          </span>
          <span className="text-fg text-[16px] font-bold">
            사용 가능한 제시문 없음
          </span>
          <span className="text-fg-muted text-[12px] leading-5">
            PLAY는 켜져 있지만 현재 과정에 활성화된 타자 제시문이 없습니다. 게임
            카드는 비활성화하고 운영자 문의 안내를 표시합니다.
          </span>
          <div className="border-border bg-surface-muted/30 flex flex-col gap-1 rounded-xl border border-dashed p-4">
            <span className="text-fg-muted text-[13px] font-semibold">
              타자 게임
            </span>
            <span className="text-fg-subtle text-[11px]">
              제시문 등록 후 이용할 수 있습니다.
            </span>
          </div>
          <button
            type="button"
            className="border-border text-fg w-fit rounded-lg border px-4 py-2 text-[12px] font-semibold"
          >
            운영자에게 문의
          </button>
        </section>

        {/* 기능 미사용 */}
        <section className={card}>
          <span className="bg-surface-muted text-fg-subtle w-fit rounded-full px-2.5 py-1 text-[11px] font-bold">
            기능 미사용
          </span>
          <span className="text-fg text-[16px] font-bold">
            PLAY 기능 미사용 과정
          </span>
          <span className="text-fg-muted text-[12px] leading-5">
            과정 설정에서 PLAY가 꺼져 있으면 사이드바 메뉴를 숨기고, 직접 URL
            접근 시 기능 미사용 안내를 표시합니다.
          </span>
          <div className="bg-surface-muted/50 flex flex-col gap-1 rounded-xl p-3.5">
            <span className="text-fg-muted text-[11px] font-bold">
              노출 조건
            </span>
            <span className="text-fg-subtle font-mono text-[11px]">
              CourseFeatureConfig.playEnabled = true 인 과정에서만 노출
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="bg-brand w-fit rounded-lg px-4 py-2 text-[12px] font-bold text-white"
          >
            대시보드로 돌아가기
          </button>
        </section>
      </div>

      <div className="bg-surface-muted/40 text-fg-subtle rounded-xl px-4 py-3 text-[11px]">
        학생 PLAY 화면은 게임 선택·세션 진행·결과 확인만 담당합니다. 제시문
        CRUD, 일괄 업로드, 게임 활성/비활성 처리는 운영 PLAY 관리 화면에서
        처리합니다.
      </div>
    </div>
  )
}
