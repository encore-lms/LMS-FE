import { z } from 'zod'
import type { CertificateAiAnalysis } from './types'

export const CERTIFICATE_SEVEN_TAB_SCHEMA_VERSION =
  '2026.08.26-certificate-seven-tab-result-v1' as const

const strictObject = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).strict()

const evidenceSchema = strictObject({
  code: z.string().min(1),
  source: z.string().min(1),
  referenceId: z.string().min(1).nullable().optional(),
  capturedAt: z.string().datetime({ offset: true }).nullable().optional(),
})

const missingRequirementSchema = strictObject({
  code: z.string().min(1),
  source: z.string().min(1),
  detail: z.string().min(1),
})

const readinessSchema = z.enum(['READY', 'PARTIAL', 'NOT_READY'])
const generationModeSchema = z.enum(['SOURCE_COPY', 'DERIVED', 'AI_GENERATED'])

function tabSchema<T extends z.ZodRawShape>(payloadShape: T) {
  return strictObject({
    contractVersion: z.string().min(1),
    readinessStatus: readinessSchema,
    generationMode: generationModeSchema,
    evidence: z.array(evidenceSchema),
    missingRequirements: z.array(missingRequirementSchema),
    // NOT_READY 탭은 LMS-AI 계약상 빈 객체를 내려주므로 필드를 선택값으로 둔다.
    payload: strictObject(payloadShape).partial(),
  }).superRefine((tab, context) => {
    const payloadSize = Object.keys(tab.payload ?? {}).length
    if (tab.readinessStatus === 'READY' && payloadSize === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload'],
        message: 'READY 탭에는 payload가 필요합니다.',
      })
    }
    if (tab.readinessStatus === 'READY' && tab.missingRequirements.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['missingRequirements'],
        message: 'READY 탭에는 결측 조건이 없어야 합니다.',
      })
    }
    if (
      tab.readinessStatus !== 'READY' &&
      tab.missingRequirements.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['missingRequirements'],
        message: '준비되지 않은 탭에는 결측 조건이 필요합니다.',
      })
    }
    if (tab.readinessStatus === 'NOT_READY' && payloadSize > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload'],
        message: 'NOT_READY 탭은 payload를 노출할 수 없습니다.',
      })
    }
  })
}

const cohortSchema = strictObject({
  courseId: z.string().min(1),
  courseTitle: z.string().min(1),
  cohortNo: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  durationDays: z.number().int().positive(),
  hrdLinked: z.boolean(),
})

const attendanceSchema = strictObject({
  totalDays: z.number().int().nonnegative(),
  presentDays: z.number().int().nonnegative(),
  lateDays: z.number().int().nonnegative(),
  earlyLeaveDays: z.number().int().nonnegative(),
  absentDays: z.number().int().nonnegative(),
  leaveMissingDays: z.number().int().nonnegative(),
  attendanceRate: z.number().min(0).max(100),
  firstDate: z.string().nullable(),
  lastDate: z.string().nullable(),
})

const assessmentSchema = strictObject({
  assessmentId: z.string().min(1).nullable().optional(),
  assessmentType: z.enum(['ACHIEVEMENT', 'CS']),
  category: z.string().min(1),
  score: z.number().min(0).max(100),
})

const periodSchema = strictObject({
  startedAt: z.string().min(1),
  endedAt: z.string().min(1),
})

const personalTaskSchema = strictObject({
  taskId: z.string(),
  title: z.string(),
  workCategory: z.string().nullable().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
})

const projectPeerAxisSchema = strictObject({
  key: z.enum(['기술/기술기여', '소통·협업·팀워크', '문제해결', '책임감']),
  score: z.number().min(0).max(5),
})

const cleanProjectSchema = strictObject({
  projectId: z.string().min(1),
  name: z.string().min(1),
  period: periodSchema,
  membershipRole: z.enum(['OWNER', 'MEMBER']),
  domain: z.string().nullable(),
  scope: z.string(),
  teamTechStacks: z.array(z.string()),
  teamOutcomes: z.array(z.string()),
  personalTasks: z.array(personalTaskSchema),
  boardAssignedTaskCount: z.number().int().nonnegative(),
  boardCompletedAssignedTaskCount: z.number().int().nonnegative(),
  selfReviewStatements: z.array(z.string()),
  peerObservations: z.array(z.string()),
  troubleshootingCaseIds: z.array(z.string()),
  peerAxes: z.array(projectPeerAxisSchema),
  limitations: z.array(z.string()),
})

