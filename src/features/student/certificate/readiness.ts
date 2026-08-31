import { isMenuGroup, type MenuNode } from '@/components/layout'
import type { CertificateAnalysisView } from './analysis'

const CERTIFICATE_PATH = '/student/certificate'

/**
 * 메뉴를 먼저 보여줬다가 본문에서 미완성 데이터를 막으면 수강생은 발급된 증명서로 오해한다.
 * 7개 탭 결과가 완성됐고, 인증본은 동결 Snapshot까지 있을 때만 증명서가 존재한다고 판단한다.
 */
export function isCertificateReady(
  view: CertificateAnalysisView | undefined,
): boolean {
  if (
    view?.dataStatus !== 'READY' ||
    view.analysisStatus !== 'READY' ||
    view.resultSchemaVersion === null ||
    view.tabs === null
  ) {
    return false
  }

  return view.mode !== 'CERTIFIED' || view.snapshot !== null
}

/** 준비되지 않은 증명서는 사이드바의 그룹/단일 항목 어느 위치에서도 노출하지 않는다. */
export function filterCertificateMenu(
  menu: MenuNode[],
  certificateReady: boolean,
): MenuNode[] {
  if (certificateReady) return menu

  const visible = (to: string) => !to.startsWith(CERTIFICATE_PATH)
  return menu
    .map((node) =>
      isMenuGroup(node)
        ? {
            ...node,
            children: node.children.filter((child) => visible(child.to)),
          }
        : node,
    )
    .filter((node) =>
      isMenuGroup(node) ? node.children.length > 0 : visible(node.to),
    )
}
