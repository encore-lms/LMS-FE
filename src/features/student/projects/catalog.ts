// 생성 마법사·설정 탭 공용 카탈로그(정적) — 기술 스택 그룹·도메인·산출물 형태.
// types.ts에서 분리(대형 파일 분해). 기존 import 경로 호환은 types.ts의 재수출로 유지.
import type { Tone } from '@/shared/lib/tone'

export interface StackGroup {
  label: string // "백엔드 언어 / 프레임워크"
  tone: Tone
  items: string[]
}
export const STACK_CATALOG: StackGroup[] = [
  {
    label: '프로그래밍 언어',
    tone: 'brand',
    items: [
      'Java 17',
      'Kotlin',
      'Python',
      'JavaScript',
      'TypeScript',
      'Go',
      'C#',
      'C++',
      'C',
      'PHP',
      'Ruby',
      'Rust',
      'Swift',
      'Scala',
      'R',
    ],
  },
  {
    label: '백엔드 프레임워크',
    tone: 'success',
    items: [
      'Node.js',
      'Spring Boot',
      'Spring',
      'Django',
      'FastAPI',
      'Flask',
      'Express',
      'NestJS',
      '.NET',
      'Ruby on Rails',
    ],
  },
  {
    label: '프론트엔드',
    tone: 'accent',
    items: [
      'React',
      'Next.js',
      'Vue',
      'Nuxt',
      'Angular',
      'Svelte',
      'HTML/CSS',
      'Tailwind CSS',
      'Redux',
      'Zustand',
      'React Query',
      'Vite',
    ],
  },
  {
    label: '모바일',
    tone: 'warning',
    items: [
      'React Native',
      'Flutter',
      'SwiftUI',
      'Jetpack Compose',
      'Android',
      'iOS',
    ],
  },
  {
    label: '데이터베이스 / 캐시',
    tone: 'info',
    items: [
      'PostgreSQL',
      'MySQL',
      'MariaDB',
      'Oracle',
      'MongoDB',
      'Redis',
      'ElasticSearch',
      'DynamoDB',
      'Cassandra',
    ],
  },
  {
    label: '데이터 · ML / 파이썬 라이브러리',
    tone: 'danger',
    items: [
      'NumPy',
      'Pandas',
      'scikit-learn',
      'TensorFlow',
      'PyTorch',
      'Matplotlib',
      'Seaborn',
      'Jupyter',
      'Apache Spark',
      'Airflow',
      'Hadoop',
    ],
  },
  {
    label: '인프라 / DevOps',
    tone: 'brand',
    items: [
      'Docker',
      'Kubernetes',
      'AWS',
      'GCP',
      'Azure',
      'Terraform',
      'Jenkins',
      'GitHub Actions',
      'Nginx',
      'Prometheus',
      'Grafana',
      'ArgoCD',
    ],
  },
  {
    label: '메시징 / 스트리밍',
    tone: 'warning',
    items: ['Apache Kafka', 'RabbitMQ', 'gRPC', 'WebSocket', 'MQTT'],
  },
]
export const DOMAINS: string[] = [
  '커머스',
  '핀테크',
  '미디어·콘텐츠',
  '교육·학습',
  '헬스케어',
  '소셜·커뮤니티',
  '생산성 도구',
  '기타',
]
export const DELIVERABLES: string[] = [
  'GitHub 리포지토리',
  '배포 URL',
  '기술 문서·회고',
  '발표 자료',
  '데모 영상',
]
