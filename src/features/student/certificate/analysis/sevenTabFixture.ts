import { getAiAnalysis } from '../ai'
import type { CertificateSevenTabs } from './sevenTabContract'

const evidence = (code: string) => [
  { code, source: 'LMS_DE_GOLD', referenceId: `fixture-${code}` },
]

/** 개발·테스트에서만 쓰는 명시적 7개 탭 fixture. 실서비스 실패 대체값으로 사용하지 않는다. */
export function createCertificateSevenTabFixture(): CertificateSevenTabs {
  return {
    summary: {
      contractVersion: '2026.08.26-summary-v1',
      readinessStatus: 'READY',
      generationMode: 'DERIVED',
      evidence: evidence('COHORT_CONTEXT'),
      missingRequirements: [],
      payload: {
        cohort: {
          courseId: 'course-fixture',
          courseTitle: 'PLAYDATA 데이터 분석 과정',
          cohortNo: 'DA 5기',
          startsAt: '2025-12-01',
          endsAt: '2026-05-19',
          durationDays: 170,
          hrdLinked: true,
        },
        attendance: {
          totalDays: 100,
          presentDays: 94,
          lateDays: 2,
          earlyLeaveDays: 1,
          absentDays: 2,
          leaveMissingDays: 1,
          attendanceRate: 94,
          firstDate: '2025-12-01',
          lastDate: '2026-05-19',
        },
        counts: {
          assessments: 2,
          certifications: 1,
          projects: 1,
          troubleshootingCases: 1,
        },
      },
    },
    tech: {
      contractVersion: '2026.08.26-tech-v1',
      readinessStatus: 'READY',
      generationMode: 'DERIVED',
      evidence: evidence('ASSESSMENT:fixture'),
      missingRequirements: [],
      payload: {
        assessments: [
          {
            assessmentId: 'assessment-1',
            assessmentType: 'ACHIEVEMENT',
            category: 'Python·SQL',
            score: 84.7,
          },
        ],
        certifications: ['SQLD'],
        skillTags: ['Python', 'SQL', 'Airflow'],
        projectTechStacks: [
          {
            projectId: 'project-1',
            certificationStatus: 'CERTIFIED',
            values: ['Python', 'FastAPI', 'PostgreSQL'],
          },
        ],
      },
    },
    projects: {
      contractVersion: '2026.08.26-projects-v1',
      readinessStatus: 'READY',
      generationMode: 'DERIVED',
      evidence: evidence('PROJECT:project-1'),
      missingRequirements: [],
      payload: {
        projects: [
          {
            projectId: 'project-1',
            name: 'LLM 추천 시스템',
            period: { startedAt: '2026-03-01', endedAt: '2026-05-10' },
            membershipRole: 'OWNER',
            domain: '추천 시스템',
            scope:
              '사용자 의도에 따라 추천 흐름을 분기하는 API와 배치 파이프라인 구현',
            teamTechStacks: ['Python', 'FastAPI', 'PostgreSQL'],
            teamOutcomes: ['추천 응답 흐름과 관측 지표를 운영 환경에 적용'],
            personalTasks: [
              {
                taskId: 'task-1',
                title: '추천 API 구현',
                workCategory: 'BACKEND',
                status: 'DONE',
              },
            ],
            boardAssignedTaskCount: 5,
            boardCompletedAssignedTaskCount: 5,
            selfReviewStatements: [
              '실패 원인을 재현 가능한 단위로 나눠 해결했습니다.',
            ],
            peerObservations: [
              '문제 상황과 해결 근거를 팀에 명확히 공유했습니다.',
            ],
            troubleshootingCaseIds: ['case-1'],
            peerAxes: [
              { key: '문제해결', score: 4.4 },
              { key: '책임감', score: 4.6 },
            ],
            limitations: [],
          },
        ],
      },
    },
    problemSolving: {
      contractVersion: '2026.08.26-problem-solving-v1',
      readinessStatus: 'READY',
      generationMode: 'DERIVED',
      evidence: evidence('TROUBLESHOOTING:case-1'),
      missingRequirements: [],
      payload: {
        cases: [
          {
            id: 'case-1',
            title: 'Airflow 분산 트레이싱 장애 해결',
            category: '인프라·배포',
            situation:
              'DAG 실패 원인이 서비스 간 로그에서 이어지지 않았습니다.',
            resolution:
              'Trace ID를 전파하고 단계별 로그에 같은 식별자를 기록했습니다.',
            result: '실패 구간을 한 번의 조회로 추적할 수 있게 됐습니다.',
            days: 2,
            independent: true,
            createdAt: '2026-04-12T00:00:00Z',
            technologies: ['Airflow', 'OpenTelemetry'],
          },
        ],
        aggregate: {
          cases: [
            {
              id: 'case-1',
              title: 'Airflow 분산 트레이싱 장애 해결',
              category: '인프라·배포',
              situation:
                'DAG 실패 원인이 서비스 간 로그에서 이어지지 않았습니다.',
              resolution: 'Trace ID를 전파했습니다.',
              result: '실패 구간을 추적할 수 있게 됐습니다.',
              days: 2,
              independent: true,
              createdAt: '2026-04-12T00:00:00Z',
              technologies: ['Airflow'],
            },
          ],
          categories: [{ label: '인프라·배포', count: 1 }],
          averageDays: 2,
          medianDays: 2,
          independentCaseCount: 1,
          supportedCaseCount: 0,
          readinessStatus: 'READY',
        },
      },
    },
    growthReputation: {
      contractVersion: '2026.08.26-growth-reputation-v1',
      readinessStatus: 'READY',
      generationMode: 'DERIVED',
      evidence: evidence('MENTOR_REPUTATION:team-1'),
      missingRequirements: [],
      payload: {
        mentorReputations: [
          {
            teamId: 'team-1',
            evaluationId: 'evaluation-1',
            scoreTech: 4,
            scoreResponsibility: 5,
            scoreCommunication: 4,
            scoreProblemSolving: 5,
            scoreTeamwork: 4,
            comment: '재현 조건과 해결 근거를 명확히 공유합니다.',
            evaluationSubmittedAt: '2026-05-10T00:00:00Z',
            recommendationId: 'recommendation-1',
            recommendationSummary:
              '문제를 구조화하고 끝까지 해결하는 역량이 강점입니다.',
            recommendationSubmittedAt: '2026-05-11T00:00:00Z',
          },
        ],
        projectPeerAxes: [
          { key: '기술/기술기여', score: 4.2 },
          { key: '소통·협업·팀워크', score: 4.4 },
          { key: '문제해결', score: 4.5 },
          { key: '책임감', score: 4.6 },
        ],
      },
    },
    resume: {
      contractVersion: '2026.08.26-resume-v1',
      readinessStatus: 'READY',
      generationMode: 'SOURCE_COPY',
      evidence: evidence('RESUME:resume-1'),
      missingRequirements: [],
      payload: {
        resume: {
          resumeId: 'resume-1',
          title: '데이터 엔지니어 이력서',
          status: 'COMPLETED',
          content: {
            strength:
              '데이터 흐름을 관측 가능한 구조로 만드는 데 강점이 있습니다.',
            skills: ['Python', 'SQL', 'Airflow'],
            projects: ['LLM 추천 시스템'],
          },
          updatedAt: '2026-05-18T09:00:00Z',
        },
      },
    },
    aiAnalysis: {
      contractVersion: '2026.08.26-ai-analysis-v1',
      readinessStatus: 'READY',
      generationMode: 'AI_GENERATED',
      evidence: evidence('AI_EVALUATION'),
      missingRequirements: [],
      payload: { analysis: getAiAnalysis('stu-001') },
    },
  }
}
