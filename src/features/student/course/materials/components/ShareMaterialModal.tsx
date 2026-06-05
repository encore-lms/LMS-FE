import { useState } from 'react'
import { cn } from '@/shared/lib/cn'

// 자료 공유 모달 — 학생 공유 자료 등록. 파일 업로드/링크 공유 탭 + 메타 입력 + 공유하기.
export function ShareMaterialModal({
  open,
  onClose,
  onShared,
}: {
  open: boolean
  onClose: () => void
  onShared: () => void
}) {
  const [tab, setTab] = useState<'file' | 'link'>('file')
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-surface flex max-h-[90vh] w-[560px] max-w-full flex-col gap-4 overflow-y-auto rounded-2xl p-6 shadow-[0px_20px_48px_0px_rgba(18,23,38,0.24)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-fg text-[20px] font-bold">자료 공유</h2>
            <p className="text-fg-muted text-[13px]">
              학습 정리 자료나 참고 링크를 같은 기수 수강생에게 공유합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="border-border text-fg-muted flex size-8 shrink-0 items-center justify-center rounded-lg border"
          >
            ✕
          </button>
        </div>

        {/* 안내 배너 */}
        <div className="bg-info-bg flex gap-2 rounded-[10px] p-3.5">
          <span className="text-info shrink-0 text-[13px] font-bold">ⓘ</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-info text-[13px] font-semibold">
              학생 공유 자료
            </span>
            <span className="text-fg-muted text-[12px] leading-[18px]">
              학생 공유 자료로 표시됩니다. 공식 강의 자료와 구분되며, 본인이
              올린 자료만 수정·삭제할 수 있습니다.
            </span>
          </div>
        </div>

        {/* 탭 + 학생 공유 배지 */}
        <div className="flex items-center justify-between">
          <div className="bg-surface-muted flex gap-1 rounded-[10px] p-1">
            {(['file', 'link'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-lg px-4 py-2 text-[13px] font-semibold',
                  tab === t ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted',
                )}
              >
                {t === 'file' ? '파일 업로드' : '링크 공유'}
              </button>
            ))}
          </div>
          <span className="border-brand text-brand rounded-full border px-3 py-1 text-[12px] font-semibold">
            학생 공유
          </span>
        </div>

        {/* 제목 */}
        <Field label="제목">
          <input
            placeholder="예) JPA N+1 문제 정리 노트"
            className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
          />
        </Field>

        {/* 주차/과목 + 카테고리 */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="관련 주차/과목">
            <input
              defaultValue="9주차 · Spring Boot"
              className="border-border text-fg focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
            />
          </Field>
          <Field label="카테고리">
            <input
              defaultValue="학생 공유"
              className="border-border text-fg focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
            />
          </Field>
        </div>

        {/* 설명 */}
        <Field label="설명">
          <textarea
            rows={3}
            placeholder="자료를 보는 사람이 알면 좋은 맥락을 짧게 적어 주세요."
            className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-[88px] w-full rounded-[10px] border p-3.5 text-[13px] outline-none"
          />
        </Field>

        {/* 파일 / 링크 */}
        {tab === 'file' ? (
          <Field label="첨부 파일">
            <div className="border-border bg-surface-muted/40 flex flex-col items-center gap-1 rounded-[10px] border border-dashed p-5 text-center">
              <span className="text-fg-subtle text-lg">↑</span>
              <span className="text-fg text-[13px] font-medium">
                파일을 드래그하거나 클릭하여 업로드
              </span>
              <span className="text-fg-subtle text-[11px]">
                PDF, DOC, PPT, ZIP, 이미지, TXT/LOG/MD · 파일당 20MB
              </span>
            </div>
            <div className="border-border bg-surface mt-2 flex items-center gap-3 rounded-[10px] border p-3">
              <span className="bg-danger-bg text-danger rounded px-1.5 py-0.5 text-[10px] font-bold">
                PDF
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-fg text-[13px] font-medium">
                  jpa-n-plus-one-note.pdf
                </span>
                <span className="text-fg-subtle text-[11px]">
                  1.1 MB · 업로드 준비 완료
                </span>
              </div>
              <button
                type="button"
                className="text-danger text-[12px] font-semibold"
              >
                삭제
              </button>
            </div>
          </Field>
        ) : (
          <Field label="공유 링크">
            <input
              placeholder="https://github.com/... 또는 블로그 URL"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-11 w-full rounded-[10px] border px-3.5 text-[13px] outline-none"
            />
          </Field>
        )}

        {/* 푸터 */}
        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onShared}
            className="bg-brand h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white"
          >
            공유하기
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-fg text-[13px] font-semibold">{label}</label>
      {children}
    </div>
  )
}
