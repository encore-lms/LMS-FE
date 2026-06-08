import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PATHS } from '@/shared/constants/routes'
import { DEMO_ACCOUNTS, type DemoAccount } from './demoAccounts'

interface DemoQuickLoginProps {
  /** 역할 버튼 클릭 시 해당 데모 계정으로 폼을 채운다(제출은 하지 않음). */
  onPick: (account: DemoAccount) => void
}

// BrandPanel(어두운 그라데이션 배경)에 들어가는 데모 빠른 로그인 그룹.
// 소개 문구 3줄을 대체하며, 버튼은 ID/PW만 채우고 스타일 가이드 이동 링크를 함께 제공한다.
export function DemoQuickLogin({ onPick }: DemoQuickLoginProps) {
  return (
    <div className="flex flex-col gap-[14px]">
      <span className="text-[13px] font-medium text-white/85">
        데모 빠른 로그인 · 비밀번호 자동 입력
      </span>

      <div className="flex flex-wrap gap-2">
        {DEMO_ACCOUNTS.map((acc) => (
          <button
            key={acc.email}
            type="button"
            onClick={() => onPick(acc)}
            className="rounded-[10px] border border-white/25 bg-white/5 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/15"
          >
            {acc.label}
          </button>
        ))}
      </div>

      <div className="mt-1 h-px w-full bg-white/15" />

      <Link
        to={PATHS.styleguide}
        className="flex items-center gap-1 text-[13px] font-medium text-white/85 transition-colors hover:text-white"
      >
        스타일 가이드로 이동
        <ArrowRight className="h-[14px] w-[14px]" />
      </Link>
    </div>
  )
}
