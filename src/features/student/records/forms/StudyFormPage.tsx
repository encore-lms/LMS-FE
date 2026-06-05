import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Crumbs,
  FieldLabel,
  FormatRow,
  FormBar,
  TextArea,
  TextInput,
} from '../components/FormParts'

// 스터디 등록 폼 (/student/records/new/study) — Figma 274:27. 정적 폼(프리필 예시).
const FILES = [
  { name: '스터디 보드.jpg', size: '2.1MB' },
  { name: '참여자 인증.jpg', size: '1.9MB' },
  { name: '스크린샷 2026-05-14 오전 8.13.05.png', size: '0.2MB' },
]

export default function StudyFormPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [body, setBody] = useState('')

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-[22px] font-bold">스터디 등록</h1>
        <p className="text-fg-muted text-[12px]">
          진행한 스터디 활동을 시간·활동 내역·인증 사진으로 기록
        </p>
      </div>

      <Crumbs items={['기록실', '스터디', '새 등록']} />

      <div className="flex flex-col gap-2">
        <FieldLabel required>제목</FieldLabel>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) SKN22기 코테 스터디 1회차"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel required>시작 시간</FieldLabel>
          <div className="relative">
            <span className="text-fg-subtle pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[14px]">
              📅
            </span>
            <TextInput
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="2026-05-14 19:00"
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel required>종료 시간</FieldLabel>
          <div className="relative">
            <span className="text-fg-subtle pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[14px]">
              🕒
            </span>
            <TextInput
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="2026-05-14 21:30"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel
          required
          hint="주요 진행 내용·다음 스터디 준비 사항을 함께 작성"
        >
          스터디 활동 내역
        </FieldLabel>
        <TextArea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="예) DP 문제 4개를 함께 풀이하며 접근 방식을 비교했습니다.&#10;오늘 정리한 내용, 어려웠던 점, 다음 스터디 전까지 각자 준비할 일을 적어 주세요."
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel required hint="첨부 최대 30MB">
          증빙자료
        </FieldLabel>
        <FormatRow />
        <div className="border-brand/50 bg-brand/5 mt-1 flex flex-col gap-4 rounded-2xl border border-dashed p-6">
          <div className="flex flex-col items-center gap-2 py-2">
            <span className="border-brand text-brand flex size-11 items-center justify-center rounded-full border text-[18px]">
              ⬆
            </span>
            <span className="text-fg text-[14px] font-bold">
              사진을 드래그하거나 클릭해 업로드
            </span>
            <span className="text-fg-subtle text-[12px]">
              한 번에 3개 파일·1회 5장 이내 권장
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-brand font-semibold">● 업로드 중</span>
              <span className="text-fg-subtle">총 8.5MB / 90MB</span>
            </div>
            <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
              <div className="bg-brand h-full w-3/4 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FILES.map((f) => (
              <div
                key={f.name}
                className="border-border bg-surface flex flex-col gap-2 rounded-[12px] border p-2.5"
              >
                <div className="bg-surface-muted flex aspect-square items-center justify-center rounded-lg text-[20px]">
                  🖼
                </div>
                <span className="text-fg truncate text-[11px] font-semibold">
                  {f.name}
                </span>
                <span className="text-fg-subtle text-[10px]">{f.size}</span>
              </div>
            ))}
            <button
              type="button"
              className="border-border text-fg-subtle hover:border-brand/50 flex aspect-square flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed text-[12px]"
            >
              <span className="text-[18px]">＋</span>
              파일 추가하기
            </button>
          </div>
        </div>
      </div>

      <FormBar
        backLabel="이전·취소"
        onBack={() => navigate('/student/records')}
        submitLabel="제출"
        onSubmit={() => navigate('/student/records')}
        footer="제출 후 검토된 스터디 활동 내역과 증빙 사진은 기록실에 표시됩니다."
      />
    </div>
  )
}
