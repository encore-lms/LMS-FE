import { useState } from 'react'
import { Calendar, Users } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { inputClass } from '@/components/ui/inputClass'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
import {
  useAddMeeting,
  useEditMeeting,
  useDeleteMeeting,
  wsWriteError,
} from '../../../api/projects'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { WorkspaceData, WsMeeting, WsMember } from '../../types'
import { Avatar, Chip, SectionHead } from '../components/ws-shared'
import {
  card,
  dateStr,
  formatKoreanDate,
  parseMeetingMeta,
} from '../components/ws-style'

export function MeetingsTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const meetings = d.meetings
  const [adding, setAdding] = useState(false)
  const [openMeeting, setOpenMeeting] = useState<WsMeeting | null>(null)
  const addMeetingM = useAddMeeting(d.id)
  const editMeetingM = useEditMeeting(d.id)
  const deleteMeetingM = useDeleteMeeting(d.id)
  const [editing, setEditing] = useState<WsMeeting | null>(null)
  const [deleting, setDeleting] = useState<WsMeeting | null>(null)
  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="회의록"
        action="회의록 작성"
        onAction={() => setAdding(true)}
      />
      {meetings.length === 0 ? (
        <Empty
          title="아직 작성된 회의록이 없어요"
          description="‘회의록 작성’으로 첫 회의록을 남겨보세요."
        />
      ) : (
        <section className={cn(card, 'flex flex-col')}>
          {meetings.map((m, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-4 py-3.5',
                i > 0 && 'border-divider border-t',
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-fg text-[14px] font-bold [overflow-wrap:anywhere]">
                  {m.title}
                </span>
                <span className="text-fg-subtle text-[11px]">{m.meta}</span>
              </div>
              {/* 요약은 길이 제한이 없어 제목·액션을 밀어낸다 — 남는 폭 안에서 말줄임 */}
              <span
                className="text-fg-muted hidden min-w-0 truncate text-[12px] sm:block"
                title={m.summary}
              >
                {m.summary}
              </span>
              <Chip badge={m.status} />
              <button
                type="button"
                onClick={() => setOpenMeeting(m)}
                className="border-border text-fg-muted shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
              >
                열기
              </button>
            </div>
          ))}
        </section>
      )}
      {openMeeting && (
        <MeetingDetailModal
          meeting={openMeeting}
          members={d.members}
          onClose={() => setOpenMeeting(null)}
          onEdit={
            openMeeting.id
              ? () => {
                  setEditing(openMeeting)
                  setOpenMeeting(null)
                }
              : undefined
          }
          onDelete={
            openMeeting.id
              ? () => {
                  setDeleting(openMeeting)
                  setOpenMeeting(null)
                }
              : undefined
          }
        />
      )}
      {editing && (
        <AddMeetingModal
          editing={editing}
          onClose={() => setEditing(null)}
          onAdd={(meeting, body, heldAt) => {
            editMeetingM.mutate(
              { meetingId: editing.id!, title: meeting.title, body, heldAt },
              {
                onSuccess: () => {
                  toast.success('회의록을 수정했습니다')
                  setEditing(null)
                },
                onError: (e) =>
                  toast.danger(wsWriteError(e, '회의록 수정에 실패했어요.')),
              },
            )
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        title="회의록 삭제"
        confirmLabel="삭제"
        tone="danger"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting?.id) return
          deleteMeetingM.mutate(
            { meetingId: deleting.id },
            {
              onSuccess: () => {
                toast.success('회의록을 삭제했습니다')
                setDeleting(null)
              },
              onError: (e) =>
                toast.danger(wsWriteError(e, '회의록 삭제에 실패했어요.')),
            },
          )
        }}
      >
        <p className="text-fg-muted text-[13px]">
          '{deleting?.title ?? ''}' 회의록을 삭제할까요? 되돌릴 수 없어요.
        </p>
      </ConfirmDialog>
      {adding && (
        <AddMeetingModal
          onClose={() => setAdding(false)}
          onAdd={(meeting, body, heldAt) => {
            addMeetingM.mutate(
              { title: meeting.title, body, heldAt },
              {
                onSuccess: () => {
                  toast.success('회의록을 추가했습니다')
                  setAdding(false)
                },
                onError: (e) =>
                  toast.danger(wsWriteError(e, '회의록 추가에 실패했어요.')),
              },
            )
          }}
        />
      )}
    </div>
  )
}

