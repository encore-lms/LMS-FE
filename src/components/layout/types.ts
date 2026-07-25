import type { ReactNode } from 'react'

// 사이드바 메뉴 항목(leaf) 계약 — 각 역할이 features/<role>/menu.ts로 등록한다(공유 사이드바 파일 충돌 방지).
export interface MenuItem {
  label: string
  to: string
  icon?: ReactNode
  /** to 경로 prefix 외에 이 항목을 active로 볼 추가 경로(prefix). 예: 나의 과정 ← /student/quizzes */
  match?: string[]
  /** 과정 기능 토글 키. 설정되면 해당 토글이 OFF인 과정의 수강생에게 메뉴를 숨긴다. */
  featureKey?: string
  /** 준비 중인 기능 — 클릭 시 이동하지 않고 '준비중' 토스트만 띄운다(라우팅 없음). */
  comingSoon?: boolean
}

// 대분류(드롭다운) 그룹 — 항목이 많은 사이드바(운영)를 접이식으로 묶을 때 사용한다.
// children이 모두 leaf(MenuItem)이며, 중첩 그룹은 두지 않는다(1단계 그룹만).
export interface MenuGroup {
  label: string
  children: MenuItem[]
}

// 사이드바 노드 = leaf 항목 또는 그룹. flat 메뉴(학생/강사/멘토)는 MenuItem[]만 쓰면 되고,
// 그룹이 필요한 메뉴(운영)는 MenuNode[]로 leaf와 그룹을 섞는다.
export type MenuNode = MenuItem | MenuGroup

// children 보유 시 그룹으로 판별한다.
export function isMenuGroup(node: MenuNode): node is MenuGroup {
  return 'children' in node
}
