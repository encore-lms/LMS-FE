import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import {
  Crumbs,
  FieldLabel,
  FormatRow,
  FormBar,
  TextInput,
} from '../components/FormParts'

// 자격증 등록 폼 (/student/records/new/certificate) — Figma 273:27. 정적 폼(프리필 예시).
const TYPES = [
  { key: 'PCCE', name: 'PCCE', sub: 'Python 기초' },
  { key: 'PCCP', name: 'PCCP', sub: 'Python 중급' },
  { key: 'PCSQL', name: 'PCSQL', sub: 'SQL 개발자' },
]

export default function CertFormPage() {
  const navigate = useNavigate()
  const [type, setType] = useState('PCCP')
  const [title, setTitle] = useState('PCCP Lv.2 합격')

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-[22px] font-bold">자격증 등록</h1>
        <p className="text-fg-muted text-[12px]">
          인증 가능한 자격증(PCCE/PCCP/PCSQL) 취득 사진을 등록
        </p>
      </div>

      <Crumbs items={['기록실', '자격증', '새 등록']} />

      <div className="flex flex-col gap-2">
        <FieldLabel required hint="최대 인증 가능한 3종">
          자격증 종류
        </FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TYPES.map((t) => {
            const on = t.key === type
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-2xl border p-5 text-center transition-colors',
                  on
                    ? 'border-brand bg-brand text-white'
                    : 'border-border bg-surface text-fg hover:border-brand/50',
                )}
              >
                {on && (
                  <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-white/25 text-[11px]">
                    ✓
                  </span>
                )}
                <span className="text-[16px] font-bold">{t.name}</span>
                <span
                  className={cn(
                    'text-[12px]',
                    on ? 'text-white/80' : 'text-fg-muted',
                  )}
                >
                  {t.sub}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel required>제목</FieldLabel>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) PCCP Lv.2 합격"
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel required hint="최대 30MB">
          증빙 파일
        </FieldLabel>
        <FormatRow />
        <div className="border-brand/50 bg-brand/5 mt-1 flex flex-col gap-3 rounded-2xl border border-dashed p-6">
          <div className="border-border bg-surface flex items-start gap-3 rounded-[12px] border p-4">
            <span className="bg-brand/10 text-brand flex size-10 shrink-0 items-center justify-center rounded-lg text-[18px]">
              🎖
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <span className="bg-warning-bg text-warning w-fit rounded px-2 py-0.5 text-[10px] font-bold">
                ● CERTIFICATE
              </span>
              <span className="text-fg text-[14px] font-bold">
                Python Certified Coding Professional
              </span>
              <span className="text-fg-muted text-[12px]">홍 길 동</span>
              <span className="text-fg-subtle text-[11px]">
                Level 2 · Passed · 2026-04-22
              </span>
            </div>
            <button
              type="button"
              aria-label="제거"
              className="text-fg-subtle hover:text-fg text-[16px]"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-success flex items-center gap-1.5 text-[12px] font-semibold">
              ✓ pccp.certificate.png
              <span className="text-fg-subtle font-normal">
                2.4MB — 검증 완료
              </span>
            </span>
            <button
              type="button"
              className="text-fg-muted text-[12px] font-semibold"
            >
              ✕ 파일 폐기
            </button>
          </div>
        </div>
      </div>

      <FormBar
        backLabel="이전·취소"
        onBack={() => navigate('/student/records')}
        note="● 종류·제목·파일 모두 입력됨"
        submitLabel="제출"
        onSubmit={() => navigate('/student/records')}
        footer="제출 후 검토에서 사진과 자격증 종류·취득 일자를 확인합니다. 반려 시 사유와 함께 기록실 자격증에 표시됩니다."
      />
    </div>
  )
}
