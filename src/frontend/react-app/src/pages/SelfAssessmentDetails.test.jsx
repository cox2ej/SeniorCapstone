import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import SelfAssessmentDetails from './SelfAssessmentDetails.jsx'
import { renderWithProviders } from '../test/testUtils.jsx'

vi.mock('../hooks/useSelfAssessmentDetail.js', () => ({
  useSelfAssessmentDetail: vi.fn(),
}))

vi.mock('../hooks/useAssignmentsData.js', () => ({
  useAssignmentsData: vi.fn(),
}))

import { useSelfAssessmentDetail } from '../hooks/useSelfAssessmentDetail.js'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'

const mockedUseSelfAssessmentDetail = vi.mocked(useSelfAssessmentDetail)
const mockedUseAssignmentsData = vi.mocked(useAssignmentsData)

describe('SelfAssessmentDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockedUseSelfAssessmentDetail.mockReturnValue({
      assessment: {
        id: 77,
        assignment: 33,
        rating: 4,
        comments: 'Strong reflection with clear actions.',
        submitted_at: '2026-03-20T12:00:00Z',
        rubric_scores: { clarity: 4 },
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
      backendEnabled: true,
    })

    mockedUseAssignmentsData.mockReturnValue({
      assignments: [
        {
          id: 33,
          title: 'Week 6 Reflection',
          description: 'Reflect on revision choices.',
          rubric: {
            criteria: [{ id: 'clarity', label: 'Clarity', min_score: 1, max_score: 5 }],
          },
        },
      ],
      loading: false,
      error: null,
      backendEnabled: true,
    })
  })

  it('renders reviewable output for submitted self-assessment including rubric matrix', async () => {
    renderWithProviders(<SelfAssessmentDetails />, { route: '/self-assessments/77' })

    expect(await screen.findByText('Self-assessment details')).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => element?.textContent === 'Overall rating: 4'),
    ).toBeInTheDocument()
    expect(screen.getByText('Strong reflection with clear actions.')).toBeInTheDocument()

    expect(screen.getByText('Rubric scores')).toBeInTheDocument()
    expect(screen.getByText('Clarity')).toBeInTheDocument()
    expect(screen.getByText('Selected: 4 points')).toBeInTheDocument()

    const historyLink = screen.getByRole('link', { name: /View assignment history/i })
    expect(historyLink.getAttribute('href')).toBe('/feedback-history?assignmentId=33')
  })
})
