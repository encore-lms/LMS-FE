import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'

const colorTokens = [
  { name: 'brand', value: '#1a8c85', utility: 'bg-brand · text-brand' },
  {
    name: 'brand-deep',
    value: '#121726',
    utility: 'bg-brand-deep · text-brand-deep',
  },
  { name: 'fg', value: '#121726', utility: 'text-fg' },
  { name: 'fg-muted', value: '#5c6978', utility: 'text-fg-muted' },
  { name: 'fg-subtle', value: '#9ca3b0', utility: 'text-fg-subtle' },
  { name: 'border', value: '#e8ebed', utility: 'border-border' },
  { name: 'divider', value: '#f0f2f5', utility: 'bg-divider' },
  {
    name: 'surface-muted',
    value: '#f2f5f5',
    utility: 'bg-surface-muted',
  },
  { name: 'danger', value: '#f04545', utility: 'text-danger · border-danger' },
  { name: 'danger-bg', value: '#fce3e3', utility: 'bg-danger-bg' },
  { name: 'warning', value: '#b27300', utility: 'text-warning' },
  { name: 'warning-bg', value: '#fff2c7', utility: 'bg-warning-bg' },
]

export function StyleGuidePage() {
  const [checked, setChecked] = useState(false)

  return (
    <main className="mx-auto max-w-5xl p-12">
      <header className="border-divider mb-12 border-b pb-6">
        <h1 className="text-fg text-3xl font-bold">LMS-FE 스타일 가이드</h1>
        <p className="text-fg-muted mt-2">
          현재 정의된 디자인 토큰 + 공통 UI 컴포넌트 카탈로그. 새 화면 작업 전
          이 페이지에서 토큰/컴포넌트를 먼저 확인하세요. (dev-only,
          /_styleguide)
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-fg mb-4 text-xl font-bold">색상 토큰</h2>
        <ul className="grid grid-cols-2 gap-3">
          {colorTokens.map(({ name, value, utility }) => (
            <li
              key={name}
              className="border-divider flex items-center gap-3 rounded border p-3"
            >
              <div
                className="border-divider h-12 w-12 shrink-0 rounded border"
                style={{ backgroundColor: value }}
              />
              <div className="flex flex-col text-sm">
                <code className="text-fg font-bold">--color-{name}</code>
                <span className="text-fg-muted">{value}</span>
                <span className="text-fg-subtle text-xs">{utility}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-fg mb-4 text-xl font-bold">타이포그래피</h2>
        <p className="text-fg-muted mb-4 text-sm">
          기본 폰트: Pretendard Variable (한글 fallback 포함). text-* utility로
          크기 지정.
        </p>
        <ul className="flex flex-col gap-2">
          <li className="flex items-baseline gap-3">
            <span className="text-fg text-[42px] font-bold">
              42px 메인 카피
            </span>
            <code className="text-fg-subtle text-xs">
              text-[42px] font-bold
            </code>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="text-fg text-3xl font-bold">30px 페이지 제목</span>
            <code className="text-fg-subtle text-xs">text-3xl font-bold</code>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="text-fg text-xl font-bold">20px 섹션 제목</span>
            <code className="text-fg-subtle text-xs">text-xl font-bold</code>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="text-fg text-base">16px 본문</span>
            <code className="text-fg-subtle text-xs">text-base</code>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="text-fg-muted text-sm">14px 보조 텍스트</span>
            <code className="text-fg-subtle text-xs">
              text-sm text-fg-muted
            </code>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="text-fg-subtle text-xs">12px 캡션</span>
            <code className="text-fg-subtle text-xs">
              text-xs text-fg-subtle
            </code>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-fg mb-4 text-xl font-bold">Button</h2>
        <div className="mb-3 flex gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button disabled>Disabled</Button>
        </div>
        <pre className="bg-surface-muted text-fg-muted overflow-x-auto rounded p-3 text-xs">
          {`<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button disabled>Disabled</Button>`}
        </pre>
      </section>

      <section className="mb-12">
        <h2 className="text-fg mb-4 text-xl font-bold">Input</h2>
        <div className="flex max-w-md flex-col gap-4">
          <Input label="기본" placeholder="placeholder" />
          <Input label="필수" required placeholder="required *" />
          <Input
            label="액션 포함"
            required
            placeholder="비밀번호"
            labelAction={
              <a href="#" className="text-brand text-xs font-medium">
                비밀번호 찾기 →
              </a>
            }
          />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-fg mb-4 text-xl font-bold">Checkbox</h2>
        <Checkbox
          checked={checked}
          onChange={setChecked}
          label="체크박스 예시 (토글)"
        />
      </section>

      <section className="border-divider mt-16 border-t pt-6">
        <h2 className="text-fg mb-2 text-base font-bold">사용 원칙</h2>
        <ul className="text-fg-muted list-disc space-y-1 pl-5 text-sm">
          <li>색상은 토큰만 사용 (`bg-brand` ✅ / `bg-[#1a8c85]` ❌)</li>
          <li>같은 className 패턴 3회 이상 반복 시 components/ui/로 추상화</li>
          <li>
            일반 CSS는 keyframes/글로벌 reset/3중 의사클래스 같은 보조 영역만
          </li>
          <li>className 순서는 prettier-plugin-tailwindcss가 자동 정렬</li>
        </ul>
      </section>
    </main>
  )
}
