import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  return (
    <AuthLayout>
      <form
        onSubmit={(event) => event.preventDefault()}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '13px', color: '#555' }}>아이디</span>
          <input type="text" disabled placeholder="다음 PR에서 활성화" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '13px', color: '#555' }}>비밀번호</span>
          <input type="password" disabled placeholder="다음 PR에서 활성화" />
        </label>
        <button type="submit" disabled style={{ padding: '8px 16px' }}>
          로그인 (준비 중)
        </button>
      </form>
    </AuthLayout>
  )
}
