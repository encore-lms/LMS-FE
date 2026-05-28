import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  return (
    <AuthLayout>
      <form
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">아이디</span>
          <input
            type="text"
            disabled
            placeholder="다음 PR에서 활성화"
            className="rounded border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">비밀번호</span>
          <input
            type="password"
            disabled
            placeholder="다음 PR에서 활성화"
            className="rounded border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          />
        </label>
        <button
          type="submit"
          disabled
          className="rounded border border-gray-300 px-4 py-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        >
          로그인 (준비 중)
        </button>
      </form>
    </AuthLayout>
  )
}