const troubleshootingCaseSchema = strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  situation: z.string().min(1),
  resolution: z.string().min(1),
  result: z.string().min(1),
  days: z.number().nonnegative().nullable(),
  independent: z.boolean(),
  createdAt: z.string().min(1),
  technologies: z.array(z.string()),
})

const troubleshootingAggregateSchema = strictObject({
  cases: z.array(troubleshootingCaseSchema),
  categories: z.array(
    strictObject({
      label: z.string().min(1),
      count: z.number().int().nonnegative(),
    }),
  ),
  averageDays: z.number().nonnegative().nullable(),
  medianDays: z.number().nonnegative().nullable(),
  independentCaseCount: z.number().int().nonnegative(),
  supportedCaseCount: z.number().int().nonnegative(),
  readinessStatus: readinessSchema,
})

const mentorReputationSchema = strictObject({
  teamId: z.string().min(1),
  evaluationId: z.string().nullable(),
  scoreTech: z.number().int().min(1).max(5).nullable(),
  scoreResponsibility: z.number().int().min(1).max(5).nullable(),
  scoreCommunication: z.number().int().min(1).max(5).nullable(),
  scoreProblemSolving: z.number().int().min(1).max(5).nullable(),
  scoreTeamwork: z.number().int().min(1).max(5).nullable(),
  comment: z.string().nullable().optional(),
  evaluationSubmittedAt: z.string().nullable(),
  recommendationId: z.string().nullable(),
  recommendationSummary: z.string().nullable(),
  recommendationSubmittedAt: z.string().nullable(),
})

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
)

const resumeSchema = strictObject({
  resumeId: z.string().min(1),
  title: z.string().min(1),
  status: z.literal('COMPLETED'),
  content: z.record(jsonValueSchema),
  updatedAt: z.string().min(1),
})

export const certificateAiAnalysisSchema = z.custom<CertificateAiAnalysis>(
  (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return false
    const analysis = value as Record<string, unknown>
    return (
      typeof analysis.policyVersion === 'string' &&
      typeof analysis.jobFit === 'object' &&
      typeof analysis.projects === 'object' &&
      typeof analysis.troubleshooting === 'object'
    )
  },
  { message: 'LMS-AI 분석 계약이 올바르지 않습니다.' },
)

export const certificateSevenTabsSchema = strictObject({
  summary: tabSchema({
    cohort: cohortSchema.nullable(),
    attendance: attendanceSchema.nullable(),
    counts: strictObject({
      assessments: z.number().int().nonnegative(),
      certifications: z.number().int().nonnegative(),
      projects: z.number().int().nonnegative(),
      troubleshootingCases: z.number().int().nonnegative(),
    }),
  }),
  tech: tabSchema({
    assessments: z.array(assessmentSchema),
    certifications: z.array(z.string()),
    skillTags: z.array(z.string()),
    projectTechStacks: z.array(
      strictObject({
        projectId: z.string().min(1),
        certificationStatus: z.string().min(1),
        values: z.array(z.string()),
      }),
    ),
  }),
  projects: tabSchema({ projects: z.array(cleanProjectSchema) }),
  problemSolving: tabSchema({
    cases: z.array(troubleshootingCaseSchema),
    aggregate: troubleshootingAggregateSchema,
  }),
  growthReputation: tabSchema({
    mentorReputations: z.array(mentorReputationSchema),
    projectPeerAxes: z.array(projectPeerAxisSchema),
  }),
  resume: tabSchema({ resume: resumeSchema.nullable() }),
  aiAnalysis: tabSchema({ analysis: certificateAiAnalysisSchema }),
})

export const publicCertificateSevenTabsSchema = certificateSevenTabsSchema
  .omit({ growthReputation: true })
  .extend({
    growthReputation:
      certificateSevenTabsSchema.shape.growthReputation.optional(),
  })
  .strict()

export type CertificateSevenTabs = z.infer<typeof certificateSevenTabsSchema>
export type PublicCertificateSevenTabs = z.infer<
  typeof publicCertificateSevenTabsSchema
>
export type CertificateTabResult =
  CertificateSevenTabs[keyof CertificateSevenTabs]

export function parseCertificateSevenTabs(value: unknown) {
  return certificateSevenTabsSchema.parse(value)
}

export function parsePublicCertificateSevenTabs(value: unknown) {
  return publicCertificateSevenTabsSchema.parse(value)
}
