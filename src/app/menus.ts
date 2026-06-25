import type { Role } from '@/shared/types'
import type { MenuNode } from '@/components/layout'
import { studentMenu } from '@/features/student/menu'
import { instructorMenu } from '@/features/instructor/menu'
import { mentorMenu } from '@/features/mentor/menu'
import { adminMenu } from '@/features/admin/menu'

// 역할 → 사이드바 메뉴 취합. 새 shell 추가 때만 손댄다(메뉴 내용은 각 features/<role>/menu.ts 소유).
// MANAGER·ADMIN은 운영 콘솔(/admin)을 공유한다.
export const MENUS: Record<Role, MenuNode[]> = {
  STUDENT: studentMenu,
  INSTRUCTOR: instructorMenu,
  MENTOR: mentorMenu,
  MANAGER: adminMenu,
  ADMIN: adminMenu,
}
