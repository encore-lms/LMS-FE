import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Empty } from '@/components/ui/Empty'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'

const TOKEN_NAMES = [
  'brand',
  'brand-deep',
  'fg',
  'fg-muted',
  'fg-subtle',
  'border',
  'divider',
  'surface-muted',
  'danger',
  'danger-bg',
  'warning',
  'warning-bg',
  'accent',
  'accent-bg',
  'accent-strong',
  'success',
  'success-bg',
  'info',
  'info-bg',
  'surface',
] as const

interface ColorToken {
  name: string
  value: string
}

function useColorTokens(): ColorToken[] {
  const [tokens, setTokens] = useState<ColorToken[]>([])

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    setTokens(
      TOKEN_NAMES.map((name) => ({
        name,
        value: styles.getPropertyValue(`--color-${name}`).trim() || '(미정)',
      })),
    )
  }, [])

  return tokens
}

export function StyleGuidePage() {
  const [checked, setChecked] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const toast = useToast()
  const colorTokens = useColorTokens()

  return (
    <main className="mx-auto max-w-5xl p-12">
      <header className="border-divider mb-12 border-b pb-6">
        <h1 className="text-fg text-3xl font-bold">LMS-FE 스타일 가이드</h1>
        <p className="text-fg-muted mt-2">
          현재 정의된 디자인 토큰 + 공통 UI 컴포넌트 카탈로그.{' '}
          <strong>SSOT: src/index.css의 @theme</strong> — 토큰 값은 런타임에
          DOM에서 직접 읽어 표시되므로 이 페이지는 항상 최신.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-fg mb-4 text-xl font-bold">색상 토큰</h2>
        <ul className="grid grid-cols-2 gap-3">
          {colorTokens.map(({ name, value }) => (
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
                <span className="text-fg-subtle text-xs">
                  bg-{name} · text-{name} · border-{name}
                </span>
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

      <section className="mb-12">
        <h2 className="text-fg mb-4 text-xl font-bold">
          Modal · Toast · Empty
        </h2>
        <p className="text-fg-muted mb-3 text-sm">
          공용 토스트(Figma 공통 컴포넌트) — 누른 버튼 근처에 뜬다. 앱 전역에서
          이 토스트만 사용한다.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setModalOpen(true)}>모달 열기</Button>
          <Button
            variant="secondary"
            onClick={() => toast.success('작업이 완료되었습니다')}
          >
            성공 토스트
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.danger('작업을 완료하지 못했습니다')}
          >
            오류 토스트
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.warning('확인이 필요합니다')}
          >
            경고 토스트
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.info('조회가 완료되었습니다')}
          >
            정보 토스트
          </Button>
        </div>

        <div className="border-divider mt-6 rounded-xl border">
          <Empty
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 7h18M3 12h18M3 17h10" strokeLinecap="round" />
              </svg>
            }
            title="아직 항목이 없어요"
            description="첫 항목을 추가하면 여기에 표시됩니다."
            action={<Button>새 항목 추가</Button>}
          />
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="모달 예시"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                취소
              </Button>
              <Button
                onClick={() => {
                  setModalOpen(false)
                  toast.success('확인했습니다')
                }}
              >
                확인
              </Button>
            </>
          }
        >
          <p className="text-fg-muted text-sm">
            ESC · 배경 클릭 · 닫기 버튼으로 닫을 수 있고, 열려 있는 동안 본문
            스크롤이 잠깁니다.
          </p>
        </Modal>
      </section>

      <section className="border-divider mt-16 border-t pt-6">
        <h2 className="text-fg mb-2 text-base font-bold">사용 원칙</h2>
        <ul className="text-fg-muted list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>토큰 SSOT</strong>: src/index.css의 @theme. 토큰 변경 시 이
            파일만 편집하면 컴포넌트·StyleGuide가 자동으로 따라감.
          </li>
          <li>색상은 토큰만 사용 (`bg-brand` ✅ / `bg-[#1a8c85]` ❌)</li>
          <li>같은 className 패턴 3회 이상 반복 시 components/ui/로 추상화</li>
          <li>
            일반 CSS는 keyframes/글로벌 reset/3중 의사클래스 같은 보조 영역만
          </li>
          <li>className 순서는 prettier-plugin-tailwindcss가 자동 정렬</li>
          <li>
            Figma Variables는 @theme에서 use_figma로 동기화 (자동, 별도 작업)
          </li>
        </ul>
      </section>
    </main>
  )
}
