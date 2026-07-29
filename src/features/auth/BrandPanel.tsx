import type { ReactNode } from 'react'

interface BrandPanelProps {
  /** 소개 문구 자리에 끼워 넣을 노드. 주어지면 기본 문구 대신 렌더(완전 교체). */
  slot?: ReactNode
}

export function BrandPanel({ slot }: BrandPanelProps) {
  return (
    <aside
      className="flex w-[720px] flex-col justify-center overflow-clip p-16"
      style={{
        backgroundImage:
          'linear-gradient(104.63deg, rgba(92, 79, 217, 0.7) 10.317%, rgba(41, 181, 176, 0.35) 89.683%), linear-gradient(90deg, var(--color-brand-deep) 0%, var(--color-brand-deep) 100%)',
      }}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-[10px]">
          <div className="text-brand flex h-11 w-11 items-center justify-center rounded-[11px] bg-white text-2xl font-bold">
            P
          </div>
          <div className="text-2xl font-bold tracking-[1.92px] text-white">
            <p className="leading-normal">PLAYDATA</p>
            <p className="leading-normal">LMS</p>
          </div>
        </div>

        <div />

        <p className="text-[42px] leading-[54px] font-bold text-white">
          실력은 결과가 아니라
          <br />
          과정에서 증명됩니다
        </p>

        <div className="h-4" />

        <p className="text-sm leading-[22px] font-normal text-white/75">
          PLAYDATA AI 캠프 · 데이터 분석 · 데이터 엔지니어링 과정 통합 학습 운영
          플랫폼
        </p>

        <div className="h-[60px]" />

        {slot ?? (
          <ul className="flex flex-col gap-[10px]">
            {[
              'HRD-Net 연동 정식 훈련 과정',
              '증명서 외부 검증 · snapshotHash 기반 무결성',
              '역할별(매니저·강사·멘토·수강생) 분리된 콘솔',
            ].map((item) => (
              <li key={item} className="flex items-center gap-[10px]">
                <span className="h-[6px] w-[6px] rounded-full bg-white" />
                <span className="text-[13px] font-medium text-white/85">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div />

        <div className="flex items-center gap-[14px] text-[11px] font-medium">
          <span className="text-white/50">© 2026 PLAYDATA</span>
          <span className="text-white/30">·</span>
          <span className="text-white/50">v2.6.0</span>
        </div>
      </div>
    </aside>
  )
}