function AddMeetingModal({
  editing,
  onClose,
  onAdd,
}: {
  /** 주면 수정 모드 — 기존 값으로 채워 시작한다. */
  editing?: WsMeeting
  onClose: () => void
  onAdd: (meeting: WsMeeting, body: string, heldAt: string) => void
}) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const now = new Date()
  const [date, setDate] = useState(
    parseMeetingMeta(editing?.meta ?? '').date ??
      dateStr(now.getFullYear(), now.getMonth(), now.getDate()),
  )
  const [summary, setSummary] = useState(editing?.summary ?? '')
  const field = inputClass()
  const submit = () => {
    if (!title.trim() || !summary.trim()) return
    onAdd(
      {
        title: title.trim(),
        meta: `${date} · 참석 4명`,
        summary: summary.trim(),
        status: { label: '진행', tone: 'warning' },
      },
      summary.trim(),
      date,
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? '회의록 수정' : '회의록 작성'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim() || !summary.trim()}
            className={buttonClass({ size: 'sm' })}
          >
            저장
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">제목</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="회의 제목"
            className={field}
          />
        </label>
        <div className="bg-brand/5 border-brand/20 flex items-center gap-2 rounded-xl border px-4 py-3">
          <Calendar className="text-brand size-4 shrink-0" />
          <span className="text-fg text-[15px] font-bold">
            {formatKoreanDate(date)}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">일자 변경</span>
          <DateTimePicker
            mode="date"
            value={date}
            onChange={setDate}
            ariaLabel="회의 일자"
            placeholder="날짜 선택"
          />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">요약</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="결정 사항 또는 액션 아이템"
            className={cn(field, 'min-h-24 resize-none py-2 leading-5')}
          />
        </label>
      </div>
    </Modal>
  )
}

// 회의 상세 — 날짜·요약·참석자(팀원에서 참석 인원만큼 파생).
function MeetingDetailModal({
  meeting,
  members,
  onClose,
  onEdit,
  onDelete,
}: {
  meeting: WsMeeting
  members: WsMember[]
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const { date, attendees } = parseMeetingMeta(meeting.meta)
  const attendList = attendees != null ? members.slice(0, attendees) : members
  const extra =
    attendees != null && attendees > attendList.length
      ? attendees - attendList.length
      : 0
  return (
    <Modal
      open
      onClose={onClose}
      title="회의록 상세"
      footer={
        <>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-danger hover:bg-danger-bg mr-auto rounded-lg px-3 py-1.5 text-[13px] font-semibold"
            >
              삭제
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            닫기
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className={buttonClass({ size: 'sm' })}
            >
              수정
            </button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-fg text-[16px] font-bold">
              {meeting.title}
            </span>
            <span className="text-fg-muted flex items-center gap-1.5 text-[12px]">
              <Calendar className="size-3.5" aria-hidden="true" />
              {date}
            </span>
          </div>
          <Chip badge={meeting.status} />
        </div>

        <div className="bg-surface-muted flex flex-col gap-1 rounded-xl p-4">
          <span className="text-fg-subtle text-[11px] font-semibold">
            핵심 요약
          </span>
          {/* 상세는 원문을 통째로 — 목록용으로 자른 값(summary)을 쓰면 "…" 로 끝나 끝까지
              읽을 수 없다. 줄바꿈도 쓴 대로 살린다. */}
          <span className="text-fg text-[13px] leading-6 font-medium whitespace-pre-wrap">
            {meeting.body ?? meeting.summary}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-fg flex items-center gap-1.5 text-[13px] font-bold">
            <Users className="text-brand size-4" aria-hidden="true" />
            참석자
            {attendees != null && (
              <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[11px] font-bold">
                {attendees}명
              </span>
            )}
          </span>
          <div className="flex flex-col gap-2">
            {attendList.map((m) => (
              <div key={m.name} className="flex items-center gap-2.5">
                <Avatar name={m.name} tone={m.avatarTone} />
                <div className="flex flex-col">
                  <span className="text-fg text-[12px] font-bold">
                    {m.name}
                    {m.kind === 'PM' && ' · PM'}
                  </span>
                  <span className="text-fg-subtle text-[11px]">{m.role}</span>
                </div>
              </div>
            ))}
            {extra > 0 && (
              <span className="text-fg-subtle text-[11px]">외 {extra}명</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
