import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResumeContentView, parseResumeDoc } from './ResumeDocView'

// 이력서 content는 문서 구조 JSON — 원문이 그대로 노출되면 안 된다(강사 이력서 탭 결함 재발 방지).
const DOC = JSON.stringify({
  basicInfo: {
    name: '박수진',
    phone: '010-1234-5678',
    email: 'sujin.park@example.com',
    birth: '1999-03-15',
    githubUrl: 'https://github.com/sujin-park',
    blogUrl: '',
  },
  strength: 'Spring Boot·JPA 기반 백엔드 개발 경험.',
  skills: ['Java', 'Spring Boot', 'JPA'],
  coverLetters: [{ question: '자기소개', content: '' }],
})

describe('ResumeContentView', () => {
  it('JSON content를 문서 뷰로 렌더한다(원문 노출 없음)', () => {
    render(<ResumeContentView content={DOC} />)
    expect(screen.getByText('박수진')).toBeInTheDocument()
    expect(screen.getByText('기술스택')).toBeInTheDocument()
    expect(screen.getByText('Java')).toBeInTheDocument()
    expect(screen.queryByText(/"basicInfo"/)).not.toBeInTheDocument()
  })

  it('JSON이 아닌 평문은 본문을 잃지 않고 그대로 보여준다', () => {
    render(<ResumeContentView content={'예전 형식의 평문 이력서입니다.'} />)
    expect(
      screen.getByText('예전 형식의 평문 이력서입니다.'),
    ).toBeInTheDocument()
  })

  it('빈 content는 빈 문서 안내를 보여준다', () => {
    render(<ResumeContentView content={null} />)
    expect(screen.getByText('아직 작성된 내용이 없어요.')).toBeInTheDocument()
  })
})

describe('parseResumeDoc', () => {
  it('객체가 아닌 JSON(배열·숫자)은 평문으로 취급한다', () => {
    expect(parseResumeDoc('[1,2,3]')).toBeNull()
    expect(parseResumeDoc('42')).toBeNull()
  })
  it('빈 값은 빈 문서', () => {
    expect(parseResumeDoc('')).toEqual({})
    expect(parseResumeDoc('   ')).toEqual({})
  })
})
