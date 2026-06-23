// 트러블슈팅 상태 전이(데모 상태머신) — 백엔드 없이 react-query 캐시로
// draft(작성 중) → reviewing(검토 중·강사 승인 대기) → certified(인증 완료) 흐름을 시뮬레이션한다.
//
// 역할 분리(프로젝트/증명서 흐름과 동일한 규약):
//   - 학생 액션: '사례 저장' = 검토 요청(draft/신규 → reviewing). NewCasePage·CaseDetailPage가 호출.
//   - 강사 액션: 인증 승인(reviewing → certified)은 BE/강사 화면 연동 전까지
//     TsFlowTestNav(테스트 FAB)로 시뮬레이션한다.
//
// 어느 화면에서 전이시켜도 목록 카드(표시값)와 상세(상태·타임라인)가 항상 일치하도록
// 두 캐시를 함께 갱신한다. BE 연동 시 이 모듈과 TsFlowTestNav는 제거 가능.
import type { QueryClient } from '@tanstack/react-query'
import { buildCaseDetail, buildTimeline } from './detail'
import { tsKeys } from './queryKeys'
import type { TsCase, TsCaseDetail, TsListData, TsStatus, Tone } from './types'

// 상태별 목록 카드 표시값 — statusLabel(배지) · actionLabel(버튼) · accentTone(좌측 바).
export const TS_STATUS_META: Record<
  TsStatus,
  { statusLabel: string; actionLabel: string; accentTone: Tone }
> = {
  draft: {
    statusLabel: '작성 중',
    actionLabel: '이어 작성',
    accentTone: 'accent',
  },
  reviewing: {
    statusLabel: '검토 중',
    actionLabel: '사례 열기',
    accentTone: 'warning',
  },
  certified: {
    statusLabel: '인증 완료',
    actionLabel: '사례 열기',
    accentTone: 'success',
  },
}

// 목록 카드 + 상세 캐시를 한 번에 전이시킨다(목록·상세 동기화).
export function applyTsStatus(qc: QueryClient, id: string, status: TsStatus) {
  const meta = TS_STATUS_META[status]
  qc.setQueryData<TsListData>(tsKeys.list(), (old) =>
    old
      ? {
          ...old,
          cases: old.cases.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status,
                  statusLabel: meta.statusLabel,
                  actionLabel: meta.actionLabel,
                  accentTone: meta.accentTone,
                }
              : c,
          ),
        }
      : old,
  )
  qc.setQueryData<TsCaseDetail>(tsKeys.case(id), (old) =>
    old
      ? {
          ...old,
          status,
          statusLabel: meta.statusLabel,
          timeline: buildTimeline(status),
        }
      : old,
  )
}

// 사례 내용 부분 갱신 — 변경 제안 승인(강사 인증) 시 본문(해결/결과 등)·수정 시각을 실제로 반영한다.
// 목록 카드와 상세 캐시를 함께 갱신해 메인 홈으로 돌아갔을 때 변경이 바로 보인다.
export function patchTsCase(
  qc: QueryClient,
  id: string,
  patch: Partial<TsCase>,
) {
  let updated: TsCase | undefined
  qc.setQueryData<TsListData>(tsKeys.list(), (old) => {
    if (!old) return old
    return {
      ...old,
      cases: old.cases.map((c) => {
        if (c.id !== id) return c
        updated = { ...c, ...patch }
        return updated
      }),
    }
  })
  if (updated) qc.setQueryData(tsKeys.case(id), buildCaseDetail(updated))
}
